/**
 * src/shared/lib/events/index.ts
 *
 * Server-side helpers for the events CMS: input validation shared by the
 * create (POST) and update (PATCH) handlers, and cover-image cleanup.
 * Not imported by client components.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export const EVENT_STATUSES = ["not_started", "ongoing", "completed", "cancelled"] as const;
export const EVENT_FORMATS = ["in_person", "online", "hybrid"] as const;
export const COVER_BUCKET = "event-covers";

/** Columns the admin CMS reads and writes. */
export const EVENT_COLUMNS =
  "event_id, slug, name, summary, description, cover_image_url, format, location, location_address, " +
  "location_url, timezone, starts_at, ends_at, capacity, registration_opens_at, registration_closes_at, " +
  "host_name, tags, schedule, is_published, status, created_by, created_at, updated_at";

export interface ScheduleItem {
  starts_at: string;
  ends_at?: string;
  title: string;
  speaker?: string;
  description?: string;
}

export interface EventWrite {
  name?: string;
  slug?: string;
  summary?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
  format?: (typeof EVENT_FORMATS)[number];
  location?: string | null;
  location_address?: string | null;
  location_url?: string | null;
  timezone?: string;
  starts_at?: string;
  ends_at?: string;
  capacity?: number | null;
  registration_opens_at?: string | null;
  registration_closes_at?: string | null;
  host_name?: string | null;
  tags?: string[];
  schedule?: ScheduleItem[] | null;
  is_published?: boolean;
  status?: (typeof EVENT_STATUSES)[number];
}

type Result = { ok: true; data: EventWrite } | { ok: false; error: string };

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function optText(v: unknown, max: number, label: string): { v?: string | null; err?: string } {
  if (v === undefined) return {};
  if (v === null) return { v: null };
  if (typeof v !== "string") return { err: `${label} must be text` };
  const t = v.trim();
  if (t.length > max) return { err: `${label} must be at most ${max} characters` };
  return { v: t === "" ? null : t };
}

function optUrl(v: unknown, label: string): { v?: string | null; err?: string } {
  const r = optText(v, 2000, label);
  if (r.err || !r.v) return r;
  try {
    const u = new URL(r.v);
    if (u.protocol !== "https:" && u.protocol !== "http:") return { err: `${label} must be an http(s) URL` };
  } catch {
    return { err: `${label} must be a valid URL` };
  }
  return r;
}

function optDate(v: unknown, label: string): { v?: string | null; err?: string } {
  if (v === undefined) return {};
  if (v === null || v === "") return { v: null };
  if (typeof v !== "string" || Number.isNaN(Date.parse(v))) return { err: `${label} must be a valid date` };
  return { v: new Date(v).toISOString() };
}

const MAX_SCHEDULE_ITEMS = 50;

/**
 * Validates a schedule. null / [] clear it (stored as NULL). Items are trimmed,
 * empty optional fields dropped, and the list is sorted by start time.
 */
function parseSchedule(v: unknown): { v?: ScheduleItem[] | null; err?: string } {
  if (v === null) return { v: null };
  if (!Array.isArray(v)) return { err: "schedule must be a list" };
  if (v.length === 0) return { v: null };
  if (v.length > MAX_SCHEDULE_ITEMS) return { err: `schedule can have at most ${MAX_SCHEDULE_ITEMS} items` };

  const items: ScheduleItem[] = [];
  for (let i = 0; i < v.length; i++) {
    const n = i + 1;
    const raw = (v[i] ?? {}) as Record<string, unknown>;

    const title = typeof raw.title === "string" ? raw.title.trim() : "";
    if (!title) return { err: `schedule item ${n}: title is required` };
    if (title.length > 120) return { err: `schedule item ${n}: title must be at most 120 characters` };

    const start = optDate(raw.starts_at, `schedule item ${n} start`);
    if (start.err) return { err: start.err };
    if (!start.v) return { err: `schedule item ${n}: start time is required` };

    const end = optDate(raw.ends_at, `schedule item ${n} end`);
    if (end.err) return { err: end.err };
    if (end.v && new Date(end.v) <= new Date(start.v))
      return { err: `schedule item ${n}: end must be after start` };

    const speaker = optText(raw.speaker, 120, `schedule item ${n} speaker`);
    if (speaker.err) return { err: speaker.err };
    const description = optText(raw.description, 500, `schedule item ${n} description`);
    if (description.err) return { err: description.err };

    const item: ScheduleItem = { starts_at: start.v, title };
    if (end.v) item.ends_at = end.v;
    if (speaker.v) item.speaker = speaker.v;
    if (description.v) item.description = description.v;
    items.push(item);
  }

  items.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  return { v: items };
}

/**
 * Validates and normalises a request body. Only keys present in the body are
 * returned, so the same function serves partial PATCH updates.
 * When `requireCore` is true (create), name, starts_at and ends_at are required.
 */
