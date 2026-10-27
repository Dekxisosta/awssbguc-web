"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EventStatus, RegistrationAvailability, RegistrationStatus } from "@/src/entities/event";
import { colors, withAlpha } from "@/tailwind.tokens";

/**
 * Registration box on the event detail page. Same pixel-art direction as EventCard:
 * thick colored border, hard offset shadow, square buttons. Uses the same
 * /api/events/register endpoint, then refreshes the server page so the seat
 * count and the public attendee list update right away.
 */

interface EventRegisterPanelProps {
  eventId: string;
  eventStatus: EventStatus;
  /** Status color from the stripe palette. */
  color: string;
  headingClass: string;
  participantId: string | null;
  isSignedIn: boolean;
  loginHref: string;
  initialStatus: RegistrationStatus | null;
  availability: RegistrationAvailability;
  goingCount: number;
  capacity: number | null;
  /** Preformatted by the server in the event's timezone. */
  opensLabel: string | null;
  closesLabel: string | null;
}

const REG_LABELS: Record<RegistrationStatus, string> = {
  registered: "You're going",
  attended: "You attended",
  not_attended: "Marked as not attended",
};

const focus = "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-teal";
const BLOCKS = 20;

function SeatBar({ going, capacity, color }: { going: number; capacity: number; color: string }) {
  const ratio = Math.min(1, going / capacity);
  const filled = going > 0 ? Math.max(1, Math.round(ratio * BLOCKS)) : 0;
  const left = Math.max(0, capacity - going);
  return (
    <div>
      <div
        role="img"
        aria-label={`${going} of ${capacity} seats taken`}
        className="flex gap-[3px]"
      >
        {Array.from({ length: BLOCKS }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="h-4 flex-1"
            style={i < filled ? { background: color } : { border: `2px solid ${withAlpha(colors.pix.butter, 0.25)}` }}
          />
        ))}
      </div>
      <p className="mt-2 text-base">
        <span className="text-pix-butter">{going}</span>
        <span className="text-pix-butter/70"> of {capacity} seats taken</span>
        {left > 0 && left <= 10 && <span className="text-pix-butter/70"> · {left} left</span>}
      </p>
    </div>
  );
}

export function EventRegisterPanel({
  eventId,
  eventStatus,
  color,
  headingClass,
  participantId,
  isSignedIn,
  loginHref,
  initialStatus,
  availability,
  goingCount,
  capacity,
  opensLabel,
  closesLabel,
}: EventRegisterPanelProps) {
  const router = useRouter();
  const [regStatus, setRegStatus] = useState<RegistrationStatus | null>(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const eventOpen = eventStatus === "not_started" || eventStatus === "ongoing";
  const canRegister = participantId !== null && eventOpen && regStatus === null && availability === "open";
  const canUnregister = participantId !== null && eventStatus === "not_started" && regStatus === "registered";

  function send(method: "POST" | "DELETE", failMessage: string, next: RegistrationStatus | null) {
    if (!participantId) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/events/register", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId, participant_id: participantId }),
      });
      if (res.ok) {
        setRegStatus(next);
        router.refresh();
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? failMessage);
      }
    });
  }

  // Why registering is not available right now (only shown when the person is not already registered).
  let blocked: string | null = null;
  if (regStatus === null) {
    if (eventStatus === "cancelled") blocked = "This event was cancelled.";
    else if (eventStatus === "completed") blocked = "This event has ended.";
    else if (availability === "not_open") blocked = opensLabel ? `Registration opens ${opensLabel}.` : "Registration has not opened yet.";
    else if (availability === "closed") blocked = "Registration is closed.";
    else if (availability === "full") blocked = "This event is full.";
  }

  return (
    <section
      aria-labelledby="register-heading"
      className="border-4 bg-black p-5"
      style={{ borderColor: color, boxShadow: `6px 6px 0 ${color}` }}
    >
      <h2 id="register-heading" className={`${headingClass} text-4xl`}>
        Registration
      </h2>

      <div className="mt-4">
        {capacity !== null ? (
          <SeatBar going={goingCount} capacity={capacity} color={color} />
        ) : (
          <p className="text-base">
            <span className="text-pix-butter">{goingCount}</span>
            <span className="text-pix-butter/70"> going · no seat limit</span>
          </p>
        )}
      </div>

      {(opensLabel || closesLabel) && (
        <dl className="mt-4 space-y-1 text-base">
          {opensLabel && (
            <div className="flex gap-2">
              <dt className="text-pix-butter/60">Opens</dt>
              <dd>{opensLabel}</dd>
            </div>
          )}
          {closesLabel && (
            <div className="flex gap-2">
              <dt className="text-pix-butter/60">Closes</dt>
              <dd>{closesLabel}</dd>
            </div>
          )}
        </dl>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {regStatus !== null && (
          <span className="border-4 border-pix-butter px-2 py-0.5 text-base">{REG_LABELS[regStatus]}</span>
        )}

        {canRegister && (
          <button
            type="button"
            onClick={() => send("POST", "Registration failed. Please try again.", "registered")}
            disabled={isPending}
            className={`border-4 border-pix-butter bg-pix-butter px-5 py-2 text-lg text-black shadow-pixel-rust-4 transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pixel-rust-2 disabled:opacity-50 ${focus}`}
          >
            {isPending ? "Registering…" : "Register"}
          </button>
        )}

        {canUnregister && (
          <button
            type="button"
            onClick={() => send("DELETE", "Could not unregister. Please try again.", null)}
            disabled={isPending}
            className={`border-4 border-pix-teal px-5 py-2 text-lg transition-colors hover:bg-pix-teal hover:text-black disabled:opacity-50 ${focus}`}
          >
            {isPending ? "Removing…" : "Unregister"}
          </button>
        )}

        {!isSignedIn && eventOpen && availability === "open" && (
          <Link
            href={loginHref}
            className={`border-4 border-pix-butter bg-pix-butter px-5 py-2 text-lg text-black shadow-pixel-rust-4 transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pixel-rust-2 ${focus}`}
          >
            Log in to register
          </Link>
        )}
      </div>

      {isSignedIn && !participantId && eventOpen && availability === "open" && (
        <p className="mt-4 text-base text-pix-butter/70">Complete your profile to register for events.</p>
      )}

      {blocked && <p className="mt-4 text-base text-pix-butter/80">{blocked}</p>}

      {error && (
        <p role="alert" className="mt-4 inline-block bg-pix-rust px-3 py-1 text-base text-pix-butter">
          {error}
        </p>
      )}
    </section>
  );
}
