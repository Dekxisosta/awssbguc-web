import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createClient } from "@/src/shared/supabase/server";
import { createAdminClient } from "@/src/shared/supabase/admin";
import { provisionMemberWithEmail, provisionMembersWithEmail, reissueTemporaryPassword } from "@/src/shared/lib/account/service";
import { isMailConfigured, sendCredentialEmails } from "@/src/shared/lib/mail";
import { logAudit } from "@/src/shared/lib/audit";

function adminSecretValid(request: NextRequest): boolean {
  const secret = process.env.ADMIN_API_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "development") return true;
    console.error("[provision] ADMIN_API_SECRET is not set.");
    return false;
  }
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  const provided = authHeader.slice("Bearer ".length);
  try {
    const secretBuf = Buffer.from(secret, "utf8");
    const providedBuf = Buffer.from(provided, "utf8");
    if (secretBuf.length !== providedBuf.length) { timingSafeEqual(secretBuf, secretBuf); return false; }
    return timingSafeEqual(secretBuf, providedBuf);
  } catch { return false; }
}

/** The auth user id of the signed-in caller when their participant has the admin role, else null. */
async function adminSessionUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const admin = await createAdminClient();
    const { data: participant } = await admin
      .from("participants")
      .select("participant_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!participant) return null;

    const { data: role } = await admin
      .from("participant_roles")
      .select("role")
      .eq("participant_id", participant.participant_id)
      .eq("role", "admin")
      .maybeSingle();
    return role ? user.id : null;
  } catch (err) {
    console.error("[provision] admin session check failed:", err);
    return null;
  }
}

/** True when the request carries a signed-in session whose participant has the admin role. */
async function callerIsAdmin(): Promise<boolean> {
  return (await adminSessionUserId()) !== null;
}

/**
 * Two ways in:
 *  - an admin's browser session (used by the /admin dashboard), or
 *  - the ADMIN_API_SECRET bearer token (scripts / curl, see docs/account-creation.md).
 * The secret never ships to the browser.
 */
async function isAuthorized(request: NextRequest): Promise<boolean> {
  if (await callerIsAdmin()) return true;
  return adminSecretValid(request);
}

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidMemberId(value: unknown): value is string {
  return typeof value === "string" && /^SBG-UC-\d{6}$/.test(value);
}

// ---------------------------------------------------------------------------
// GET /api/admin/provision/pending — members who have no login account yet
// ---------------------------------------------------------------------------

interface RosterRow { member_id: string; student_number: string }
interface ParticipantRow { member_roster_id: string | null; user_id: string | null; email: string | null; supplied_name: string | null }
interface StudentRow { student_number: string; first_name: string | null; middle_name: string | null; last_name: string | null; email: string | null }

export async function handlePending(request: NextRequest) {
  if (!(await isAuthorized(request)))
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const admin = await createAdminClient();

  const [rosterRes, partRes] = await Promise.all([
    admin.from("member_roster").select("member_id, student_number").order("member_id").range(0, 4999),
    admin
      .from("participants")
      .select("member_roster_id, user_id, email, supplied_name")
      .not("member_roster_id", "is", null)
      .range(0, 4999),
  ]);

  if (rosterRes.error || partRes.error) {
    console.error("[provision/pending]", rosterRes.error?.message ?? partRes.error?.message);
    return NextResponse.json({ error: "Failed to load members." }, { status: 500 });
  }

  const roster = (rosterRes.data ?? []) as RosterRow[];
  const participants = (partRes.data ?? []) as ParticipantRow[];

  const byMember = new Map<string, ParticipantRow>();
  for (const p of participants) if (p.member_roster_id) byMember.set(p.member_roster_id, p);

  // A member is "pending" when no participant row has an auth user linked.
  const pendingRoster = roster.filter((r) => !byMember.get(r.member_id)?.user_id);

  // student_data in chunks to keep the request URL short.
  const students = new Map<string, StudentRow>();
  const numbers = Array.from(new Set(pendingRoster.map((r) => r.student_number)));
  for (let i = 0; i < numbers.length; i += 100) {
    const { data, error } = await admin
      .from("student_data")
      .select("student_number, first_name, middle_name, last_name, email")
      .in("student_number", numbers.slice(i, i + 100));
    if (error) {
      console.error("[provision/pending] student_data:", error.message);
      return NextResponse.json({ error: "Failed to load member details." }, { status: 500 });
    }
    for (const s of (data ?? []) as StudentRow[]) students.set(s.student_number, s);
  }

  const members = pendingRoster.map((r) => {
    const part = byMember.get(r.member_id);
    const stu = students.get(r.student_number);
    const name =
      [stu?.first_name, stu?.middle_name, stu?.last_name].filter(Boolean).join(" ").trim() ||
      part?.supplied_name ||
      r.member_id;
    return {
      memberId: r.member_id,
      studentNumber: r.student_number,
      name,
      email: part?.email ?? stu?.email ?? null,
    };
  });

  return NextResponse.json({
    members,
    accountCount: roster.length - pendingRoster.length,
    mailConfigured: isMailConfigured(),
  });
}