export function parseEventInput(body: unknown, requireCore: boolean): Result {
  const b = (body ?? {}) as Record<string, unknown>;
  const out: EventWrite = {};

  // name
  if (b.name !== undefined || requireCore) {
    if (typeof b.name !== "string" || !b.name.trim()) return { ok: false, error: "name is required" };
    if (b.name.trim().length > 120) return { ok: false, error: "name must be at most 120 characters" };
    out.name = b.name.trim();
  }

  // slug
  if (b.slug !== undefined && b.slug !== null && b.slug !== "") {
    if (typeof b.slug !== "string" || !SLUG_RE.test(b.slug) || b.slug.length > 80)
      return { ok: false, error: "slug may only contain lowercase letters, numbers and single hyphens (max 80)" };
    out.slug = b.slug;
  }

  // text fields
  for (const [key, max, label] of [
    ["summary", 200, "summary"],
    ["description", 10000, "description"],
    ["location", 200, "location"],
    ["location_address", 300, "address"],
    ["host_name", 120, "host name"],
  ] as const) {
    const r = optText(b[key], max, label);
    if (r.err) return { ok: false, error: r.err };
    if (r.v !== undefined) out[key] = r.v;
  }

  // urls
  for (const [key, label] of [
    ["location_url", "location link"],
    ["cover_image_url", "cover image URL"],
  ] as const) {
    const r = optUrl(b[key], label);
    if (r.err) return { ok: false, error: r.err };
    if (r.v !== undefined) out[key] = r.v;
  }

  // enums
  if (b.format !== undefined) {
    if (!EVENT_FORMATS.includes(b.format as never))
      return { ok: false, error: `format must be one of: ${EVENT_FORMATS.join(", ")}` };
    out.format = b.format as EventWrite["format"];
  }
  if (b.status !== undefined) {
    if (!EVENT_STATUSES.includes(b.status as never))
      return { ok: false, error: `status must be one of: ${EVENT_STATUSES.join(", ")}` };
    out.status = b.status as EventWrite["status"];
  }

  // timezone
  if (b.timezone !== undefined) {
    try {
      if (typeof b.timezone !== "string") throw new Error();
      new Intl.DateTimeFormat("en", { timeZone: b.timezone });
      out.timezone = b.timezone;
    } catch {
      return { ok: false, error: "timezone must be a valid IANA timezone" };
    }
  }

  // dates
  for (const key of ["starts_at", "ends_at"] as const) {
    if (b[key] !== undefined || requireCore) {
      const r = optDate(b[key], key);
      if (r.err) return { ok: false, error: r.err };
      if (!r.v) return { ok: false, error: `${key} is required` };
      out[key] = r.v;
    }
  }
  for (const key of ["registration_opens_at", "registration_closes_at"] as const) {
    const r = optDate(b[key], key);
    if (r.err) return { ok: false, error: r.err };
    if (r.v !== undefined) out[key] = r.v;
  }

  // capacity
  if (b.capacity !== undefined) {
    if (b.capacity === null || b.capacity === "") out.capacity = null;
    else {
      const n = Number(b.capacity);
      if (!Number.isInteger(n) || n < 1 || n > 100000)
        return { ok: false, error: "capacity must be a whole number of at least 1 (leave empty for unlimited)" };
      out.capacity = n;
    }
  }

  // tags
  if (b.tags !== undefined) {
    if (!Array.isArray(b.tags)) return { ok: false, error: "tags must be a list" };
    const tags = Array.from(
      new Set(b.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean))
    );
    if (tags.length > 10) return { ok: false, error: "at most 10 tags" };
    if (tags.some((t) => t.length > 30)) return { ok: false, error: "each tag must be at most 30 characters" };
    out.tags = tags;
  }

  // schedule
  if (b.schedule !== undefined) {
    const r = parseSchedule(b.schedule);
    if (r.err) return { ok: false, error: r.err };
    out.schedule = r.v ?? null;
  }

  // publish flag
  if (b.is_published !== undefined) {
    if (typeof b.is_published !== "boolean") return { ok: false, error: "is_published must be true or false" };
    out.is_published = b.is_published;
  }

  return { ok: true, data: out };
}

/** Cross-field checks on the final (merged) values. Returns an error message or null. */
export function checkEventWindow(e: {
  starts_at?: string | null;
  ends_at?: string | null;
  registration_opens_at?: string | null;
  registration_closes_at?: string | null;
}): string | null {
  if (e.starts_at && e.ends_at && new Date(e.ends_at) <= new Date(e.starts_at))
    return "ends_at must be after starts_at";
  if (
    e.registration_opens_at && e.registration_closes_at &&
    new Date(e.registration_closes_at) <= new Date(e.registration_opens_at)
  )
    return "registration must close after it opens";
  return null;
}

/** Storage object path for a cover URL that points at our bucket, else null. */
export function coverPathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${COVER_BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marker.length).split("?")[0]) || null;
}

/** Best-effort removal of a cover image we uploaded. Never throws. */
export async function removeCoverIfOurs(admin: SupabaseClient, url: string | null | undefined) {
  const path = coverPathFromUrl(url);
  if (!path) return;
  try {
    await admin.storage.from(COVER_BUCKET).remove([path]);
  } catch (e) {
    console.error("[events] cover cleanup failed:", e);
  }
}
