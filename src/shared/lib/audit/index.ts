/**
 * src/shared/lib/audit/index.ts
 *
 * Server-only. Appends rows to the audit_log table (migration 20260017) using the
 * service-role client. Logging must never break the action being logged, so
 * logAudit() swallows and console-logs its own errors.
 *
 * Never put passwords, tokens or other secrets in `details`.
 */

import { createAdminClient } from "@/src/shared/supabase/admin";

export type AuditOutcome = "success" | "denied" | "failed";
export type AuditVia = "session" | "api_secret" | "system";

export interface AuditEntryInput {
  /** e.g. "password.reissue", "account.provision", "role.grant" */
  action: string;
  outcome?: AuditOutcome;
  via: AuditVia;
  /** Auth user id of a signed-in actor; resolved to their participant and name. */
  actorUserId?: string | null;
  targetParticipantId?: string | null;
  /** Snapshot shown in the log. Looked up from targetParticipantId when omitted. */
  targetLabel?: string | null;
  details?: Record<string, unknown>;
}

interface PartRow { participant_id: string; user_id: string | null; display_name: string | null; supplied_name: string | null }

const nameOf = (r: Pick<PartRow, "display_name" | "supplied_name">) => r.display_name || r.supplied_name || null;

export async function logAudit(input: AuditEntryInput | AuditEntryInput[]): Promise<void> {
  const entries = Array.isArray(input) ? input : [input];
  if (entries.length === 0) return;

  try {
    const admin = createAdminClient();

    // Resolve actors (by auth user id) and unlabeled targets (by participant id) in two queries.
    const userIds = Array.from(new Set(entries.map((e) => e.actorUserId).filter((v): v is string => !!v)));
    const targetIds = Array.from(
      new Set(entries.filter((e) => e.targetParticipantId && !e.targetLabel).map((e) => e.targetParticipantId as string))
    );

    const actors = new Map<string, { participantId: string; label: string | null }>();
    if (userIds.length > 0) {
      const { data } = await admin
        .from("participants")
        .select("participant_id, user_id, display_name, supplied_name")
        .in("user_id", userIds);
      for (const r of (data ?? []) as PartRow[]) {
        if (r.user_id) actors.set(r.user_id, { participantId: r.participant_id, label: nameOf(r) });
      }
    }

    const targets = new Map<string, string | null>();
    if (targetIds.length > 0) {
      const { data } = await admin
        .from("participants")
        .select("participant_id, user_id, display_name, supplied_name")
        .in("participant_id", targetIds);
      for (const r of (data ?? []) as PartRow[]) targets.set(r.participant_id, nameOf(r));
    }

    const rows = entries.map((e) => {
      const actor = e.actorUserId ? actors.get(e.actorUserId) : undefined;
      return {
        action: e.action,
        outcome: e.outcome ?? "success",
        via: e.via,
        actor_participant_id: actor?.participantId ?? null,
        actor_label: e.via === "api_secret" ? "ADMIN_API_SECRET" : (actor?.label ?? null),
        target_participant_id: e.targetParticipantId ?? null,
        target_label: e.targetLabel ?? (e.targetParticipantId ? (targets.get(e.targetParticipantId) ?? null) : null),
        details: e.details ?? {},
      };
    });

    const { error } = await admin.from("audit_log").insert(rows);
    if (error) console.error("[audit] insert failed:", error.message);
  } catch (err) {
    console.error("[audit] logging failed:", err instanceof Error ? err.message : err);
  }
}
