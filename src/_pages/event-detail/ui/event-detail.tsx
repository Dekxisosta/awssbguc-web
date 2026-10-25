import Link from "next/link";
import { Pixelify_Sans, Jersey_10 } from "next/font/google";
import { EventRegisterPanel } from "@/src/features/event-registration";
import { Stripes, SidePixels, PixelClouds, PixelPhoto } from "@/src/widgets/home-client";
import {
  FORMAT_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  dayKey,
  fmtDay,
  fmtShortDate,
  fmtTime,
  fmtZone,
  getRegistrationAvailability,
  googleCalendarUrl,
  isSameDay,
  safeTimeZone,
  type EventPublicAttendee,
  type EventRow,
  type RegistrationRow,
} from "@/src/entities/event";

/**
 * Event detail page in the pixel-art direction of the site: black ground, butter type,
 * Jersey 10 headlines, stripe dividers, square corners, hard offset shadows.
 * Everything here is public information; registrants are listed only when they are public members.
 */

// Same fonts as the other pages (rebuilt here: this is a server component).
const pixel = Pixelify_Sans({ subsets: ["latin"], display: "swap" });
const jersey = Jersey_10({ subsets: ["latin"], weight: "400", display: "swap" });
const hd = `${jersey.className} font-normal leading-[0.9] tracking-normal`;
const wrap = "mx-auto w-full max-w-[1300px] px-5 sm:px-8";
const focus = "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#2c8f8f]";
const CARD_BORDERS = ["border-[#2c8f8f]", "border-[#b89a0a]", "border-[#b32a0e]", "border-[#3aaa6e]"];

/** How many registrants are drawn before the rest fold into a disclosure. */
const ATTENDEES_SHOWN = 48;

export interface EventDetailPageProps {
  event: EventRow;
  counts: { total: number; public: number; hidden: number };
  attendees: Pick<EventPublicAttendee, "username" | "avatar_url">[];
  registrationStatus: RegistrationRow["status"] | null;
  participantId: string | null;
  isSignedIn: boolean;
  /** Absolute URL of this page, used for the calendar entry. Null when the origin is unknown. */
  pageUrl: string | null;
}

// ─── Small pieces ─────────────────────────────────────────────────────────────

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className={`${hd} text-5xl sm:text-6xl`}>
      {children}
    </h2>
  );
}

function PinIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" aria-hidden="true" className="mt-1 shrink-0">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

// ─── When ─────────────────────────────────────────────────────────────────────

