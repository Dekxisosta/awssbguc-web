"use client";

import { useState, useTransition } from "react";
import type { EventRow, RegistrationRow } from "@/src/entities/event";

interface EventCardProps {
  event: EventRow;
  registrationStatus: RegistrationRow["status"] | null;
  participantId: string | null;
}

const STATUS_LABELS: Record<EventRow["status"], string> = {
  not_started: "Upcoming",
  ongoing: "Ongoing",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<EventRow["status"], string> = {
  not_started: "bg-blue-500/15 text-blue-400",
  ongoing: "bg-green-500/15 text-green-400",
  completed: "bg-neutral-500/20 text-neutral-400",
  cancelled: "bg-red-500/15 text-red-400",
};

const REG_LABELS: Record<RegistrationRow["status"], string> = {
  registered: "Registered",
  attended: "Attended",
  not_attended: "Not attended",
};

function formatDateRange(starts: string, ends: string): string {
  const fmt = (d: Date) =>
    d.toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  const s = new Date(starts);
  const e = new Date(ends);
  if (s.toDateString() === e.toDateString()) {
    return `${s.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })} · ${s.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true })} – ${e.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", hour12: true })}`;
  }
  return `${fmt(s)} – ${fmt(e)}`;
}

export function EventCard({ event, registrationStatus, participantId }: EventCardProps) {
  const [regStatus, setRegStatus] = useState<RegistrationRow["status"] | null>(registrationStatus);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
    <article className="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="truncate text-base font-semibold text-neutral-100">
            {event.name}
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            {formatDateRange(event.starts_at, event.ends_at)}
          </p>
        </div>

        <span
          className={[
            "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
            STATUS_COLORS[event.status],
          ].join(" ")}
        >
          {STATUS_LABELS[event.status]}
        </span>
      </div>

      {event.location && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-400">
          <LocationIcon />
          {event.location}
        </p>
      )}

      {event.description && (
        <p className="mt-3 text-sm text-neutral-300 leading-relaxed">
          {event.description}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {regStatus !== null && (
          <span className="rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs font-medium text-neutral-300">
            {REG_LABELS[regStatus]}
          </span>
        )}

        {canRegister && (
          <button
            type="button"
            onClick={handleRegister}
            disabled={isPending}
            className="rounded-md bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {isPending ? "Registering…" : "Register"}
          </button>
        )}

        {canUnregister && (
          <button
            type="button"
            onClick={handleUnregister}
            disabled={isPending}
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:border-neutral-600 hover:text-neutral-200 disabled:opacity-50"
          >
            {isPending ? "Removing…" : "Unregister"}
          </button>
        )}

        {!participantId && (event.status === "not_started" || event.status === "ongoing") && (
          <span className="text-xs text-neutral-500">
            Complete your profile to register for events.
          </span>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}

function LocationIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
