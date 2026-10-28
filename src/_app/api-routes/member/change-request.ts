import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/shared/supabase/server";
import { createAdminClient } from "@/src/shared/supabase/admin";
import { loadOwnStudentRecord } from "@/src/shared/lib/student-data/service";
import {
  diffStudentValues,
  validateReason,
  type EditableField,
  type StudentValues,
} from "@/src/entities/student-data";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Filing, withdrawing and refiling in a loop is the only way to spam reviewers. */
const MAX_REQUESTS_PER_DAY = 5;

function json(body: object, status: number) {
  return NextResponse.json(body, { status });
}

// ---------------------------------------------------------------------------
// POST /api/member/change-requests
// Body: { changes: { first_name?, middle_name?, last_name?, year_level?, program?, section? }, reason }
// The student number is never read from the body — it comes from the caller's own membership.
// ---------------------------------------------------------------------------
export async function handleCreateChangeRequest(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ success: false, error: "You must be signed in." }, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Invalid JSON body." }, 400);
  }
  const raw = (body ?? {}) as Record<string, unknown>;
  if (typeof raw.changes !== "object" || raw.changes === null || Array.isArray(raw.changes)) {
    return json({ success: false, error: "Nothing to change." }, 400);
  }

  const reason = validateReason(raw.reason);
  if (!reason.ok) return json({ success: false, error: reason.error, field: "reason" }, 400);

  let record;
  try {
    record = await loadOwnStudentRecord(user.id);
  } catch (e) {
    console.error("[POST /api/member/change-requests] load failed:", (e as Error).message);
    return json({ success: false, error: "Something went wrong. Please try again." }, 500);
  }
  if (!record) {
    return json({ success: false, error: "You don't have a membership record to change yet." }, 409);
  }

  const diff = diffStudentValues(record.values, raw.changes as Record<string, unknown>);
  if (!diff.ok) return json({ success: false, error: diff.error, field: diff.field }, 400);

  const admin = createAdminClient();

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countErr } = await admin
    .from("student_data_change_requests")
    .select("request_id", { count: "exact", head: true })
    .eq("participant_id", record.participantId)
    .gte("created_at", since);
  if (countErr) {
    console.error("[POST /api/member/change-requests] count failed:", countErr.message);
    return json({ success: false, error: "Something went wrong. Please try again." }, 500);
  }
  if ((count ?? 0) >= MAX_REQUESTS_PER_DAY) {
    return json({ success: false, error: "You've sent a lot of requests today. Please try again tomorrow." }, 429);
  }

  // Snapshot the old value of just the fields being changed.
  const currentValues: Partial<StudentValues> = {};
  for (const field of Object.keys(diff.changes) as EditableField[]) {
    currentValues[field] = record.values[field];
  }

  const { data: created, error: insertErr } = await admin
    .from("student_data_change_requests")
    .insert({
      participant_id: record.participantId,
      student_number: record.studentNumber,
      current_values: currentValues,
      requested_values: diff.changes,
      reason: reason.reason,
    })
    .select("request_id")
    .single();

  if (insertErr) {
    // Unique violation on the one-pending-per-participant index.
    if (insertErr.code === "23505") {
      return json({
        success: false,
        error: "You already have a request waiting for review. Withdraw it first if you want to change it.",
      }, 409);
    }
    console.error("[POST /api/member/change-requests] insert failed:", insertErr.message);
    return json({ success: false, error: "Something went wrong. Please try again." }, 500);
  }

  return json({ success: true, requestId: created.request_id }, 201);
}

// ---------------------------------------------------------------------------
// DELETE /api/member/change-requests/[requestId]
// Withdraws the caller's own pending request.
// ---------------------------------------------------------------------------
export async function handleCancelChangeRequest(requestId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ success: false, error: "You must be signed in." }, 401);

  if (!UUID_RE.test(requestId)) return json({ success: false, error: "Request not found." }, 404);

  const admin = createAdminClient();
  const { data: participant, error: pErr } = await admin
    .from("participants")
    .select("participant_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (pErr) {
    console.error("[DELETE /api/member/change-requests] participant lookup failed:", pErr.message);
    return json({ success: false, error: "Something went wrong. Please try again." }, 500);
  }
  if (!participant) return json({ success: false, error: "Request not found." }, 404);

  // Ownership and state are part of the WHERE clause, so another user's
  // request (or an already-reviewed one) simply matches nothing.
  const { data: updated, error } = await admin
    .from("student_data_change_requests")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("request_id", requestId)
    .eq("participant_id", participant.participant_id)
    .eq("status", "pending")
    .select("request_id");

  if (error) {
    console.error("[DELETE /api/member/change-requests] update failed:", error.message);
    return json({ success: false, error: "Something went wrong. Please try again." }, 500);
  }
  if (!updated || updated.length === 0) {
    return json({ success: false, error: "That request can't be withdrawn. It may already have been reviewed." }, 409);
  }
  return json({ success: true }, 200);
}
