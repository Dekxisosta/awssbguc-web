import { EventCard } from "@/src/features/event-registration";
import type { EventRow, RegistrationRow } from "@/src/entities/event";

export const eventsMetadata = { title: "Events — AWSSBG-UC" };

interface EventsPageProps {
  events: EventRow[];
  registrationMap: Map<string, RegistrationRow["status"]>;
  participantId: string | null;
  error: boolean;
}

export function EventsPage({ events, registrationMap, participantId, error }: EventsPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-xl font-semibold">Events</h1>
      <p className="mt-1 text-sm text-neutral-400">
        Upcoming and past AWSSBG-UC events. Register with your QR token to mark attendance.
      </p>

      {error && (
        <p className="mt-6 text-sm text-red-400">
          Could not load events. Please try refreshing.
        </p>
      )}

      {!error && events.length === 0 && (
        <p className="mt-10 text-center text-sm text-neutral-500">
          No events yet — check back soon.
        </p>
      )}

      {!error && events.length > 0 && (
        <ul className="mt-6 space-y-4" aria-label="Event list">
          {events.map((event) => (
            <li key={event.event_id}>
              <EventCard
                event={event}
                registrationStatus={registrationMap.get(event.event_id) ?? null}
                participantId={participantId}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
