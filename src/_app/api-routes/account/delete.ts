import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/shared/supabase/server";
import { createAdminClient } from "@/src/shared/supabase/admin";

type JsonResponse =
  | { success: true; scheduledAt?: string }
  | { success: false; error: string };

function json(body: JsonResponse, status: number) {
  return NextResponse.json(body, { status });
}

// ---------------------------------------------------------------------------
// DELETE /api/account
// Schedules the account for deletion 30 days from now (soft delete).
// If a deletion is already scheduled it returns the existing scheduled date.
// ---------------------------------------------------------------------------
export async function handleScheduleAccountDeletion(_request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return json({ success: false, error: "You must be signed in." }, 401);

  const admin = createAdminClient();

  // Fetch current deletion state
  const { data: participant, error: fetchErr } = await admin
    .from("participants")
    .select("participant_id, deletion_scheduled_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchErr) {
    console.error("[DELETE /api/account] fetch participant failed:", fetchErr.message);
    return json({ success: false, error: "Failed to fetch account data." }, 500);
  }

  if (!participant) {
    return json({ success: false, error: "Account record not found." }, 404);
  }

  // If already scheduled, just return the existing scheduled date
  if (participant.deletion_scheduled_at) {
    return json({ success: true, scheduledAt: participant.deletion_scheduled_at }, 200);
  }

  const scheduledAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error: updateErr } = await admin
    .from("participants")
    .update({ deletion_scheduled_at: scheduledAt })
    .eq("user_id", user.id);

  if (updateErr) {
    console.error("[DELETE /api/account] schedule deletion failed:", updateErr.message);
    return json({ success: false, error: "Failed to schedule account deletion." }, 500);
  }

  return json({ success: true, scheduledAt }, 200);
}

// ---------------------------------------------------------------------------
// POST /api/account/cancel-deletion
// Cancels a pending soft-delete by clearing deletion_scheduled_at.
// ---------------------------------------------------------------------------
export async function handleCancelAccountDeletion(_request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return json({ success: false, error: "You must be signed in." }, 401);

  const admin = createAdminClient();

  const { data: participant, error: fetchErr } = await admin
    .from("participants")
    .select("participant_id, deletion_scheduled_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchErr) {
    console.error("[POST /api/account/cancel-deletion] fetch failed:", fetchErr.message);
    return json({ success: false, error: "Failed to fetch account data." }, 500);
  }

  if (!participant) {
    return json({ success: false, error: "Account record not found." }, 404);
  }

  if (!participant.deletion_scheduled_at) {
    // Nothing to cancel — treat as success
    return json({ success: true }, 200);
  }

  const { error: updateErr } = await admin
    .from("participants")
    .update({ deletion_scheduled_at: null })
    .eq("user_id", user.id);

  if (updateErr) {
    console.error("[POST /api/account/cancel-deletion] cancel failed:", updateErr.message);
    return json({ success: false, error: "Failed to cancel deletion." }, 500);
  }

  return json({ success: true }, 200);
}