// ---------------------------------------------------------------------------
// POST /api/admin/provision — single or bulk, optionally emailing credentials
// ---------------------------------------------------------------------------

export async function handleProvision(request: NextRequest) {
  if (!(await isAuthorized(request)))
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const sessionUserId = await adminSessionUserId();
  const via = sessionUserId ? "session" : "api_secret";

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }

  const { memberId, email, members, sendEmail } = (body ?? {}) as {
    memberId?: unknown; email?: unknown; members?: unknown; sendEmail?: unknown;
  };

  if (memberId !== undefined || email !== undefined) {
    if (!isValidMemberId(memberId))
      return NextResponse.json({ error: "memberId must be a valid SBG member ID (e.g. SBG-UC-260001)." }, { status: 400 });
    if (!isValidEmail(email))
      return NextResponse.json({ error: "email must be a valid email address." }, { status: 400 });
    try {
      const result = await provisionMemberWithEmail({ memberId, email });
      await logAudit({
        action: "account.provision", via, actorUserId: sessionUserId,
        targetLabel: memberId, details: { memberId, email, emailed: false },
      });
      return NextResponse.json({ success: true, result }, { status: 201 });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[provision] Failed for member ${memberId}:`, message);
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
  }

  if (members !== undefined) {
    if (!Array.isArray(members) || members.length === 0)
      return NextResponse.json({ error: "members must be a non-empty array." }, { status: 400 });
    if (members.length > 100)
      return NextResponse.json({ error: "Maximum 100 members per request." }, { status: 400 });
    const invalid = members.find((m) => !isValidMemberId(m?.memberId) || !isValidEmail(m?.email));
    if (invalid)
      return NextResponse.json({ error: "Each entry must have a valid memberId and email." }, { status: 400 });

    const entries = members as Array<{ memberId: string; email: string; name?: unknown }>;
    const result = await provisionMembersWithEmail(entries.map((m) => ({ memberId: m.memberId, email: m.email })));

    // Optional: email each new account its temporary password.
    const wantsMail = sendEmail === true;
    let mail: { requested: boolean; configured: boolean; sent: string[]; failed: { memberId: string; reason: string }[] } = {
      requested: wantsMail,
      configured: isMailConfigured(),
      sent: [],
      failed: [],
    };

    if (wantsMail && result.credentials.length > 0) {
      const nameById = new Map(
        entries.map((m) => [m.memberId, typeof m.name === "string" ? m.name.trim().slice(0, 100) : ""])
      );
      const outcome = await sendCredentialEmails(
        result.credentials.map((c) => ({
          memberId: c.memberId,
          to: c.email,
          name: nameById.get(c.memberId) ?? "",
          temporaryPassword: c.temporaryPassword,
        }))
      );
      mail = { ...mail, ...outcome };
    }

    const names = new Map(entries.map((m) => [m.memberId, typeof m.name === "string" ? m.name.trim().slice(0, 100) : ""]));
    const labelFor = (id: string) => (names.get(id) ? `${names.get(id)} (${id})` : id);
    await logAudit([
      ...result.credentials.map((c) => ({
        action: "account.provision", via: via as "session" | "api_secret", actorUserId: sessionUserId,
        targetLabel: labelFor(c.memberId),
        details: { memberId: c.memberId, email: c.email, emailed: mail.sent.includes(c.memberId) },
      })),
      ...result.errors.map((er) => ({
        action: "account.provision", outcome: "failed" as const, via: via as "session" | "api_secret", actorUserId: sessionUserId,
        targetLabel: labelFor(er.memberId), details: { memberId: er.memberId, reason: er.reason },
      })),
    ]);

    return NextResponse.json({ success: true, ...result, mail }, { status: 201 });
  }

  return NextResponse.json(
    { error: "Provide either { memberId, email } (single) or { members: [...] } (bulk)." },
    { status: 400 }
  );
}

// ---------------------------------------------------------------------------
// POST /api/admin/provision/reissue — new temporary password for an existing account
//
// Body: { participantId: string, sendEmail?: boolean }
// Accounts that hold the admin role can only be reissued with the ADMIN_API_SECRET
// bearer token, never from a browser session alone.
// ---------------------------------------------------------------------------

const REISSUE_COOLDOWN_MS = 60_000;
// Best effort: lives in this server instance's memory, so it resets on restart / other instances.
const lastReissue = new Map<string, number>();

export async function handleReissue(request: NextRequest) {
  const sessionUserId = await adminSessionUserId();
  const viaSecret = adminSecretValid(request);
  if (!sessionUserId && !viaSecret)
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }

  const { participantId, sendEmail } = (body ?? {}) as { participantId?: unknown; sendEmail?: unknown };
  if (typeof participantId !== "string" || participantId.length === 0 || participantId.length > 100)
    return NextResponse.json({ error: "participantId is required." }, { status: 400 });

  const admin = await createAdminClient();

  const { data: partData, error: partError } = await admin
    .from("participants")
    .select("participant_id, user_id, supplied_name")
    .eq("participant_id", participantId)
    .maybeSingle();
  if (partError) {
    console.error("[reissue] participant lookup failed:", partError.message);
    return NextResponse.json({ error: "Failed to look up the member." }, { status: 500 });
  }
  const part = partData as { participant_id: string; user_id: string | null; supplied_name: string | null } | null;
  if (!part)
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  if (!part.user_id)
    return NextResponse.json({ error: "This member has no login account yet. Provision them instead." }, { status: 400 });
  if (sessionUserId && part.user_id === sessionUserId)
    return NextResponse.json({ error: "You can't reissue your own password here." }, { status: 400 });

  const { data: adminRole } = await admin
    .from("participant_roles")
    .select("role")
    .eq("participant_id", part.participant_id)
    .eq("role", "admin")
    .maybeSingle();
  const reissueVia = sessionUserId ? "session" : "api_secret";
  const reissueTarget = { targetParticipantId: part.participant_id, targetLabel: part.supplied_name };
  if (adminRole && !viaSecret) {
    await logAudit({
      action: "password.reissue", outcome: "denied", via: reissueVia, actorUserId: sessionUserId, ...reissueTarget,
      details: { reason: "Target holds the admin role; ADMIN_API_SECRET required." },
    });
    return NextResponse.json(
      { error: "Admin accounts can only be reissued with the ADMIN_API_SECRET (API), not from the dashboard." },
      { status: 403 }
    );
  }

  const now = Date.now();
  const last = lastReissue.get(part.participant_id);
  if (last && now - last < REISSUE_COOLDOWN_MS) {
    const wait = Math.ceil((REISSUE_COOLDOWN_MS - (now - last)) / 1000);
    return NextResponse.json({ error: `A password was just reissued for this member. Try again in ${wait}s.` }, { status: 429 });
  }

  let issued: { temporaryPassword: string; email: string | null };
  try {
    issued = await reissueTemporaryPassword(part.user_id);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[reissue] failed for participant ${part.participant_id}:`, message);
    await logAudit({
      action: "password.reissue", outcome: "failed", via: reissueVia, actorUserId: sessionUserId, ...reissueTarget,
      details: { error: message },
    });
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  lastReissue.set(part.participant_id, now);
  console.info(`[reissue] temporary password reissued for participant ${part.participant_id} by ${sessionUserId ? `admin session ${sessionUserId}` : "ADMIN_API_SECRET"}`);

  const wantsMail = sendEmail === true;
  let mail: { requested: boolean; configured: boolean; sent: string[]; failed: { memberId: string; reason: string }[] } = {
    requested: wantsMail,
    configured: isMailConfigured(),
    sent: [],
    failed: [],
  };

  if (wantsMail) {
    if (!issued.email) {
      mail.failed.push({ memberId: part.participant_id, reason: "This account has no email address." });
    } else {
      const outcome = await sendCredentialEmails([
        {
          memberId: part.participant_id,
          to: issued.email,
          name: (part.supplied_name ?? "").trim().slice(0, 100),
          temporaryPassword: issued.temporaryPassword,
          reset: true,
        },
      ]);
      mail = { ...mail, ...outcome };
    }
  }

  // The password is only returned when it was NOT successfully emailed.
  const emailed = mail.sent.length > 0;
  await logAudit({
    action: "password.reissue", via: reissueVia, actorUserId: sessionUserId, ...reissueTarget,
    details: { emailRequested: wantsMail, emailed, ...(wantsMail && !emailed ? { emailFailure: mail.failed[0]?.reason ?? "Not sent." } : {}) },
  });
  return NextResponse.json({
    success: true,
    email: issued.email,
    temporaryPassword: emailed ? null : issued.temporaryPassword,
    mail,
  });
}
