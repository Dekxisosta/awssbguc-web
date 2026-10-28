import type { EventFormat, EventRow, EventStatus } from "./types";
import { colors } from "@/tailwind.tokens";

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
  not_started: colors.pix.teal,
  ongoing: colors.pix.green,
  completed: colors.pix.mustard,
  cancelled: colors.pix.rust,
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

/**
 * Offset (ms) of a zone from UTC at a given instant: positive east of Greenwich.
 */
function zoneOffsetMs(ts: number, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: safeTimeZone(tz),
    hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(ts));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(ts / 1000) * 1000;
}

/**
 * Turns a wall-clock value from a <input type="datetime-local"> ("2026-11-05T14:30") into the ISO instant
 * it means in the given IANA zone, regardless of the browser's own zone. Returns null for empty / invalid input.
 */
export function zonedInputToIso(local: string, tz: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!m) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let ts = guess - zoneOffsetMs(guess, tz);
  ts = guess - zoneOffsetMs(ts, tz); // second pass settles DST edges
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Inverse of zonedInputToIso: an ISO instant as the "YYYY-MM-DDTHH:mm" wall clock of the given zone. */
export function isoToZonedInput(iso: string | null | undefined, tz: string): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: safeTimeZone(tz),
    hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).formatToParts(new Date(t));
  const get = (k: string) => parts.find((p) => p.type === k)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
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
