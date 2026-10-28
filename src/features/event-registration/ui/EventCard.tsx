"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  FORMAT_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  fmtTime,
  getRegistrationAvailability,
  safeTimeZone,
  type EventRow,
  type RegistrationRow,
} from "@/src/entities/event";

/**
 * Event card in the pixel-art direction of the home page: thick colored border + hard offset shadow,
 * a date block on the left, status badge in the stripe palette, square buttons, no rounded corners.
 * Inherits JetBrains Mono from the page; the Jersey 10 headline class is passed in as `headingClass`.
 */

interface EventCardProps {
  event: EventRow;
  registrationStatus: RegistrationRow["status"] | null;
  participantId: string | null;
  /** Class that applies the Jersey 10 headline font (passed in by the page, which loads the font). */
  headingClass?: string;
}

const REG_LABELS: Record<RegistrationRow["status"], string> = {
  registered: "Registered",
  attended: "Attended",
  not_attended: "Not attended",
};

const focus = "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-teal";

// Dates are shown in the event's own timezone (default Asia/Manila), so server and browser render the same text.
const dateOnly = (iso: string, tz: string) =>
  new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: tz });

function formatDateRange(starts: string, ends: string, tz: string): string {
  if (dateOnly(starts, tz) === dateOnly(ends, tz)) {
    return `${dateOnly(starts, tz)} · ${fmtTime(starts, tz)} – ${fmtTime(ends, tz)}`;
  }
  return `${dateOnly(starts, tz)} ${fmtTime(starts, tz)} – ${dateOnly(ends, tz)} ${fmtTime(ends, tz)}`;
}

export function EventCard({ event, registrationStatus, participantId, headingClass = "" }: EventCardProps) {
  const [regStatus, setRegStatus] = useState<RegistrationRow["status"] | null>(registrationStatus);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const color = STATUS_COLORS[event.status];
  const tz = safeTimeZone(event.timezone);
  const start = new Date(event.starts_at);
  const day = start.toLocaleDateString("en-PH", { day: "numeric", timeZone: tz });
  const month = start.toLocaleDateString("en-PH", { month: "short", timeZone: tz });
  const year = start.toLocaleDateString("en-PH", { year: "numeric", timeZone: tz });

  // Seat count isn't loaded on the list, so "full" is left to the server; the window is checked here.
  const availability = getRegistrationAvailability(event, 0);
  const eventOpen = event.status === "not_started" || event.status === "ongoing";

  const canRegister =
    participantId !== null &&
    eventOpen &&
    regStatus === null &&
    availability === "open";

  const canUnregister =
    participantId !== null &&
    event.status === "not_started" &&
    regStatus === "registered";

  function handleRegister() {
    if (!participantId) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: event.event_id, participant_id: participantId }),
      });
      if (res.ok) {
        setRegStatus("registered");
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Registration failed. Please try again.");
      }
    });
  }

  function handleUnregister() {
    if (!participantId) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/events/register", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: event.event_id, participant_id: participantId }),
      });
      if (res.ok) {
        setRegStatus(null);
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Could not unregister. Please try again.");
      }
    });
  }

  return (
    <article
      className="flex gap-4 border-4 bg-black p-3 sm:p-4"
      style={{ borderColor: color, boxShadow: `4px 4px 0 ${color}` }}
    >
      {/* Date block */}
      <div
        aria-hidden="true"
        className="flex h-16 w-16 shrink-0 flex-col items-center justify-center self-start text-black sm:h-20 sm:w-20"
        style={{ background: color }}
      >
        <span className={`${headingClass} text-3xl sm:text-4xl`}>{day}</span>
        <span className="text-sm uppercase leading-none">{month}</span>
        <span className="text-xs leading-none opacity-80">{year}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
          <div className="min-w-0 flex-1">
            <h2 className={`${headingClass} break-words text-3xl leading-none`}>
              <Link href={`/events/${event.slug}`} className={`underline-offset-4 hover:underline ${focus}`}>
                {event.name}
              </Link>
            </h2>
            <p className="mt-1 text-sm text-pix-butter/70">{formatDateRange(event.starts_at, event.ends_at, tz)}</p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span className="border-2 border-pix-butter/60 px-2 text-sm">{FORMAT_LABELS[event.format]}</span>
            <span className="px-2 text-sm text-black" style={{ background: color }}>
              {STATUS_LABELS[event.status]}
            </span>
          </div>
        </div>

        {(event.host_name || event.location || event.location_address) && (
          <div className="mt-1.5 flex flex-wrap items-start gap-x-4 gap-y-1 text-sm">
            {event.host_name && <p className="text-pix-butter/70">Hosted by {event.host_name}</p>}
            {(event.location || event.location_address) && (
              <p className="flex min-w-0 items-start gap-1.5">
                <span className="mt-0.5"><LocationIcon /></span>
                <span className="min-w-0 break-words">
                  {event.location}
                  {event.location && event.location_address && <span className="text-pix-butter/60"> · </span>}
                  {event.location_address && <span className="text-pix-butter/75">{event.location_address}</span>}
                </span>
              </p>
            )}
          </div>
        )}

        {(event.summary || event.description) && (
          <p className="mt-2 line-clamp-2 text-base leading-snug text-pix-butter/85">{event.summary ?? event.description}</p>
        )}

        {event.tags.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Topics">
            {event.tags.slice(0, 4).map((tag) => (
              <li key={tag} className="border-2 border-pix-butter/60 px-1.5 text-xs">
                {tag}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {regStatus !== null && (
            <span className="border-2 border-pix-butter px-2 py-0.5 text-sm">{REG_LABELS[regStatus]}</span>
          )}

          {canRegister && (
            <button
              type="button"
              onClick={handleRegister}
              disabled={isPending}
              className={`border-2 border-pix-butter bg-pix-butter px-4 py-1 text-base text-black shadow-pixel-rust-2 transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none disabled:opacity-50 ${focus}`}
            >
              {isPending ? "Registering…" : "Register"}
            </button>
          )}

          {canUnregister && (
            <button
              type="button"
              onClick={handleUnregister}
              disabled={isPending}
              className={`border-2 border-pix-teal px-4 py-1 text-base transition-colors hover:bg-pix-teal hover:text-black disabled:opacity-50 ${focus}`}
            >
              {isPending ? "Removing…" : "Unregister"}
            </button>
          )}

          <Link
            href={`/events/${event.slug}`}
            className={`border-2 border-pix-butter/60 px-4 py-1 text-base transition-colors hover:bg-pix-butter hover:text-black ${focus}`}
          >
            Details
          </Link>

          {!participantId && eventOpen && availability === "open" && (
            <span className="text-sm text-pix-butter/70">Complete your profile to register for events.</span>
          )}

          {regStatus === null && eventOpen && availability === "not_open" && (
            <span className="text-sm text-pix-butter/70">Registration has not opened yet.</span>
          )}
          {regStatus === null && eventOpen && availability === "closed" && (
            <span className="text-sm text-pix-butter/70">Registration is closed.</span>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-2 inline-block bg-pix-rust px-3 py-0.5 text-sm text-pix-butter">
            {error}
          </p>
        )}
      </div>

      {event.cover_image_url && (
        // Plain <img>: cover URLs may point at any https host, which next/image would reject.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.cover_image_url}
          alt=""
          loading="lazy"
          className="hidden w-56 shrink-0 self-stretch border-2 object-cover md:block lg:w-72"
          style={{ borderColor: color }}
        />
      )}
    </article>
  );
}

function LocationIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" aria-hidden="true" className="shrink-0">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
