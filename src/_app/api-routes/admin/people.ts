import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/src/shared/supabase/server";
import { createAdminClient } from "@/src/shared/supabase/admin";

/**
 * Admin "people" directory — one row per participant, stitched together from
 *   participants → profiles (user_id)
 *               → member_roster → student_data (member_roster_id → student_number)
 *               → participant_roles
 *               → event_registrations → events
 * Each table is queried separately and joined here, so the lookups never depend on
 * PostgREST relationship detection (participants ↔ profiles has no direct FK).
 */

type Admin = Awaited<ReturnType<typeof createAdminClient>>;
type Row = Record<string, unknown>;

const PAGE_SIZE = 25;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LIST_COLS = "participant_id, supplied_name, email, member_roster_id, user_id, display_name, status";

async function requireAdmin(): Promise<{ admin: Admin } | { res: NextResponse }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const admin = await createAdminClient();
  const { data: me } = await admin.from("participants").select("participant_id").eq("user_id", user.id).maybeSingle();
  if (!me) return { res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  const { data: role } = await admin
    .from("participant_roles")
    .select("role")
    .eq("participant_id", me.participant_id)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) return { res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { admin };
}

const asRows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : []);
const str = (v: unknown): string | null => (typeof v === "string" ? v : null);

// ---------------------------------------------------------------------------
// GET /api/admin/people?page=1&q=…&filter=all|members|accounts|no_account|guests
// ---------------------------------------------------------------------------
export async function handlePeopleList(req: NextRequest) {
  const guard = await requireAdmin();
  if ("res" in guard) return guard.res;
  const { admin } = guard;

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const filter = searchParams.get("filter") ?? "all";
  // Letters, digits, and a few harmless symbols only — nothing that can break the filter syntax.
  const q = (searchParams.get("q") ?? "").replace(/[^\p{L}\p{N}@.\-_ ]/gu, "").trim().slice(0, 60);

  const from = (page - 1) * PAGE_SIZE;
  let query = admin
    .from("participants")
    .select(LIST_COLS, { count: "exact" })
    .order("display_name", { ascending: true })
    .range(from, from + PAGE_SIZE - 1);

  if (filter === "members") query = query.not("member_roster_id", "is", null);
  else if (filter === "accounts") query = query.not("user_id", "is", null);
  else if (filter === "no_account") query = query.is("user_id", null);
  else if (filter === "guests") query = query.is("member_roster_id", null);

  if (q) {
    const conds = [
      `display_name.ilike.%${q}%`,
      `supplied_name.ilike.%${q}%`,
      `email.ilike.%${q}%`,
      `member_roster_id.ilike.%${q}%`,
    ];

    // Also match on username (profiles) and real name / student number (student_data → roster).
    const { data: profs } = await admin.from("profiles").select("profile_id").ilike("username", `%${q}%`).limit(50);
    const uids = asRows(profs).map((p) => str(p.profile_id)).filter((x): x is string => !!x);
    if (uids.length) conds.push(`user_id.in.(${uids.join(",")})`);

    const { data: studs } = await admin
      .from("student_data")
      .select("student_number")
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,student_number.ilike.%${q}%`)
      .limit(50);
    const snums = asRows(studs).map((s) => str(s.student_number)).filter((x): x is string => !!x);
    if (snums.length) {
      const { data: rost } = await admin.from("member_roster").select("member_id").in("student_number", snums);
      const mids = asRows(rost).map((r) => str(r.member_id)).filter((x): x is string => !!x);
      if (mids.length) conds.push(`member_roster_id.in.(${mids.join(",")})`);
    }

    query = query.or(conds.join(","));
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("[GET /api/admin/people]", error.message);
    return NextResponse.json({ error: "Failed to load people" }, { status: 500 });
  }

  const people = asRows(data);
  const pids = people.map((p) => String(p.participant_id));
  const uids = people.map((p) => str(p.user_id)).filter((x): x is string => !!x);
  const mids = people.map((p) => str(p.member_roster_id)).filter((x): x is string => !!x);

  const [rolesR, profilesR, rosterR, regsR] = await Promise.all([
    pids.length ? admin.from("participant_roles").select("participant_id, role").in("participant_id", pids) : null,
    uids.length ? admin.from("profiles").select("*").in("profile_id", uids) : null,
    mids.length ? admin.from("member_roster").select("member_id, student_number").in("member_id", mids) : null,
    pids.length ? admin.from("event_registrations").select("participant_id, status").in("participant_id", pids) : null,
  ]);

  const rosterRows = asRows(rosterR?.data);
  const snums = rosterRows.map((r) => str(r.student_number)).filter((x): x is string => !!x);
  const studentsR = snums.length
    ? await admin
        .from("student_data")
        .select("student_number, first_name, middle_name, last_name, year_level, program, section, email")
        .in("student_number", snums)
    : null;

  const rolesBy = new Map<string, string[]>();
  for (const r of asRows(rolesR?.data)) {
    const k = String(r.participant_id);
    rolesBy.set(k, [...(rolesBy.get(k) ?? []), String(r.role)]);
  }
  const profileBy = new Map(asRows(profilesR?.data).map((p) => [String(p.profile_id), p]));
  const snumByMember = new Map(rosterRows.map((r) => [String(r.member_id), String(r.student_number)]));
  const studentBy = new Map(asRows(studentsR?.data).map((s) => [String(s.student_number), s]));
  const evBy = new Map<string, { registered: number; attended: number; notAttended: number }>();
  for (const r of asRows(regsR?.data)) {
    const k = String(r.participant_id);
    const cur = evBy.get(k) ?? { registered: 0, attended: 0, notAttended: 0 };
    cur.registered += 1;
    if (r.status === "attended") cur.attended += 1;
    if (r.status === "not_attended") cur.notAttended += 1;
    evBy.set(k, cur);
  }

  const result = people.map((p) => {
    const uid = str(p.user_id);
    const mid = str(p.member_roster_id);
    const snum = mid ? snumByMember.get(mid) : undefined;
    return {
      participantId: String(p.participant_id),
      displayName: String(p.display_name),
      suppliedName: String(p.supplied_name),
      email: str(p.email),
      status: String(p.status),
      userId: uid,
      memberId: mid,
      roles: rolesBy.get(String(p.participant_id)) ?? [],
      profile: uid ? profileBy.get(uid) ?? null : null,
      student: snum ? studentBy.get(snum) ?? null : null,
      events: evBy.get(String(p.participant_id)) ?? { registered: 0, attended: 0, notAttended: 0 },
    };
  });

  return NextResponse.json({
    people: result,
    total: count ?? 0,
    page,
    totalPages: count ? Math.ceil(count / PAGE_SIZE) : 1,
  });
}

// ---------------------------------------------------------------------------
// GET /api/admin/people/:participantId — every linked table for one person
// ---------------------------------------------------------------------------
export async function handlePersonDetail(participantId: string) {
  const guard = await requireAdmin();
  if ("res" in guard) return guard.res;
  const { admin } = guard;

  if (!UUID_RE.test(participantId)) return NextResponse.json({ error: "Invalid participant id" }, { status: 400 });

  const { data: pRow, error } = await admin.from("participants").select("*").eq("participant_id", participantId).maybeSingle();
  if (error) {
    console.error("[GET /api/admin/people/:id]", error.message);
    return NextResponse.json({ error: "Failed to load participant" }, { status: 500 });
  }
  if (!pRow) return NextResponse.json({ error: "Participant not found" }, { status: 404 });

  // qr_token is a check-in credential — never sent to the browser.
  const { qr_token: _qr, ...participant } = pRow as Row;
  void _qr;

  const uid = str(participant.user_id);
  const mid = str(participant.member_roster_id);

  const [rolesR, profileR, rosterR, regsR] = await Promise.all([
    admin.from("participant_roles").select("role, granted_at").eq("participant_id", participantId),
    uid ? admin.from("profiles").select("*").eq("profile_id", uid).maybeSingle() : null,
    mid ? admin.from("member_roster").select("*").eq("member_id", mid).maybeSingle() : null,
    admin.from("event_registrations").select("event_id, status, affiliation, note, created_at").eq("participant_id", participantId),
  ]);

  const roster = (rosterR?.data as Row | null) ?? null;
  const snum = roster ? str(roster.student_number) : null;
  const studentR = snum ? await admin.from("student_data").select("*").eq("student_number", snum).maybeSingle() : null;

  const regs = asRows(regsR.data);
  const eventIds = regs.map((r) => String(r.event_id));
  const eventsR = eventIds.length
    ? await admin.from("events").select("event_id, name, location, starts_at, ends_at, status").in("event_id", eventIds)
    : null;
  const eventBy = new Map(asRows(eventsR?.data).map((e) => [String(e.event_id), e]));

  const registrations = regs
    .map((r) => {
      const e = eventBy.get(String(r.event_id)) ?? {};
      return {
        event_id: String(r.event_id),
        name: str(e.name) ?? "(deleted event)",
        location: str(e.location),
        starts_at: str(e.starts_at),
        ends_at: str(e.ends_at),
        event_status: str(e.status),
        status: String(r.status),
        affiliation: str(r.affiliation),
        note: str(r.note),
        registered_at: str(r.created_at),
      };
    })
    .sort((a, b) => (b.starts_at ?? "").localeCompare(a.starts_at ?? ""));

  return NextResponse.json({
    participant,
    roles: asRows(rolesR.data),
    profile: (profileR?.data as Row | null) ?? null,
    roster,
    student: (studentR?.data as Row | null) ?? null,
    registrations,
  });
}
