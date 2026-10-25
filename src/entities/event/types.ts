export type EventStatus = "not_started" | "ongoing" | "completed" | "cancelled";
export type EventFormat = "in_person" | "online" | "hybrid";
export type RegistrationStatus = "registered" | "attended" | "not_attended";

/** One slot in an event's timetable. Times are ISO 8601; display them in the event's timezone. */
export interface ScheduleItem {
  starts_at: string;
  ends_at?: string;
  title: string;
  speaker?: string;
  description?: string;
}

/** A row of `events` as returned to public pages (published events only, via RLS). */
export interface EventRow {
  event_id: string;
  /** URL-friendly unique id (migration 20260011). */
  slug: string;
  name: string;
  /** One-line tagline for cards (max 200 chars). */
  summary: string | null;
  /** Long description. */
  description: string | null;
  cover_image_url: string | null;
  format: EventFormat;
  /** Venue name. */
  location: string | null;
  location_address: string | null;
  /** Map link, or a public join / livestream page. */
  location_url: string | null;
  timezone: string;
  starts_at: string;
  ends_at: string;
  /** null = unlimited. */
  capacity: number | null;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  host_name: string | null;
  tags: string[];
  /** Optional timetable, sorted by start time. null = no schedule. */
  schedule: ScheduleItem[] | null;
  status: EventStatus;
}

/** Columns the public events pages select. Keep in sync with EventRow. */
export const EVENT_PUBLIC_COLUMNS =
  "event_id, slug, name, summary, description, cover_image_url, format, location, location_address, " +
  "location_url, timezone, starts_at, ends_at, capacity, registration_opens_at, registration_closes_at, " +
  "host_name, tags, schedule, status";

export interface RegistrationRow {
  event_id: string;
  status: RegistrationStatus;
}

/**
 * Row of the `event_attendee_counts` view. Every published event has one row
 * (zeros when nobody registered). `total_count = public_count + hidden_count`.
 */
export interface EventAttendeeCounts {
  event_id: string;
  total_count: number;
  public_count: number;
  hidden_count: number;
}

/**
 * Row of the `event_public_attendees` view: a registrant who is a public
 * member. Deliberately minimal: username and avatar only.
 */
export interface EventPublicAttendee {
  event_id: string;
  username: string;
  avatar_url: string | null;
}
