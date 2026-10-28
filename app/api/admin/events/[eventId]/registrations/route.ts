import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/src/shared/supabase/server";
import { createAdminClient } from "@/src/shared/supabase/admin";
import { requirePermission, PERMISSIONS } from "@/src/shared/lib/rbac";

export const dynamic = "force-dynamic";

/**
 * Admin registrations sheet — one row per (event, participant), stitched together from
 *   event_registrations → participants → profiles (username)
 *                                      → member_roster → student_data
 * Each table is queried separately and joined here, same as the admin people directory,
 * so nothing depends on PostgREST relationship detection.
 */

type Row = Record<string, unknown>;
type Ctx = { params: Promise<{ eventId: string }> | { eventId: string } };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES = ["registered", "attended", "not_attended"] as const;
type RegStatus = (typeof STATUSES)[number];
const MAX_BATCH = 500;

const asRows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : []);
const str = (v: unknown): string | null => (typeof v === "string" ? v : null);
const isStatus = (v: unknown): v is RegStatus => typeof v === "string" && (STATUSES as readonly string[]).includes(v);

async function eventIdFrom(ctx: Ctx): Promise<string | null> {
  const { eventId } = await ctx.params;
  return UUID_RE.test(eventId) ? eventId : null;
}

async function readJson(req: NextRequest): Promise<Row | null> {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? (b as Row) : null;
  } catch {
    return null;
  }
}

/** Trim free text; empty → null; reject anything absurdly long. */
function cleanText(v: unknown, max: number): { ok: true; value: string | null } | { ok: false } {
  if (v === null || v === undefined) return { ok: true, value: null };
  if (typeof v !== "string") return { ok: false };
  const t = v.trim();
  if (t.length > max) return { ok: false };
  return { ok: true, value: t === "" ? null : t };
}

/** Ticking attended / no-show is admin-only (moderators can still edit everything else). */
async function isAdminUser(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;
  const admin = createAdminClient();
  const { data: p } = await admin.from("participants").select("participant_id").eq("user_id", userId).maybeSingle();
  if (!p) return false;
  const { data: r } = await admin
    .from("participant_roles")
    .select("role")
    .eq("participant_id", p.participant_id)
    .eq("role", "admin")
    .maybeSingle();
  return r !== null;
}

const ADMIN_ONLY_MSG = "Only admins can mark attended or no-show";
const isAttendanceStatus = (v: unknown) => v === "attended" || v === "not_attended";

function idList(v: unknown): string[] | null {
  if (!Array.isArray(v) || v.length === 0 || v.length > MAX_BATCH) return null;
  const ids = v.filter((x): x is string => typeof x === "string" && UUID_RE.test(x));
  return ids.length === v.length ? Array.from(new Set(ids)) : null;
}

