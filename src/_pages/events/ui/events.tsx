import Link from "next/link";
import { bodyFont, hd } from "@/src/shared/config/fonts";
import { EventCard } from "@/src/features/event-registration";
import { Stripes, SidePixels, PixelClouds } from "@/src/widgets/home-client";
import type { EventRow, RegistrationRow } from "@/src/entities/event";

export const eventsMetadata = { title: "Events — AWSSBG-UC" };

// Same fonts as the home page. (Rebuilt here: this is a server component, and non-component exports
// from the "use client" HomeClient module arrive as client references, not strings.)
const wrap = "mx-auto w-full max-w-page px-5 sm:px-8";

interface EventsPageProps {
  events: EventRow[];
  registrationMap: Map<string, RegistrationRow["status"]>;
  participantId: string | null;
  error: boolean;
}

export function EventsPage({ events, registrationMap, participantId, error }: EventsPageProps) {
  // Open events first (soonest first), then the ones that are over (most recent first).
  const open = events.filter((e) => e.status === "not_started" || e.status === "ongoing");
  const past = events
    .filter((e) => e.status === "completed" || e.status === "cancelled")
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at));

  const renderList = (list: EventRow[], label: string) => (
    <ul className="space-y-4" aria-label={label}>
      {list.map((event) => (
        <li key={event.event_id}>
          <EventCard
            event={event}
            registrationStatus={registrationMap.get(event.event_id) ?? null}
            participantId={participantId}
            headingClass={hd}
          />
        </li>
      ))}
    </ul>
  );

  return (
    <div className={`${bodyFont.className} relative isolate bg-black tracking-normal text-pix-butter`}>
      <PixelClouds />
      <SidePixels side="left" />
      <SidePixels side="right" />

      <div className="relative z-10">
        <h1 className="sr-only">Events</h1>

        <section className={`${wrap} py-8 sm:py-10`}>
          {error && (
            <p role="alert" className="inline-block border-4 border-pix-rust bg-pix-rust px-4 py-3 text-lg">
              Could not load events. Please try refreshing.
            </p>
          )}

          {!error && events.length === 0 && (
            <div className="mx-auto max-w-xl border-4 border-pix-teal p-8 text-center shadow-pixel-teal-6">
              <p className={`${hd} text-5xl`}>No events yet</p>
              <p className="mt-3 text-lg">Check back soon.</p>
              <Link
                href="/about"
                className="mt-6 inline-block border-4 border-pix-butter px-6 py-3 text-lg transition-colors hover:bg-pix-butter hover:text-black focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-teal"
              >
                What is AWSSBG-UC?
              </Link>
            </div>
          )}

          {!error && open.length > 0 && (
            <div>
              <h2 className={`${hd} mb-5 text-5xl sm:text-6xl`}>Up next</h2>
              {renderList(open, "Upcoming events")}
            </div>
          )}

          {!error && past.length > 0 && (
            <div className={open.length > 0 ? "mt-12" : ""}>
              <h2 className={`${hd} mb-5 text-5xl sm:text-6xl`}>Past events</h2>
              {renderList(past, "Past events")}
            </div>
          )}
        </section>
        <Stripes className="h-4" />
      </div>
    </div>
  );
}
