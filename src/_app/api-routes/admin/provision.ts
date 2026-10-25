import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createClient } from "@/src/shared/supabase/server";
import { createAdminClient } from "@/src/shared/supabase/admin";
import { provisionMemberWithEmail, provisionMembersWithEmail } from "@/src/shared/lib/account/service";
import { isMailConfigured, sendCredentialEmails } from "@/src/shared/lib/mail";

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

/** True when the request carries a signed-in session whose participant has the admin role. */
async function callerIsAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const admin = await createAdminClient();
    const { data: participant } = await admin
      .from("participants")
      .select("participant_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!participant) return false;

    const { data: role } = await admin
      .from("participant_roles")
      .select("role")
      .eq("participant_id", participant.participant_id)
      .eq("role", "admin")
      .maybeSingle();
    return !!role;
  } catch (err) {
    console.error("[provision] admin session check failed:", err);
    return false;
  }
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

    return NextResponse.json({ success: true, ...result, mail }, { status: 201 });
  }

  return NextResponse.json(
    { error: "Provide either { memberId, email } (single) or { members: [...] } (bulk)." },
    { status: 400 }
  );
}