// ---------------------------------------------------------------------------
// GET — the whole sheet for one event
// ---------------------------------------------------------------------------
export async function GET(_req: NextRequest, ctx: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const deny = await requirePermission(user?.id, PERMISSIONS.EVENTS_READ);
  if (deny) return deny;

  const eventId = await eventIdFrom(ctx);
  if (!eventId) return NextResponse.json({ error: "Invalid event id" }, { status: 400 });

  const admin = createAdminClient();

  const { data: event } = await admin
    .from("events")
    .select("event_id, name, location, starts_at, ends_at, status, capacity")
    .eq("event_id", eventId)
    .maybeSingle();
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const { data: regs, error } = await admin
    .from("event_registrations")
    .select("participant_id, status, affiliation, note, created_at")
    .eq("event_id", eventId)
    .neq("status", "unregistered")
    .order("created_at", { ascending: true })
    .limit(5000);
  if (error) {
    console.error("[GET registrations]", error.message);
    return NextResponse.json({ error: "Failed to load registrations" }, { status: 500 });
  }

  const regRows = asRows(regs);
  const pids = regRows.map((r) => String(r.participant_id));

  const { data: pData } = pids.length
    ? await admin
        .from("participants")
        .select("participant_id, display_name, supplied_name, email, member_roster_id, user_id")
        .in("participant_id", pids)
    : { data: [] };
  const participants = asRows(pData);

  const uids = participants.map((p) => str(p.user_id)).filter((x): x is string => !!x);
  const mids = participants.map((p) => str(p.member_roster_id)).filter((x): x is string => !!x);

  const [profilesR, rosterR] = await Promise.all([
    uids.length ? admin.from("profiles").select("profile_id, username").in("profile_id", uids) : null,
    mids.length ? admin.from("member_roster").select("member_id, student_number").in("member_id", mids) : null,
  ]);

  const rosterRows = asRows(rosterR?.data);
  const snums = rosterRows.map((r) => str(r.student_number)).filter((x): x is string => !!x);
  const studentsR = snums.length
    ? await admin
        .from("student_data")
        .select("student_number, first_name, middle_name, last_name, year_level, program, section")
        .in("student_number", snums)
    : null;

  const usernameBy = new Map(asRows(profilesR?.data).map((p) => [String(p.profile_id), str(p.username)]));
  const snumByMember = new Map(rosterRows.map((r) => [String(r.member_id), String(r.student_number)]));
  const studentBy = new Map(asRows(studentsR?.data).map((s) => [String(s.student_number), s]));
  const pBy = new Map(participants.map((p) => [String(p.participant_id), p]));

  const rows = regRows.map((r) => {
    const p = pBy.get(String(r.participant_id));
    const uid = p ? str(p.user_id) : null;
    const mid = p ? str(p.member_roster_id) : null;
    const snum = mid ? snumByMember.get(mid) ?? null : null;
    const s = snum ? studentBy.get(snum) : undefined;
    const studentName = s
      ? [s.first_name, s.middle_name, s.last_name].filter((x) => typeof x === "string" && x).join(" ")
      : "";
    return {
      participantId: String(r.participant_id),
      name: (p && (str(p.display_name) || str(p.supplied_name))) || studentName || "Unknown",
      username: uid ? usernameBy.get(uid) ?? null : null,
      email: p ? str(p.email) : null,
      memberId: mid,
      studentNumber: snum,
      program: s ? str(s.program) : null,
      yearLevel: s ? str(s.year_level) : null,
      section: s ? str(s.section) : null,
      affiliation: str(r.affiliation),
      note: str(r.note),
      status: String(r.status) as RegStatus,
      registeredAt: String(r.created_at),
    };
  });

  return NextResponse.json({ event, rows });
}

