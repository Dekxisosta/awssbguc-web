/**
 * src/shared/lib/account/deletion.ts
 *
 * Server-only. Hard-deletes accounts for DPA erasure.
 *
 * Deleting the participants row fires trg_cascade_participant_delete
 * (migration 20260013), which removes profiles, member_roster, student_data
 * and the auth.users row. Avatar files live in Storage, which SQL can't
 * clean reliably, so they are removed here first.
 */

import { createAdminClient } from "@/src/shared/supabase/admin";

const AVATAR_BUCKET = "avatars";
const LIST_PAGE_SIZE = 100;

type AdminClient = ReturnType<typeof createAdminClient>;

async function removeAvatarFiles(admin: AdminClient, userId: string): Promise<void> {
  // Loop in case a user somehow has more than one page of objects.
  for (;;) {
    const { data, error } = await admin.storage
      .from(AVATAR_BUCKET)
      .list(userId, { limit: LIST_PAGE_SIZE });

    if (error) throw new Error(`Avatar list failed: ${error.message}`);
    if (!data || data.length === 0) return;

    const paths = data.map((obj: { name: string }) => `${userId}/${obj.name}`);
    const { error: removeError } = await admin.storage.from(AVATAR_BUCKET).remove(paths);
    if (removeError) throw new Error(`Avatar removal failed: ${removeError.message}`);

    if (data.length < LIST_PAGE_SIZE) return;
  }
}

/**
 * Permanently erase one participant and everything linked to it.
 * Avatar files are removed first; if that fails the participant row is NOT
 * deleted, so the erasure can be retried instead of leaving files orphaned.
 */
export async function purgeParticipant(participantId: string): Promise<void> {
  const admin = createAdminClient();

  const { data: participant, error: fetchErr } = await admin
    .from("participants")
    .select("participant_id, user_id")
    .eq("participant_id", participantId)
    .maybeSingle();

  if (fetchErr) throw new Error(`Participant fetch failed: ${fetchErr.message}`);
  if (!participant) return;

  if (participant.user_id) {
    await removeAvatarFiles(admin, participant.user_id as string);
  }

  const { error: deleteErr } = await admin
    .from("participants")
    .delete()
    .eq("participant_id", participantId);

  if (deleteErr) throw new Error(`Participant delete failed: ${deleteErr.message}`);
}

export interface ScheduledDeletionResult {
  deleted: string[];
  failed: { participantId: string; reason: string }[];
}

/**
 * Purge every participant whose scheduled deletion date has passed.
 * deletion_scheduled_at is the date the account is due for deletion
 * (set to now + 30 days when the user requests it).
 */
export async function processScheduledAccountDeletions(): Promise<ScheduledDeletionResult> {
  const admin = createAdminClient();

  const { data: due, error } = await admin
    .from("participants")
    .select("participant_id")
    .not("deletion_scheduled_at", "is", null)
    .lte("deletion_scheduled_at", new Date().toISOString())
    .is("deleted_at", null);

  if (error) throw new Error(`Due-deletion query failed: ${error.message}`);

  const result: ScheduledDeletionResult = { deleted: [], failed: [] };

  for (const row of due ?? []) {
    const participantId = row.participant_id as string;
    try {
      await purgeParticipant(participantId);
      result.deleted.push(participantId);
    } catch (err) {
      result.failed.push({
        participantId,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return result;
}
