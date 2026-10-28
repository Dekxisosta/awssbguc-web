"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { STATUS_COLORS, STATUS_LABELS, type EventRow, type RegistrationRow } from "@/src/entities/event";

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

// Fixed to Philippine time so server and browser render the same text.
const TZ = "Asia/Manila";

const dateOnly = (d: Date) =>
  d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: TZ });
const timeOnly = (d: Date) =>
  d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ });

function formatDateRange(starts: string, ends: string): string {
  const s = new Date(starts);
  const e = new Date(ends);
  if (dateOnly(s) === dateOnly(e)) {
    return `${dateOnly(s)} · ${timeOnly(s)} – ${timeOnly(e)}`;
  }
  return `${dateOnly(s)} ${timeOnly(s)} – ${dateOnly(e)} ${timeOnly(e)}`;
}

export function EventCard({ event, registrationStatus, participantId, headingClass = "" }: EventCardProps) {
  const [regStatus, setRegStatus] = useState<RegistrationRow["status"] | null>(registrationStatus);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const color = STATUS_COLORS[event.status];
  const start = new Date(event.starts_at);
  const day = start.toLocaleDateString("en-PH", { day: "numeric", timeZone: TZ });
  const month = start.toLocaleDateString("en-PH", { month: "short", timeZone: TZ });
  const year = start.toLocaleDateString("en-PH", { year: "numeric", timeZone: TZ });

  const canRegister =
    participantId !== null &&
    (event.status === "not_started" || event.status === "ongoing") &&
    regStatus === null;

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
      className="flex flex-col gap-5 border-4 bg-black p-5 sm:flex-row sm:gap-6"
      style={{ borderColor: color, boxShadow: `6px 6px 0 ${color}` }}
    >
      {/* Date block */}
      <div
        aria-hidden="true"
        className="flex h-24 w-24 shrink-0 flex-col items-center justify-center self-start text-black"
        style={{ background: color }}
      >
        <span className={`${headingClass} text-5xl`}>{day}</span>
        <span className="text-base uppercase leading-none">{month}</span>
        <span className="text-xs leading-none opacity-80">{year}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className={`${headingClass} break-words text-4xl`}>
              <Link href={`/events/${event.slug}`} className={`underline-offset-4 hover:underline ${focus}`}>
                {event.name}
              </Link>
            </h2>
            <p className="mt-2 text-base text-pix-butter/70">{formatDateRange(event.starts_at, event.ends_at)}</p>
          </div>

          <span className="shrink-0 px-2 py-0.5 text-base text-black" style={{ background: color }}>
            {STATUS_LABELS[event.status]}
          </span>
        </div>

        {event.location && (
          <p className="mt-3 flex items-center gap-2 text-base">
            <LocationIcon />
            {event.location}
          </p>
        )}

        {event.description && (
          <p className="mt-3 text-lg leading-snug text-pix-butter/85">{event.description}</p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {regStatus !== null && (
            <span className="border-4 border-pix-butter px-2 py-0.5 text-base">{REG_LABELS[regStatus]}</span>
          )}

          {canRegister && (
            <button
              type="button"
              onClick={handleRegister}
              disabled={isPending}
              className={`border-4 border-pix-butter bg-pix-butter px-5 py-2 text-lg text-black shadow-pixel-rust-4 transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pixel-rust-2 disabled:opacity-50 ${focus}`}
            >
              {isPending ? "Registering…" : "Register"}
            </button>
          )}

          {canUnregister && (
            <button
              type="button"
              onClick={handleUnregister}
              disabled={isPending}
              className={`border-4 border-pix-teal px-5 py-2 text-lg transition-colors hover:bg-pix-teal hover:text-black disabled:opacity-50 ${focus}`}
            >
              {isPending ? "Removing…" : "Unregister"}
            </button>
          )}

          <Link
            href={`/events/${event.slug}`}
            className={`border-4 border-pix-butter/60 px-5 py-2 text-lg transition-colors hover:bg-pix-butter hover:text-black ${focus}`}
          >
            Details
          </Link>

          {!participantId && (event.status === "not_started" || event.status === "ongoing") && (
            <span className="text-base text-pix-butter/70">Complete your profile to register for events.</span>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-3 inline-block bg-pix-rust px-3 py-1 text-base text-pix-butter">
            {error}
          </p>
        )}
      </div>
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
