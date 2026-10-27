import Link from "next/link";
import { Pixelify_Sans, Jersey_10 } from "next/font/google";
import { EventCard } from "@/src/features/event-registration";
import { Stripes, SidePixels, PixelClouds } from "@/src/widgets/home-client";
import type { EventRow, RegistrationRow } from "@/src/entities/event";

export const eventsMetadata = { title: "Events — AWSSBG-UC" };

// Same fonts as the home page. (Rebuilt here: this is a server component, and non-component exports
// from the "use client" HomeClient module arrive as client references, not strings.)
const pixel = Pixelify_Sans({ subsets: ["latin"], display: "swap" });
const jersey = Jersey_10({ subsets: ["latin"], weight: "400", display: "swap" });
const hd = `${jersey.className} font-normal leading-[0.9] tracking-normal`;
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
    <ul className="space-y-8" aria-label={label}>
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
    <div className={`${pixel.className} relative isolate bg-black tracking-normal text-pix-butter`}>
      <PixelClouds />
      <SidePixels side="left" />
      <SidePixels side="right" />

      <div className="relative z-10">
        {/* Header */}
        <section className={`${wrap} pb-12 pt-10 sm:pb-16 sm:pt-14`}>
          <p className="text-xl">AWSSBG-UC</p>
          <h1 className={`${hd} mt-3 text-[clamp(5rem,13vw,10rem)]`}>Events</h1>
          <p className="mt-6 max-w-2xl text-2xl leading-snug">
            Upcoming and past AWSSBG-UC events. Register with your QR token to mark attendance.
          </p>
        </section>

        <Stripes className="h-4" />

        <section className={`${wrap} py-12 sm:py-16`}>
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
              <h2 className={`${hd} mb-8 text-6xl sm:text-7xl`}>Up next</h2>
              {renderList(open, "Upcoming events")}
            </div>
          )}

          {!error && past.length > 0 && (
            <div className={open.length > 0 ? "mt-20" : ""}>
              <h2 className={`${hd} mb-8 text-6xl sm:text-7xl`}>Past events</h2>
              {renderList(past, "Past events")}
            </div>
          )}
        </section>
        <Stripes className="h-4" />
      </div>
    </div>
  );
}