// ---------------------------------------------------------------------------
// POST — add attendees by hand (walk-ins, late sign-ups).
// Body: { participant_ids: string[], status?: "registered" | "attended" }
// Admin inserts skip the capacity guard for non-"registered" rows by design; for
// "registered" rows the DB trigger still enforces capacity and the window.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest, ctx: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const deny = await requirePermission(user?.id, PERMISSIONS.EVENTS_UPDATE);
  if (deny) return deny;

  const eventId = await eventIdFrom(ctx);
  if (!eventId) return NextResponse.json({ error: "Invalid event id" }, { status: 400 });

  const body = await readJson(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const ids = idList(body.participant_ids);
  if (!ids) return NextResponse.json({ error: `participant_ids must be 1–${MAX_BATCH} valid ids` }, { status: 400 });

  const status = body.status === undefined ? "attended" : body.status;
  if (status !== "registered" && status !== "attended")
    return NextResponse.json({ error: "status must be registered or attended" }, { status: 400 });

  if (isAttendanceStatus(status) && !(await isAdminUser(user?.id)))
    return NextResponse.json({ error: ADMIN_ONLY_MSG }, { status: 403 });

  const admin = createAdminClient();

  const { data: ev } = await admin.from("events").select("event_id").eq("event_id", eventId).maybeSingle();
  if (!ev) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // Skip people who already have a row instead of failing the whole batch.
  const { data: existing } = await admin
    .from("event_registrations")
    .select("participant_id, status")
    .eq("event_id", eventId)
    .in("participant_id", ids);
  // Someone who unregistered keeps their row (status "unregistered"): treat them as addable again.
  const have = new Set(
    asRows(existing).filter((r) => r.status !== "unregistered").map((r) => String(r.participant_id)),
  );
  const fresh = ids.filter((id) => !have.has(id));

  if (fresh.length > 0) {
    const { error } = await admin
      .from("event_registrations")
      .upsert(
        fresh.map((participant_id) => ({ event_id: eventId, participant_id, status })),
        { onConflict: "event_id,participant_id" },
      );
    if (error) {
      if (error.message.includes("EVENT_FULL"))
        return NextResponse.json({ error: "This event is full" }, { status: 409 });
      if (error.message.includes("REGISTRATION_NOT_OPEN"))
        return NextResponse.json({ error: "Registration has not opened yet" }, { status: 422 });
      if (error.message.includes("REGISTRATION_CLOSED"))
        return NextResponse.json({ error: "Registration is closed for this event" }, { status: 422 });
      if (error.code === "23503")
        return NextResponse.json({ error: "One of those participants no longer exists" }, { status: 404 });
      console.error("[POST registrations]", error.message);
      return NextResponse.json({ error: "Failed to add attendees" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, added: fresh.length, skipped: ids.length - fresh.length }, { status: 201 });
}

// ---------------------------------------------------------------------------
// PATCH — edit cells. Two shapes:
//   { participant_ids: string[], status }                       bulk status change
//   { participant_id, status?, affiliation?, note? }            single-row edit
// ---------------------------------------------------------------------------
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const deny = await requirePermission(user?.id, PERMISSIONS.EVENTS_UPDATE);
  if (deny) return deny;

  const eventId = await eventIdFrom(ctx);
  if (!eventId) return NextResponse.json({ error: "Invalid event id" }, { status: 400 });

  const body = await readJson(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const admin = createAdminClient();

  // Bulk status
  if ("participant_ids" in body) {
    const ids = idList(body.participant_ids);
    if (!ids) return NextResponse.json({ error: `participant_ids must be 1–${MAX_BATCH} valid ids` }, { status: 400 });
    if (!isStatus(body.status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    if (isAttendanceStatus(body.status) && !(await isAdminUser(user?.id)))
      return NextResponse.json({ error: ADMIN_ONLY_MSG }, { status: 403 });

    const { error } = await admin
      .from("event_registrations")
      .update({ status: body.status })
      .eq("event_id", eventId)
      .neq("status", "unregistered")
      .in("participant_id", ids);
    if (error) {
      console.error("[PATCH registrations bulk]", error.message);
      return NextResponse.json({ error: "Failed to update attendees" }, { status: 500 });
    }
    return NextResponse.json({ success: true, updated: ids.length });
  }

  // Single row
  const pid = body.participant_id;
  if (typeof pid !== "string" || !UUID_RE.test(pid))
    return NextResponse.json({ error: "participant_id required" }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if ("status" in body) {
    if (!isStatus(body.status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    if (isAttendanceStatus(body.status) && !(await isAdminUser(user?.id)))
      return NextResponse.json({ error: ADMIN_ONLY_MSG }, { status: 403 });
    patch.status = body.status;
  }
  if ("affiliation" in body) {
    const a = cleanText(body.affiliation, 120);
    if (!a.ok) return NextResponse.json({ error: "Affiliation is too long (max 120)" }, { status: 400 });
    patch.affiliation = a.value;
  }
  if ("note" in body) {
    const n = cleanText(body.note, 500);
    if (!n.ok) return NextResponse.json({ error: "Note is too long (max 500)" }, { status: 400 });
    patch.note = n.value;
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const { data, error } = await admin
    .from("event_registrations")
    .update(patch)
    .eq("event_id", eventId)
    .eq("participant_id", pid)
    .neq("status", "unregistered")
    .select("participant_id");
  if (error) {
    console.error("[PATCH registrations]", error.message);
    return NextResponse.json({ error: "Failed to update registration" }, { status: 500 });
  }
  if (!data || data.length === 0) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}

// ---------------------------------------------------------------------------
// DELETE — remove registrations. Body: { participant_ids: string[] }
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const deny = await requirePermission(user?.id, PERMISSIONS.EVENTS_UPDATE);
  if (deny) return deny;

  const eventId = await eventIdFrom(ctx);
  if (!eventId) return NextResponse.json({ error: "Invalid event id" }, { status: 400 });

  const body = await readJson(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const ids = idList(body.participant_ids);
  if (!ids) return NextResponse.json({ error: `participant_ids must be 1–${MAX_BATCH} valid ids` }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("event_registrations")
    .delete()
    .eq("event_id", eventId)
    .in("participant_id", ids);
  if (error) {
    console.error("[DELETE registrations]", error.message);
    return NextResponse.json({ error: "Failed to remove registrations" }, { status: 500 });
  }
  return NextResponse.json({ success: true, removed: ids.length });
}
