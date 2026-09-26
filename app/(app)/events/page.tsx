import { createClient } from "@/src/shared/supabase/server";
import { EventsPage, eventsMetadata } from "@/src/_pages/events";
import type { EventRow, RegistrationRow } from "@/src/entities/event";

export const metadata = eventsMetadata;

export default async function EventsRoute() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Resolve participant only when authenticated — guests get a read-only view.
  const { data: participant } = user
    ? await supabase
        .from("participants")
        .select("participant_id")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  const { data: events, error } = await supabase
    .from("events")
    .select("event_id, name, description, location, starts_at, ends_at, status")
    .order("starts_at", { ascending: true });

  const { data: registrations } = participant
    ? await supabase
        .from("event_registrations")
        .select("event_id, status")
        .eq("participant_id", participant.participant_id)
    : { data: [] };

  const registrationMap = new Map<string, RegistrationRow["status"]>(
    (registrations ?? []).map((r) => [r.event_id, r.status as RegistrationRow["status"]])
  );

  return (
    <EventsPage
      events={(events ?? []) as EventRow[]}
      registrationMap={registrationMap}
      participantId={participant?.participant_id ?? null}
      error={!!error}
    />
  );
}
