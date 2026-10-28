import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/src/shared/supabase/server";
import { createAdminClient } from "@/src/shared/supabase/admin";
import { requirePermission, PERMISSIONS } from "@/src/shared/lib/rbac";
import { EDITABLE_FIELDS, normalize, type EditableField } from "@/src/entities/student-data";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES = ["pending", "approved", "rejected", "cancelled"] as const;
type Row = Record<string, unknown>;

const asRows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : []);

// ---------------------------------------------------------------------------
// GET /api/admin/student-data-requests?status=pending|approved|rejected|cancelled|all&limit=50
// Each request carries the participant, and the student record's *live* values
// for the changed fields, so the reviewer can see if the record has moved on
// since the request was filed.
// ---------------------------------------------------------------------------
export async function handleListRequests(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const deny = await requirePermission(user?.id, PERMISSIONS.STUDENT_DATA_REVIEW);
  if (deny) return deny;

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") ?? "pending";
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50));
  if (status !== "all" && !(STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Invalid status filter." }, { status: 400 });
  }

  const admin = createAdminClient();

  let query = admin
    .from("student_data_change_requests")
    .select(
      "request_id, participant_id, student_number, current_values, requested_values, reason, status, reviewed_by, reviewed_at, review_note, created_at"
    )
    // Oldest first for the queue, newest first for history.
    .order("created_at", { ascending: status === "pending" })
    .limit(limit);
  if (status !== "all") query = query.eq("status", status);

  const [{ data, error }, pendingRes] = await Promise.all([
    query,
    admin
      .from("student_data_change_requests")
      .select("request_id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  if (error) {
    console.error("[GET /api/admin/student-data-requests]", error.message);
    return NextResponse.json({ error: "Failed to load requests." }, { status: 500 });
  }

  const requests = asRows(data);
  const pids = [...new Set(requests.flatMap((r) => [r.participant_id, r.reviewed_by]).filter((x): x is string => typeof x === "string"))];
  const snums = [...new Set(requests.map((r) => r.student_number).filter((x): x is string => typeof x === "string"))];

  const [peopleR, studentsR] = await Promise.all([
    pids.length
      ? admin.from("participants").select("participant_id, display_name, supplied_name, email, member_roster_id").in("participant_id", pids)
      : null,
    snums.length
      ? admin.from("student_data").select("student_number, first_name, middle_name, last_name, year_level, program, section").in("student_number", snums)
      : null,
  ]);

  const people = new Map(asRows(peopleR?.data).map((p) => [String(p.participant_id), p]));
  const students = new Map(asRows(studentsR?.data).map((s) => [String(s.student_number), s]));

  const out = requests.map((r) => {
    const person = people.get(String(r.participant_id));
    const reviewer = r.reviewed_by ? people.get(String(r.reviewed_by)) : null;
    const live = students.get(String(r.student_number)) ?? null;
    const changed = Object.keys((r.requested_values as Row) ?? {}) as EditableField[];
    const liveValues: Partial<Record<EditableField, string | null>> = {};
    if (live) for (const f of changed) liveValues[f] = (live[f] as string | null) ?? null;

    return {
      ...r,
      participant: person
        ? {
            display_name: person.display_name,
            supplied_name: person.supplied_name,
            email: person.email,
            member_id: person.member_roster_id,
          }
        : null,
      reviewer_name: reviewer ? (reviewer.display_name as string) : null,
      live_values: live ? liveValues : null,
    };
  });

  return NextResponse.json({ requests: out, pendingCount: pendingRes.count ?? 0 });
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/student-data-requests/[requestId]
// Body: { decision: "approve" | "reject", note?: string }   (note required to reject)
// ---------------------------------------------------------------------------
export async function handleReviewRequest(requestId: string, req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const deny = await requirePermission(user?.id, PERMISSIONS.STUDENT_DATA_REVIEW);
  if (deny) return deny;

  if (!UUID_RE.test(requestId)) return NextResponse.json({ error: "Request not found." }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { decision, note } = (body ?? {}) as { decision?: unknown; note?: unknown };

  if (decision !== "approve" && decision !== "reject") {
    return NextResponse.json({ error: "decision must be 'approve' or 'reject'." }, { status: 400 });
  }
  const cleanNote = normalize(note);
  if (cleanNote.length > 500) {
    return NextResponse.json({ error: "Keep the note under 500 characters." }, { status: 400 });
  }
  if (decision === "reject" && cleanNote.length < 3) {
    return NextResponse.json({ error: "Add a short note so the member knows why it was rejected." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: me } = await admin
    .from("participants")
    .select("participant_id")
    .eq("user_id", user!.id)
    .maybeSingle();
  if (!me) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const { data: status, error } = await admin.rpc("review_student_data_change_request", {
    p_request_id: requestId,
    p_reviewer: me.participant_id,
    p_decision: decision,
    p_note: cleanNote || null,
  });

  if (error) {
    if (error.code === "P0002") return NextResponse.json({ error: error.message }, { status: 404 });
    if (error.code === "55000") return NextResponse.json({ error: error.message }, { status: 409 });
    console.error("[PATCH /api/admin/student-data-requests] rpc failed:", error.message);
    return NextResponse.json({ error: "Failed to save the decision." }, { status: 500 });
  }

  return NextResponse.json({ success: true, status });
}
