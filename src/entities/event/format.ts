import type { EventFormat, EventRow, EventStatus } from "./types";

/**
 * Display helpers shared by the events list card and the event detail page.
 * Pure functions only: safe to import from server and client components.
 */

export const STATUS_LABELS: Record<EventStatus, string> = {
  not_started: "Upcoming",
  ongoing: "Ongoing",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Border / shadow / badge color per status, from the stripe palette. */
export const STATUS_COLORS: Record<EventStatus, string> = {
  not_started: "#2c8f8f",
  ongoing: "#3aaa6e",
  completed: "#b89a0a",
  cancelled: "#b32a0e",
};

export const FORMAT_LABELS: Record<EventFormat, string> = {
  in_person: "In person",
  online: "Online",
  hybrid: "Hybrid",
};

const DEFAULT_TZ = "Asia/Manila";

/** Falls back to Manila time if the stored timezone is not a valid IANA name. */
export function safeTimeZone(tz: string | null | undefined): string {
  if (!tz) return DEFAULT_TZ;
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_TZ;
  }
}

export function fmtDay(iso: string, tz: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: safeTimeZone(tz),
  });
}

export function fmtShortDate(iso: string, tz: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: safeTimeZone(tz),
  });
}

export function fmtTime(iso: string, tz: string): string {
  return new Date(iso).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: safeTimeZone(tz),
  });
}

/** "GMT+8" style label for the zone at that instant. */
export function fmtZone(iso: string, tz: string): string {
  const part = new Intl.DateTimeFormat("en", { timeZone: safeTimeZone(tz), timeZoneName: "short" })
    .formatToParts(new Date(iso))
    .find((p) => p.type === "timeZoneName");
  return part?.value ?? safeTimeZone(tz);
}

/** Calendar-day key (YYYY-MM-DD) of an instant in the given zone, for grouping and comparisons. */
export function dayKey(iso: string, tz: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: safeTimeZone(tz) });
}

export function isSameDay(a: string, b: string, tz: string): boolean {
  return dayKey(a, tz) === dayKey(b, tz);
}

export type RegistrationAvailability =
  | "open"
  | "not_open" // registration window has not started
  | "closed" // window ended, or the event is over / cancelled
  | "full"; // capacity reached

/**
 * Mirrors the rules enforced by the event_registrations_guard trigger and the register API,
 * so the page can explain why registering is unavailable instead of failing on click.
 * The database remains the authority.
 */
export function getRegistrationAvailability(
  event: Pick<EventRow, "status" | "capacity" | "registration_opens_at" | "registration_closes_at" | "ends_at">,
  goingCount: number,
  now: Date = new Date()
): RegistrationAvailability {
  if (event.status === "completed" || event.status === "cancelled") return "closed";
  if (event.registration_opens_at && now < new Date(event.registration_opens_at)) return "not_open";
  if (event.registration_closes_at && now >= new Date(event.registration_closes_at)) return "closed";
  if (event.capacity !== null && goingCount >= event.capacity) return "full";
  return "open";
}

/** Google Calendar "add event" link. Times are sent as UTC instants. */
export function googleCalendarUrl(
  event: Pick<EventRow, "name" | "summary" | "starts_at" | "ends_at" | "location" | "location_address">,
  pageUrl: string | null
): string {
  const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const where = [event.location, event.location_address].filter(Boolean).join(", ");
  const details = [event.summary, pageUrl].filter(Boolean).join("\n\n");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.name,
    dates: `${stamp(event.starts_at)}/${stamp(event.ends_at)}`,
  });
  if (details) params.set("details", details);
  if (where) params.set("location", where);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
