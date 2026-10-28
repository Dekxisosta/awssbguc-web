import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/shared/supabase/server";
import { createAdminClient } from "@/src/shared/supabase/admin";

export async function handleEventRegister(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { event_id?: string; participant_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { event_id, participant_id } = body;
  if (!event_id || !participant_id)
    return NextResponse.json({ error: "event_id and participant_id are required" }, { status: 400 });

  const { data: participant } = await supabase
    .from("participants")
    .select("participant_id")
    .eq("participant_id", participant_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!participant)
    return NextResponse.json({ error: "Participant not found or does not belong to your account" }, { status: 403 });

  const { data: event } = await supabase
    .from("events")
    .select("event_id, status")
    .eq("event_id", event_id)
    .maybeSingle();

  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (event.status === "completed" || event.status === "cancelled")
    return NextResponse.json({ error: "Registration is closed for this event" }, { status: 422 });

  // Users have read-only access to event_registrations; the write runs with the service role after the
  // ownership + event checks above. It can only ever produce a plain "registered" row — attended / no-show
  // are admin-only.
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("event_registrations")
    .select("status")
    .eq("event_id", event_id)
    .eq("participant_id", participant_id)
    .maybeSingle();

  if (existing && existing.status !== "unregistered")
    return NextResponse.json({ error: "You are already registered for this event" }, { status: 409 });

  // Previously unregistered: flip the same row back (the DB guard re-checks seats and the window).
  const { error } = existing
    ? await admin
        .from("event_registrations")
        .update({ status: "registered" })
        .eq("event_id", event_id)
        .eq("participant_id", participant_id)
        .eq("status", "unregistered")
    : await admin.from("event_registrations").insert({ event_id, participant_id, status: "registered" });

  if (error) {
    if (error.code === "23505")
      return NextResponse.json({ error: "You are already registered for this event" }, { status: 409 });
    // Raised by the event_registrations_guard trigger (migration 20260011).
    if (error.message.includes("EVENT_FULL"))
      return NextResponse.json({ error: "This event is full" }, { status: 409 });
    if (error.message.includes("REGISTRATION_NOT_OPEN"))
      return NextResponse.json({ error: "Registration has not opened yet" }, { status: 422 });
    if (error.message.includes("REGISTRATION_CLOSED"))
      return NextResponse.json({ error: "Registration is closed for this event" }, { status: 422 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function handleEventUnregister(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { event_id?: string; participant_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { event_id, participant_id } = body;
  if (!event_id || !participant_id)
    return NextResponse.json({ error: "event_id and participant_id are required" }, { status: 400 });

  const { data: participant } = await supabase
    .from("participants")
    .select("participant_id")
    .eq("participant_id", participant_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!participant)
    return NextResponse.json({ error: "Participant not found or does not belong to your account" }, { status: 403 });

  const { data: event } = await supabase.from("events").select("status").eq("event_id", event_id).maybeSingle();
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  if (event.status !== "not_started")
    return NextResponse.json({ error: "Cannot unregister from an event that has already started" }, { status: 422 });

  // Unregistering keeps the row and marks it "unregistered" (re-registering flips it back). Users only have
  // read access to event_registrations, so this runs with the service role after the ownership check above.
  // Only a plain "registered" row can be withdrawn; attended / not_attended are the admins' record.
  const { data: updated, error } = await createAdminClient()
    .from("event_registrations")
    .update({ status: "unregistered" })
    .eq("event_id", event_id)
    .eq("participant_id", participant_id)
    .eq("status", "registered")
    .select("participant_id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!updated || updated.length === 0)
    return NextResponse.json({ error: "You are not registered for this event" }, { status: 404 });

  return NextResponse.json({ success: true });
}