function WhenPanel({ event, pageUrl, color }: { event: EventRow; pageUrl: string | null; color: string }) {
  const tz = safeTimeZone(event.timezone);
  const start = new Date(event.starts_at);
  const day = start.toLocaleDateString("en-PH", { day: "numeric", timeZone: tz });
  const month = start.toLocaleDateString("en-PH", { month: "short", timeZone: tz });
  const year = start.toLocaleDateString("en-PH", { year: "numeric", timeZone: tz });
  const sameDay = isSameDay(event.starts_at, event.ends_at, tz);
  const zone = fmtZone(event.starts_at, tz);
  const canAddToCalendar = event.status === "not_started" || event.status === "ongoing";

  return (
    <section aria-labelledby="when-heading" className="border-4 border-[#fff7a1] bg-black p-5 shadow-[6px_6px_0_#b89a0a]">
      <h2 id="when-heading" className="sr-only">
        When
      </h2>
      <div className="flex gap-4">
        <div
          aria-hidden="true"
          className="flex h-24 w-24 shrink-0 flex-col items-center justify-center text-black"
          style={{ background: color }}
        >
          <span className={`${hd} text-5xl`}>{day}</span>
          <span className="text-base uppercase leading-none">{month}</span>
          <span className="text-xs leading-none opacity-80">{year}</span>
        </div>

        <div className="min-w-0 space-y-2 text-lg leading-snug">
          {sameDay ? (
            <>
              <p>{fmtDay(event.starts_at, tz)}</p>
              <p className="text-[#fff7a1]/80">
                {fmtTime(event.starts_at, tz)} – {fmtTime(event.ends_at, tz)} <span className="text-[#fff7a1]/60">{zone}</span>
              </p>
            </>
          ) : (
            <>
              <p>
                <span className="text-[#fff7a1]/60">From </span>
                {fmtShortDate(event.starts_at, tz)}, {fmtTime(event.starts_at, tz)}
              </p>
              <p>
                <span className="text-[#fff7a1]/60">To </span>
                {fmtShortDate(event.ends_at, tz)}, {fmtTime(event.ends_at, tz)} <span className="text-[#fff7a1]/60">{zone}</span>
              </p>
            </>
          )}
        </div>
      </div>

      {canAddToCalendar && (
        <a
          href={googleCalendarUrl(event, pageUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-5 inline-block border-4 border-[#fff7a1]/60 px-4 py-1.5 text-base transition-colors hover:bg-[#fff7a1] hover:text-black ${focus}`}
        >
          Add to Google Calendar
        </a>
      )}
    </section>
  );
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

function Schedule({ event, color }: { event: EventRow; color: string }) {
  const items = event.schedule;
  if (!items || items.length === 0) return null;
  const tz = safeTimeZone(event.timezone);

  // Group by calendar day only when the timetable spans more than one.
  const days: { key: string; label: string; items: typeof items }[] = [];
  for (const item of items) {
    const key = dayKey(item.starts_at, tz);
    const last = days[days.length - 1];
    if (last && last.key === key) last.items.push(item);
    else days.push({ key, label: fmtDay(item.starts_at, tz), items: [item] });
  }
  const multiDay = days.length > 1;

  return (
    <section aria-labelledby="schedule-heading">
      <SectionTitle id="schedule-heading">Schedule</SectionTitle>
      <div className="mt-8 space-y-10">
        {days.map((d) => (
          <div key={d.key}>
            {multiDay && <p className="mb-4 text-xl">{d.label}</p>}
            <ol className="space-y-5">
              {d.items.map((item, i) => (
                <li
                  key={`${item.starts_at}-${i}`}
                  className="grid gap-x-6 gap-y-1 border-l-4 pl-5 sm:grid-cols-[9.5rem_minmax(0,1fr)]"
                  style={{ borderColor: color }}
                >
                  <p className="text-lg leading-snug">
                    {fmtTime(item.starts_at, tz)}
                    {item.ends_at && <span className="block text-base text-[#fff7a1]/60">to {fmtTime(item.ends_at, tz)}</span>}
                  </p>
                  <div className="min-w-0">
                    <h3 className={`${hd} break-words text-3xl`}>{item.title}</h3>
                    {item.speaker && <p className="mt-1 text-base text-[#fff7a1]/70">with {item.speaker}</p>}
                    {item.description && <p className="mt-2 max-w-xl text-base leading-snug text-[#fff7a1]/85">{item.description}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Where ────────────────────────────────────────────────────────────────────

function Where({ event }: { event: EventRow }) {
  if (!event.location && !event.location_address && !event.location_url) return null;
  const linkLabel = event.format === "online" ? "Open the join page" : "View on map";

  return (
    <section aria-labelledby="where-heading">
      <SectionTitle id="where-heading">{event.format === "online" ? "Join online" : "Where"}</SectionTitle>
      <div className="mt-6 flex w-fit max-w-full flex-col gap-4 border-4 border-[#2c8f8f] p-5 shadow-[6px_6px_0_#2c8f8f]">
        <div className="flex gap-3 text-lg leading-snug">
          <PinIcon />
          <div className="min-w-0">
            {event.location && <p className="break-words">{event.location}</p>}
            {event.location_address && <p className="mt-1 break-words text-[#fff7a1]/75">{event.location_address}</p>}
          </div>
        </div>
        {event.location_url && (
          <a
            href={event.location_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-fit border-4 border-[#fff7a1] px-4 py-1.5 text-base transition-colors hover:bg-[#fff7a1] hover:text-black ${focus}`}
          >
            {linkLabel} ↗
          </a>
        )}
      </div>
    </section>
  );
}

// ─── Who's going ──────────────────────────────────────────────────────────────

function AttendeeTile({ attendee, border }: { attendee: Pick<EventPublicAttendee, "username" | "avatar_url">; border: string }) {
  return (
    <li>
      <Link
        href={`/members/${encodeURIComponent(attendee.username)}`}
        className={`flex items-center gap-3 border-4 ${border} p-2 transition-colors hover:bg-[#fff7a1] hover:text-black ${focus}`}
      >
        {attendee.avatar_url ? (
          <span className="block h-10 w-10 shrink-0 border-2 border-[#fff7a1]">
            <PixelPhoto src={attendee.avatar_url} width={16} height={16} />
          </span>
        ) : (
          <span className={`${hd} flex h-10 w-10 shrink-0 items-center justify-center border-2 border-[#fff7a1] bg-[#fff7a1] text-2xl text-black`}>
            {attendee.username.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="min-w-0 truncate text-base">@{attendee.username}</span>
      </Link>
    </li>
  );
}

function Going({
  event,
  counts,
  attendees,
}: {
  event: EventRow;
  counts: EventDetailPageProps["counts"];
  attendees: EventDetailPageProps["attendees"];
}) {
  const shown = attendees.slice(0, ATTENDEES_SHOWN);
  const rest = attendees.slice(ATTENDEES_SHOWN);
  const isOpen = event.status === "not_started" || event.status === "ongoing";
  const past = event.status === "completed";

  const heading = past ? "Who went" : "Who's going";

  return (
    <section aria-labelledby="going-heading">
      <SectionTitle id="going-heading">{heading}</SectionTitle>

      {counts.total === 0 ? (
        <p className="mt-6 max-w-xl text-lg leading-snug">
          {isOpen ? "Nobody has registered yet. Be the first." : "Nobody registered for this event."}
        </p>
      ) : (
        <>
          <p className="mt-6 text-xl leading-snug">
            {counts.total} {past ? (counts.total === 1 ? "registrant" : "registrants") : "going"}
            {event.capacity !== null && <span className="text-[#fff7a1]/70"> · {event.capacity} seats</span>}
          </p>

          {shown.length > 0 && (
            <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3" aria-label="Public registrants">
              {shown.map((a, i) => (
                <AttendeeTile key={a.username} attendee={a} border={CARD_BORDERS[i % CARD_BORDERS.length]} />
              ))}
            </ul>
          )}

          {rest.length > 0 && (
            <details className="group mt-4">
              <summary className={`w-fit cursor-pointer border-4 border-[#fff7a1]/60 px-4 py-1.5 text-base transition-colors hover:bg-[#fff7a1] hover:text-black ${focus}`}>
                <span className="group-open:hidden">Show {rest.length} more</span>
                <span className="hidden group-open:inline">Show fewer</span>
              </summary>
              <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3" aria-label="More public registrants">
                {rest.map((a, i) => (
                  <AttendeeTile key={a.username} attendee={a} border={CARD_BORDERS[(i + shown.length) % CARD_BORDERS.length]} />
                ))}
              </ul>
            </details>
          )}

          {counts.hidden > 0 && (
            <p className="mt-5 inline-block border-4 border-dashed border-[#fff7a1]/40 px-4 py-2 text-base text-[#fff7a1]/80">
              {shown.length > 0 ? "+ " : ""}
              {counts.hidden} {counts.hidden === 1 ? "member keeps" : "members keep"} their registration private
            </p>
          )}

          <p className="mt-5 max-w-xl text-sm leading-snug text-[#fff7a1]/60">
            Names appear only for members with a public profile. Everyone else counts toward the total.
          </p>
        </>
      )}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function EventDetailPage({
  event,
  counts,
  attendees,
  registrationStatus,
  participantId,
  isSignedIn,
  pageUrl,
}: EventDetailPageProps) {
  const color = STATUS_COLORS[event.status];
  const tz = safeTimeZone(event.timezone);
  const availability = getRegistrationAvailability(event, counts.total);

  const stamp = (iso: string) => `${fmtShortDate(iso, tz)}, ${fmtTime(iso, tz)} ${fmtZone(iso, tz)}`;
  const opensLabel = event.registration_opens_at ? stamp(event.registration_opens_at) : null;
  const closesLabel = event.registration_closes_at ? stamp(event.registration_closes_at) : null;

  // Structured data so search engines and link previews understand the event.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    startDate: event.starts_at,
    endDate: event.ends_at,
    eventStatus:
      event.status === "cancelled" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    eventAttendanceMode:
      event.format === "online"
        ? "https://schema.org/OnlineEventAttendanceMode"
        : event.format === "hybrid"
          ? "https://schema.org/MixedEventAttendanceMode"
          : "https://schema.org/OfflineEventAttendanceMode",
    ...(event.summary || event.description ? { description: event.summary ?? event.description } : {}),
    ...(event.cover_image_url ? { image: [event.cover_image_url] } : {}),
    ...(event.location
      ? { location: { "@type": "Place", name: event.location, ...(event.location_address ? { address: event.location_address } : {}) } }
      : {}),
    ...(event.host_name ? { organizer: { "@type": "Organization", name: event.host_name } } : {}),
  };

  return (
    <div className={`${pixel.className} relative isolate bg-black tracking-normal text-[#fff7a1]`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PixelClouds />
      <SidePixels side="left" />
      <SidePixels side="right" />

      <div className="relative z-10">
        {/* ── Header ── */}
        <header className={`${wrap} pb-10 pt-8 sm:pb-14 sm:pt-10`}>
          <Link href="/events" className={`inline-block text-lg underline underline-offset-4 ${focus}`}>
            ← All events
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="px-2 py-0.5 text-base text-black" style={{ background: color }}>
              {STATUS_LABELS[event.status]}
            </span>
            <span className="border-2 border-[#fff7a1]/60 px-2 py-0.5 text-base">{FORMAT_LABELS[event.format]}</span>
            {event.host_name && <span className="text-base text-[#fff7a1]/70">Hosted by {event.host_name}</span>}
          </div>

          <h1 className={`${hd} mt-5 break-words text-[clamp(3.5rem,10vw,8rem)]`}>{event.name}</h1>

          {event.summary && <p className="mt-6 max-w-2xl text-2xl leading-snug">{event.summary}</p>}

          {event.tags.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Topics">
              {event.tags.map((tag) => (
                <li key={tag} className="border-2 border-[#fff7a1]/60 px-2 py-0.5 text-sm">
                  {tag}
                </li>
              ))}
            </ul>
          )}

          {event.status === "cancelled" && (
            <p role="status" className="mt-6 inline-block border-4 border-[#b32a0e] bg-[#b32a0e] px-4 py-2 text-lg">
              This event was cancelled.
            </p>
          )}
        </header>

        <Stripes className="h-4" />

        {/* ── Body ── */}
        <div className={`${wrap} py-12 sm:py-16`}>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-14">
            {/* Registration and time come first on small screens. */}
            <aside className="order-first space-y-8 lg:sticky lg:top-6 lg:order-last">
              <WhenPanel event={event} pageUrl={pageUrl} color={color} />
              <EventRegisterPanel
                eventId={event.event_id}
                eventStatus={event.status}
                color={color}
                headingClass={hd}
                participantId={participantId}
                isSignedIn={isSignedIn}
                loginHref={`/login?redirect=${encodeURIComponent(`/events/${event.slug}`)}`}
                initialStatus={registrationStatus}
                availability={availability}
                goingCount={counts.total}
                capacity={event.capacity}
                opensLabel={opensLabel}
                closesLabel={closesLabel}
              />
            </aside>

            <div className="min-w-0 space-y-16">
              {event.cover_image_url && (
                // Plain <img>: cover URLs may point at any https host, which next/image would reject.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.cover_image_url}
                  alt={`Cover image for ${event.name}`}
                  className="aspect-[16/9] w-full border-4 object-cover"
                  style={{ borderColor: color, boxShadow: `8px 8px 0 ${color}` }}
                />
              )}

              {event.description && (
                <section aria-labelledby="about-heading">
                  <SectionTitle id="about-heading">About this event</SectionTitle>
                  <p className="mt-6 max-w-2xl whitespace-pre-line text-lg leading-relaxed text-[#fff7a1]/90">{event.description}</p>
                </section>
              )}

              <Schedule event={event} color={color} />
              <Where event={event} />
              <Going event={event} counts={counts} attendees={attendees} />
            </div>
          </div>
        </div>

        <Stripes className="h-4" />
      </div>
    </div>
  );
}
