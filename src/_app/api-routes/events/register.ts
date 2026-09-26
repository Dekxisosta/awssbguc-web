import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/shared/supabase/server";

export async function handleEventRegister(req: NextRequest) {
  const supabase = createClient();
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

  const { error } = await supabase.from("event_registrations").insert({ event_id, participant_id, status: "registered" });

  if (error) {
    if (error.code === "23505")
      return NextResponse.json({ error: "You are already registered for this event" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function handleEventUnregister(req: NextRequest) {
  const supabase = createClient();
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

  const { error } = await supabase.from("event_registrations").delete().eq("event_id", event_id).eq("participant_id", participant_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
