"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { bodyFont, hd } from "@/src/shared/config/fonts";
import {
  isoToZonedInput, safeTimeZone, zonedInputToIso,
} from "@/src/entities/event/format";
import { BTN_SECONDARY, BTN_SUBMIT, focus, inputCls } from "./styles";
import { uploadEventCover, useCreateEvent, useDeleteEvent, useUpdateEvent } from "../model/queries";
import type { EventRow } from "../model/types";
import { AlertTriangle, ChevronLeft, ImageUp, Loader2, Plus, Trash2, Upload } from "lucide-react";

/**
 * Create / edit form for an event. One form, every column of `events`:
 * name, slug, summary, description, cover, format, venue / address / link, timezone,
 * start + end, capacity, registration window, host, tags, schedule, status and the publish flag.
 *
 * Every date-time here is typed in the EVENT'S timezone (not the browser's), converted on save,
 * so an event created from anywhere shows the same wall-clock time on the public pages.
 */

type Toast = (t: { message: string; type: "success" | "error" }) => void;
type Status = EventRow["status"];
type Format = EventRow["format"];

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "not_started", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const FORMAT_OPTIONS: { value: Format; label: string }[] = [
  { value: "in_person", label: "In person" },
  { value: "online", label: "Online" },
  { value: "hybrid", label: "Hybrid" },
];

const FALLBACK_ZONES = [
  "Asia/Manila", "Asia/Singapore", "Asia/Tokyo", "Asia/Seoul", "Asia/Kolkata", "Asia/Dubai",
  "Europe/London", "Europe/Paris", "America/New_York", "America/Chicago",
  "America/Los_Angeles", "Australia/Sydney", "UTC",
];

const DEFAULT_TZ = "Asia/Manila";
const MAX_SCHEDULE = 50;
const MAX_TAGS = 10;
const SUMMARY_MAX = 200;
const DESCRIPTION_MAX = 10000;

interface ScheduleDraft {
  key: string;
  starts_at: string;
  ends_at: string;
  title: string;
  speaker: string;
  description: string;
}

interface FormState {
  name: string;
  slug: string;
  summary: string;
  description: string;
  cover_image_url: string;
  format: Format;
  location: string;
  location_address: string;
  location_url: string;
  timezone: string;
  starts_at: string;
  ends_at: string;
  capacity: string;
  registration_opens_at: string;
  registration_closes_at: string;
  host_name: string;
  tags: string;
  schedule: ScheduleDraft[];
  status: Status;
  is_published: boolean;
}

let draftSeq = 0;
const nextKey = () => `s${++draftSeq}`;

function emptyState(): FormState {
  return {
    name: "", slug: "", summary: "", description: "", cover_image_url: "",
    format: "in_person", location: "", location_address: "", location_url: "",
    timezone: DEFAULT_TZ, starts_at: "", ends_at: "", capacity: "",
    registration_opens_at: "", registration_closes_at: "", host_name: "", tags: "",
    schedule: [], status: "not_started", is_published: true,
  };
}

function stateFromEvent(e: EventRow): FormState {
  const tz = safeTimeZone(e.timezone);
  return {
    name: e.name,
    slug: e.slug,
    summary: e.summary ?? "",
    description: e.description ?? "",
    cover_image_url: e.cover_image_url ?? "",
    format: e.format,
    location: e.location ?? "",
    location_address: e.location_address ?? "",
    location_url: e.location_url ?? "",
    timezone: tz,
    starts_at: isoToZonedInput(e.starts_at, tz),
    ends_at: isoToZonedInput(e.ends_at, tz),
    capacity: e.capacity === null ? "" : String(e.capacity),
    registration_opens_at: isoToZonedInput(e.registration_opens_at, tz),
    registration_closes_at: isoToZonedInput(e.registration_closes_at, tz),
    host_name: e.host_name ?? "",
    tags: (e.tags ?? []).join(", "),
    schedule: (e.schedule ?? []).map((i) => ({
      key: nextKey(),
      starts_at: isoToZonedInput(i.starts_at, tz),
      ends_at: isoToZonedInput(i.ends_at, tz),
      title: i.title,
      speaker: i.speaker ?? "",
      description: i.description ?? "",
    })),
    status: e.status,
    is_published: e.is_published,
  };
}

function parseTags(raw: string): string[] {
  return Array.from(new Set(raw.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)));
}

// ── CSV import for the schedule ──────────────────────────────────────────────

/** RFC 4180-style parser: quoted fields, "" escapes, newlines inside quotes, and , ; or tab delimiters. */
function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const delim = [",", ";", "\t"].reduce(
    (best, d) => (firstLine.split(d).length > firstLine.split(best).length ? d : best),
    ",",
  );
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"' && field === "") {
      quoted = true;
    } else if (c === delim) {
      row.push(field); field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field); field = "";
      rows.push(row); row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const pad2 = (n: number | string) => String(n).padStart(2, "0");

function buildDateTime(y: number, mo: number, d: number, h: number, mi: number, ap?: string): string | null {
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || mi > 59) return null;
  if (ap) {
    if (h < 1 || h > 12) return null;
    h = (h % 12) + (ap.toLowerCase() === "pm" ? 12 : 0);
  } else if (h > 23) return null;
  return `${y}-${pad2(mo)}-${pad2(d)}T${pad2(h)}:${pad2(mi)}`;
}

/**
 * Turns one CSV cell into a `datetime-local` value (wall-clock time, the event's timezone).
 * Accepts "2026-11-14 13:00", "2026-11-14T13:00:00", "11/14/2026 1:00 PM", and time-only values
 * ("13:00", "1:00 PM", "1pm") which take `defaultDate` (the event's start date).
 */
function parseCsvDateTime(raw: string, defaultDate: string): string | null {
  const v = raw.trim().replace(/\s+/g, " ").replace(/([ap])\.m\.?/gi, "$1m");
  if (!v) return null;
  let m: RegExpMatchArray | null;
  if ((m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[T ](\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?\s*(am|pm)?$/i)))
    return buildDateTime(+m[1], +m[2], +m[3], +m[4], +m[5], m[6]);
  if ((m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[ ,T]+(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/i)))
    return buildDateTime(+m[3], +m[1], +m[2], +m[4], +m[5], m[6]);
  const day = defaultDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!day) return null;
  if ((m = v.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?$/i)))
    return buildDateTime(+day[1], +day[2], +day[3], +m[1], +m[2], m[3]);
  if ((m = v.match(/^(\d{1,2})\s*(am|pm)$/i)))
    return buildDateTime(+day[1], +day[2], +day[3], +m[1], 0, m[2]);
  return null;
}

/** Splits "1:00 PM - 2:00 PM" (hyphen, en/em dash or "to") into its two halves. */
function splitTimeRange(v: string): [string, string] | null {
  const t = v.trim();
  const parts = t.split(/\s+[-–—]\s+|\s*[–—]\s*|\s+to\s+/i);
  if (parts.length === 2) return [parts[0], parts[1]];
  const m = t.match(/^(\d{1,2}(?::\d{2})?\s*(?:[ap]\.?m\.?)?)\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:[ap]\.?m\.?)?)$/i);
  return m ? [m[1], m[2]] : null;
}

const CSV_ALIASES: Record<"title" | "start" | "end" | "time" | "speaker" | "description", string[]> = {
  title: ["title", "name", "session", "topic", "activity", "event", "program", "item"],
  start: ["start", "starts", "starts_at", "start_time", "start_date_time", "begin", "from"],
  end: ["end", "ends", "ends_at", "end_time", "end_date_time", "until", "to"],
  time: ["time", "schedule", "timeslot", "time_slot", "when"],
  speaker: ["speaker", "speakers", "presenter", "presenters", "host", "facilitator"],
  description: ["description", "details", "detail", "notes", "desc", "summary"],
};

function scheduleFromCsv(
  text: string,
  defaultDate: string,
): { items: Omit<ScheduleDraft, "key">[]; errors: string[] } {
  const rows = parseCsv(text);
  if (rows.length === 0) return { items: [], errors: ["The CSV is empty."] };

  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""));
  const col = (k: keyof typeof CSV_ALIASES) => header.findIndex((h) => CSV_ALIASES[k].includes(h));
  const idx = {
    title: col("title"), start: col("start"), end: col("end"),
    time: col("time"), speaker: col("speaker"), description: col("description"),
  };
  if (idx.title < 0)
    return { items: [], errors: ['The first row must be a header with a "title" column (also accepted: name, session, topic, activity).'] };
  if (idx.start < 0 && idx.time < 0)
    return { items: [], errors: ['The header needs a "start" column (or a "time" column such as "1:00 PM - 2:00 PM").'] };

  const cell = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
  const items: Omit<ScheduleDraft, "key">[] = [];
  const errors: string[] = [];

  rows.slice(1).forEach((r, i) => {
    const n = i + 2; // spreadsheet row number (header is row 1)
    const title = cell(r, idx.title);
    if (!title) { errors.push(`Row ${n}: title is empty, skipped.`); return; }

    let startRaw = cell(r, idx.start);
    let endRaw = cell(r, idx.end);
    if (!startRaw && idx.time >= 0) {
      const range = splitTimeRange(cell(r, idx.time));
      if (range) [startRaw, endRaw] = endRaw ? [range[0], endRaw] : range;
      else startRaw = cell(r, idx.time);
    }

    const starts = parseCsvDateTime(startRaw, defaultDate);
    if (!starts) {
      errors.push(
        startRaw
          ? defaultDate
            ? `Row ${n}: couldn't read the start time "${startRaw}", skipped.`
            : `Row ${n}: "${startRaw}" needs a date. Set the event's start first, or include the date in the CSV.`
          : `Row ${n}: start time is missing, skipped.`,
      );
      return;
    }
    let ends = "";
    if (endRaw) {
      const parsed = parseCsvDateTime(endRaw, starts.slice(0, 10));
      if (!parsed) { errors.push(`Row ${n}: couldn't read the end time "${endRaw}", skipped.`); return; }
      if (parsed <= starts) { errors.push(`Row ${n}: end must be after start, skipped.`); return; }
      ends = parsed;
    }
    items.push({
      starts_at: starts,
      ends_at: ends,
      title,
      speaker: cell(r, idx.speaker),
      description: cell(r, idx.description),
    });
  });
  return { items, errors };
}

function isHttpUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function listZones(): string[] {
  try {
    const fn = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
    if (fn) {
      const zones = fn("timeZone");
      return zones.includes("UTC") ? zones : [...zones, "UTC"];
    }
  } catch { /* older browsers */ }
  return FALLBACK_ZONES;
}

function validTz(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// ─── Small pieces ─────────────────────────────────────────────────────────────

function Field({ label, error, hint, className = "", children }: {
  label: string; error?: string; hint?: string; className?: string; children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-base">{label}</span>
      {children}
      {error
        ? <span className="text-base text-pix-coral" role="alert">{error}</span>
        : hint && <span className="text-base text-pix-butter/55">{hint}</span>}
    </label>
  );
}

function Group({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-4 border-pix-butter/25 p-3 sm:col-span-2">
      <legend className={`${hd} px-2 text-2xl`}>{title}</legend>
      {sub && <p className="-mt-1 mb-3 text-sm text-pix-butter/60">{sub}</p>}
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

// ─── Delete confirmation ──────────────────────────────────────────────────────

/** "Are you sure?" prompt for deleting an event. Nothing is deleted until the person confirms. */
export function DeleteEventDialog({ event, onCancel, onDeleted, setToast }: {
  event: EventRow;
  onCancel: () => void;
  onDeleted: () => void;
  setToast: Toast;
}) {
  const del = useDeleteEvent();
  const busy = del.isPending;
  const cancelRef = useRef<HTMLButtonElement>(null);
  const regs = event.registrations.registered + event.registrations.attended + event.registrations.not_attended;

  useEffect(() => {
    cancelRef.current?.focus(); // the safe choice is focused by default
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  async function confirmDelete() {
    try {
      await del.mutateAsync(event.event_id);
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Failed to delete event", type: "error" });
      return;
    }
    setToast({ message: "Event deleted", type: "success" });
    onDeleted();
  }

  // Rendered into <body> so it sits above the site navbar and the admin page's stacking contexts.
  if (typeof document === "undefined") return null;
  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/80" style={{ zIndex: 100000 }} onClick={() => !busy && onCancel()} aria-hidden="true" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-event-title"
        aria-describedby="delete-event-desc"
        className={`${bodyFont.className} fixed left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 border-4 border-pix-rust bg-black p-4 text-pix-butter shadow-pixel-rust-6`}
        style={{ zIndex: 100001 }}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={22} className="shrink-0 text-pix-coral" aria-hidden="true" />
          <h3 id="delete-event-title" className={`${hd} text-3xl`}>Are you sure?</h3>
        </div>
        <div id="delete-event-desc" className="mt-3 space-y-2 text-base">
          <p>
            You are about to delete <span className="break-words text-pix-coral">“{event.name}”</span>.
          </p>
          <p className="text-pix-butter/80">
            This permanently removes the event
            {regs > 0 ? <> and its {regs} registration{regs !== 1 ? "s" : ""}</> : <> and any registrations it has</>}
            {event.cover_image_url ? ", plus its uploaded cover image" : ""}. This cannot be undone.
          </p>
          <p className="text-pix-butter/60">To keep it but hide it from the public, set it to Draft instead.</p>
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-3">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={busy} className={`${BTN_SECONDARY} !px-5 !py-1.5`}>
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={busy}
            className={`inline-flex items-center justify-center gap-2 border-4 border-pix-rust bg-pix-rust px-5 py-1.5 text-base text-pix-butter transition-colors hover:bg-pix-coral hover:text-black disabled:pointer-events-none disabled:opacity-50 ${focus}`}
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Yes, delete it
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export function EventForm({ event, onClose, setToast }: {
  /** The event being edited; omit to create a new one. */
  event?: EventRow;
  onClose: () => void;
  setToast: Toast;
}) {
  const editing = !!event;
  const [form, setForm] = useState<FormState>(() => (event ? stateFromEvent(event) : emptyState()));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const saving = createEvent.isPending || updateEvent.isPending;
  const zones = useMemo(listZones, []);

  const csvRef = useRef<HTMLInputElement>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [importMsg, setImportMsg] = useState<{ kind: "success" | "error"; text: string; details: string[] } | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const text = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    set(k, e.target.value as never);

  const tz = validTz(form.timezone) ? form.timezone : DEFAULT_TZ;

  // ── schedule rows ──
  function addScheduleRow() {
    setForm((f) => {
      if (f.schedule.length >= MAX_SCHEDULE) return f;
      // New rows start at the previous row's end (or the event start) to save typing.
      const last = f.schedule[f.schedule.length - 1];
      const seed = last?.ends_at || last?.starts_at || f.starts_at;
      return {
        ...f,
        schedule: [...f.schedule, { key: nextKey(), starts_at: seed, ends_at: "", title: "", speaker: "", description: "" }],
      };
    });
  }
  const patchRow = (key: string, patch: Partial<ScheduleDraft>) =>
    setForm((f) => ({ ...f, schedule: f.schedule.map((r) => (r.key === key ? { ...r, ...patch } : r)) }));
  const removeRow = (key: string) => setForm((f) => ({ ...f, schedule: f.schedule.filter((r) => r.key !== key) }));

  // ── schedule CSV import (file or pasted text); rows are appended to the existing items ──
  function importCsv(text: string) {
    const { items, errors } = scheduleFromCsv(text, form.starts_at.slice(0, 10));
    const room = Math.max(0, MAX_SCHEDULE - form.schedule.length);
    const accepted = items.slice(0, room);
    const details = errors.slice(0, 5);
    if (errors.length > 5) details.push(`…and ${errors.length - 5} more.`);
    if (items.length > room) details.push(`Only ${room} more item${room === 1 ? "" : "s"} fit (limit ${MAX_SCHEDULE}); the rest were not imported.`);

    if (accepted.length === 0) {
      setImportMsg({ kind: "error", text: "Nothing was imported.", details });
      return;
    }
    setForm((f) => ({ ...f, schedule: [...f.schedule, ...accepted.map((i) => ({ key: nextKey(), ...i }))] }));
    setImportMsg({
      kind: "success",
      text: `Imported ${accepted.length} item${accepted.length === 1 ? "" : "s"}${errors.length ? `, skipped ${errors.length} row${errors.length === 1 ? "" : "s"}` : ""}.`,
      details,
    });
    setPasteText("");
    setPasteOpen(false);
  }

  async function onPickCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    if (file.size > 1_000_000) {
      setImportMsg({ kind: "error", text: "That file is too large (max 1 MB).", details: [] });
      return;
    }
    importCsv(await file.text());
  }

  function clearSchedule() {
    if (form.schedule.length === 0) return;
    if (!window.confirm(`Remove all ${form.schedule.length} schedule items?`)) return;
    setForm((f) => ({ ...f, schedule: [] }));
    setImportMsg(null);
  }

  // ── cover upload ──
  async function onPickCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((x) => ({ ...x, cover_image_url: "Image is larger than 5 MB." }));
      return;
    }
    setUploading(true);
    setErrors((x) => { const n = { ...x }; delete n.cover_image_url; return n; });
    try {
      set("cover_image_url", await uploadEventCover(file));
    } catch (err) {
      setErrors((x) => ({ ...x, cover_image_url: err instanceof Error ? err.message : "Upload failed." }));
    } finally {
      setUploading(false);
    }
  }

  // ── validate + build the payload ──
  function build(): { body: Record<string, unknown> } | { errs: Record<string, string> } {
    const errs: Record<string, string> = {};
    const name = form.name.trim();
    if (!name) errs.name = "Name is required.";
    else if (name.length > 120) errs.name = "Name must be at most 120 characters.";

    const slug = form.slug.trim();
    if (slug && (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 80))
      errs.slug = "Lowercase letters, numbers and single hyphens only (max 80).";

    if (form.summary.trim().length > SUMMARY_MAX) errs.summary = `Summary must be at most ${SUMMARY_MAX} characters.`;
    if (form.description.trim().length > DESCRIPTION_MAX) errs.description = `Description must be at most ${DESCRIPTION_MAX} characters.`;

    if (form.location_url.trim() && !isHttpUrl(form.location_url.trim())) errs.location_url = "Must be an http(s) link.";
    if (form.cover_image_url.trim() && !isHttpUrl(form.cover_image_url.trim())) errs.cover_image_url = "Must be an http(s) link.";

    if (!validTz(form.timezone.trim())) errs.timezone = "Pick a valid IANA timezone, e.g. Asia/Manila.";
    const zone = validTz(form.timezone.trim()) ? form.timezone.trim() : DEFAULT_TZ;

    const startsIso = zonedInputToIso(form.starts_at, zone);
    const endsIso = zonedInputToIso(form.ends_at, zone);
    if (!startsIso) errs.starts_at = "Start date/time is required.";
    if (!endsIso) errs.ends_at = "End date/time is required.";
    if (startsIso && endsIso && new Date(endsIso) <= new Date(startsIso)) errs.ends_at = "End must be after start.";

    let capacity: number | null = null;
    if (form.capacity.trim()) {
      const n = Number(form.capacity);
      if (!Number.isInteger(n) || n < 1 || n > 100000) errs.capacity = "A whole number of at least 1, or leave empty for no limit.";
      else capacity = n;
    }

    const opensIso = form.registration_opens_at ? zonedInputToIso(form.registration_opens_at, zone) : null;
    const closesIso = form.registration_closes_at ? zonedInputToIso(form.registration_closes_at, zone) : null;
    if (opensIso && closesIso && new Date(closesIso) <= new Date(opensIso))
      errs.registration_closes_at = "Registration must close after it opens.";

    const tags = parseTags(form.tags);
    if (tags.length > MAX_TAGS) errs.tags = `At most ${MAX_TAGS} tags.`;
    else if (tags.some((t) => t.length > 30)) errs.tags = "Each tag must be at most 30 characters.";

    const schedule: Record<string, string>[] = [];
    form.schedule.forEach((r, i) => {
      const n = i + 1;
      const sIso = zonedInputToIso(r.starts_at, zone);
      const eIso = r.ends_at ? zonedInputToIso(r.ends_at, zone) : null;
      let err = "";
      if (!r.title.trim()) err = `Schedule item ${n}: title is required.`;
      else if (r.title.trim().length > 120) err = `Schedule item ${n}: title must be at most 120 characters.`;
      else if (!sIso) err = `Schedule item ${n}: start time is required.`;
      else if (eIso && new Date(eIso) <= new Date(sIso)) err = `Schedule item ${n}: end must be after start.`;
      else if (r.speaker.trim().length > 120) err = `Schedule item ${n}: speaker must be at most 120 characters.`;
      else if (r.description.trim().length > 500) err = `Schedule item ${n}: description must be at most 500 characters.`;
      if (err) { errs.schedule = errs.schedule ?? err; return; }
      const item: Record<string, string> = { starts_at: sIso!, title: r.title.trim() };
      if (eIso) item.ends_at = eIso;
      if (r.speaker.trim()) item.speaker = r.speaker.trim();
      if (r.description.trim()) item.description = r.description.trim();
      schedule.push(item);
    });

    if (Object.keys(errs).length > 0) return { errs };

    // On edit every field is sent (empty -> null clears it). On create, empty optional fields are left out.
    const blank = editing ? null : undefined;
    const t = (v: string) => (v.trim() === "" ? blank : v.trim());
    const body: Record<string, unknown> = {
      name,
      summary: t(form.summary),
      description: t(form.description),
      cover_image_url: t(form.cover_image_url),
      format: form.format,
      location: t(form.location),
      location_address: t(form.location_address),
      location_url: t(form.location_url),
      timezone: zone,
      starts_at: startsIso,
      ends_at: endsIso,
      capacity: capacity ?? blank,
      registration_opens_at: opensIso ?? blank,
      registration_closes_at: closesIso ?? blank,
      host_name: t(form.host_name),
      tags,
      schedule,
      status: form.status,
      is_published: form.is_published,
    };
    if (slug && (!editing || slug !== event!.slug)) body.slug = slug;
    return { body };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = build();
    if ("errs" in result) {
      setErrors(result.errs);
      setToast({ message: "Fix the highlighted fields.", type: "error" });
      return;
    }
    setErrors({});
    try {
      if (editing) await updateEvent.mutateAsync({ event_id: event!.event_id, ...result.body });
      else await createEvent.mutateAsync(result.body);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save event";
      // The server names the slug when it collides; show it where the admin can fix it.
      if (/slug/i.test(message)) setErrors({ slug: message });
      setToast({ message, type: "error" });
      return;
    }
    setToast({ message: editing ? "Event saved" : "Event created", type: "success" });
    onClose();
  }

  const cover = form.cover_image_url.trim();

  return (
    <div>
      <button type="button" onClick={onClose} className={`${BTN_SECONDARY} !py-0.5`}>
        <ChevronLeft size={14} /> Back to events
      </button>

      <div className="mt-3 border-4 border-pix-butter p-3 shadow-pixel-teal-4">
        <h3 className={`${hd} mb-3 text-3xl`}>{editing ? "Edit event" : "New event"}</h3>

        <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
          {/* ── Basics ── */}
          <Group title="Basics">
            <Field label="Event name *" error={errors.name} className="sm:col-span-2">
              <input value={form.name} onChange={text("name")} maxLength={120} placeholder="e.g. AWS Cloud Day" className={inputCls(!!errors.name)} />
            </Field>
            <Field
              label="URL slug"
              error={errors.slug}
              hint={editing ? "Changing this breaks links that already point at the event." : "Optional. Leave empty to generate one from the name."}
            >
              <input value={form.slug} onChange={text("slug")} maxLength={80} placeholder="cloud-day-2026" className={inputCls(!!errors.slug)} />
            </Field>
            <Field label="Host" hint="Person or group organising it.">
              <input value={form.host_name} onChange={text("host_name")} maxLength={120} placeholder="e.g. AWSSBG-UC" className={inputCls()} />
            </Field>
            <Field
              label="Summary"
              error={errors.summary}
              hint={`One line shown on cards. ${form.summary.trim().length}/${SUMMARY_MAX}`}
              className="sm:col-span-2"
            >
              <input value={form.summary} onChange={text("summary")} placeholder="A short tagline" className={inputCls(!!errors.summary)} />
            </Field>
            <Field
              label="Description"
              error={errors.description}
              hint={`Shown on the event page; line breaks are kept. ${form.description.trim().length}/${DESCRIPTION_MAX}`}
              className="sm:col-span-2"
            >
              <textarea value={form.description} onChange={text("description")} rows={6} className={`${inputCls(!!errors.description)} resize-y`} />
            </Field>
            <Field label="Tags" error={errors.tags} hint="Comma separated, up to 10, e.g. workshop, serverless" className="sm:col-span-2">
              <input value={form.tags} onChange={text("tags")} placeholder="workshop, serverless" className={inputCls(!!errors.tags)} />
            </Field>
          </Group>

          {/* ── Cover ── */}
          <Group title="Cover image" sub="Shown on the event page and in link previews. JPEG, PNG, WebP or GIF, up to 5 MB.">
            <div className="flex flex-col gap-2 sm:col-span-2">
              {cover && isHttpUrl(cover) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt="Cover preview" className="aspect-[16/9] w-full max-w-md border-4 border-pix-butter/50 object-cover" />
              )}
              <div className="flex flex-wrap items-center gap-3">
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onPickCover} className="sr-only" tabIndex={-1} />
                <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className={BTN_SECONDARY}>
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImageUp size={14} />}
                  {cover ? "Replace image" : "Upload image"}
                </button>
                {cover && (
                  <button type="button" onClick={() => set("cover_image_url", "")} className={BTN_SECONDARY}>
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>
            </div>
            <Field label="…or an image URL" error={errors.cover_image_url} className="sm:col-span-2">
              <input value={form.cover_image_url} onChange={text("cover_image_url")} placeholder="https://" className={inputCls(!!errors.cover_image_url)} />
            </Field>
          </Group>

          {/* ── When ── */}
          <Group title="When" sub="Type the times as they happen at the event: they are saved in the timezone below, whatever your browser's zone is.">
            <Field label="Timezone" error={errors.timezone} hint="IANA name, e.g. Asia/Manila" className="sm:col-span-2">
              <input list="admin-tz-list" value={form.timezone} onChange={text("timezone")} className={inputCls(!!errors.timezone)} />
              <datalist id="admin-tz-list">{zones.map((z) => <option key={z} value={z} />)}</datalist>
            </Field>
            <Field label="Starts at *" error={errors.starts_at}>
              <input type="datetime-local" value={form.starts_at} onChange={text("starts_at")} className={inputCls(!!errors.starts_at)} />
            </Field>
            <Field label="Ends at *" error={errors.ends_at}>
              <input type="datetime-local" value={form.ends_at} onChange={text("ends_at")} className={inputCls(!!errors.ends_at)} />
            </Field>
          </Group>

          {/* ── Where ── */}
          <Group title="Where">
            <Field label="Format">
              <select value={form.format} onChange={text("format")} className={inputCls()}>
                {FORMAT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Venue" hint="Venue name, or the platform for online events.">
              <input value={form.location} onChange={text("location")} maxLength={200} placeholder="e.g. AVR, PnC Main Campus" className={inputCls()} />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <input value={form.location_address} onChange={text("location_address")} maxLength={300} className={inputCls()} />
            </Field>
            <Field
              label={form.format === "online" ? "Join page link" : "Map link"}
              error={errors.location_url}
              hint="Public: anyone can read it, so don't put a private meeting link here."
              className="sm:col-span-2"
            >
              <input value={form.location_url} onChange={text("location_url")} placeholder="https://" className={inputCls(!!errors.location_url)} />
            </Field>
          </Group>

          {/* ── Registration ── */}
          <Group title="Registration">
            <Field label="Seat limit" error={errors.capacity} hint="Empty = no limit.">
              <input type="number" min={1} step={1} value={form.capacity} onChange={text("capacity")} className={inputCls(!!errors.capacity)} />
            </Field>
            <div className="hidden sm:block" />
            <Field label="Registration opens" hint="Empty = open right away.">
              <input type="datetime-local" value={form.registration_opens_at} onChange={text("registration_opens_at")} className={inputCls()} />
            </Field>
            <Field label="Registration closes" error={errors.registration_closes_at} hint="Empty = open until the event ends.">
              <input type="datetime-local" value={form.registration_closes_at} onChange={text("registration_closes_at")} className={inputCls(!!errors.registration_closes_at)} />
            </Field>
          </Group>

          {/* ── Schedule ── */}
          <Group title="Schedule" sub={`Optional timetable shown on the event page, sorted by start time. Up to ${MAX_SCHEDULE} items.`}>
            {/* CSV import */}
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <input ref={csvRef} type="file" accept=".csv,text/csv" onChange={onPickCsv} className="sr-only" tabIndex={-1} aria-hidden="true" />
              <button type="button" onClick={() => csvRef.current?.click()} disabled={form.schedule.length >= MAX_SCHEDULE} className={BTN_SECONDARY}>
                <Upload size={14} /> Import CSV
              </button>
              <button type="button" onClick={() => setPasteOpen((o) => !o)} aria-expanded={pasteOpen} className={BTN_SECONDARY}>
                Paste CSV
              </button>
              {form.schedule.length > 0 && (
                <button type="button" onClick={clearSchedule} className={BTN_SECONDARY}>
                  <Trash2 size={14} /> Clear all
                </button>
              )}
            </div>
            <p className="text-sm text-pix-butter/60 sm:col-span-2">
              CSV needs a header row with <span className="text-pix-butter">title</span> and{" "}
              <span className="text-pix-butter">start</span>; optional: end, speaker, description. Times can be{" "}
              <span className="text-pix-butter">2026-11-14 13:00</span>, <span className="text-pix-butter">11/14/2026 1:00 PM</span>, or just{" "}
              <span className="text-pix-butter">1:00 PM</span> (uses the event&apos;s start date). A single &quot;time&quot; column like{" "}
              <span className="text-pix-butter">1:00 PM - 2:00 PM</span> also works. Imported rows are added to the list below.
            </p>
            {pasteOpen && (
              <div className="grid gap-2 sm:col-span-2">
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={6}
                  spellCheck={false}
                  placeholder={"title,start,end,speaker\nOpening remarks,1:00 PM,1:15 PM,Jane Doe"}
                  aria-label="CSV text"
                  className={`${inputCls()} resize-y font-mono text-sm`}
                />
                <div>
                  <button type="button" onClick={() => importCsv(pasteText)} disabled={!pasteText.trim()} className={BTN_SECONDARY}>
                    Import pasted rows
                  </button>
                </div>
              </div>
            )}
            {importMsg && (
              <div
                role={importMsg.kind === "error" ? "alert" : "status"}
                className={`border-4 p-3 text-base sm:col-span-2 ${importMsg.kind === "error" ? "border-pix-coral text-pix-coral" : "border-pix-teal"}`}
              >
                <p>{importMsg.text}</p>
                {importMsg.details.length > 0 && (
                  <ul className="mt-1 list-disc pl-5 text-sm">
                    {importMsg.details.map((d) => <li key={d}>{d}</li>)}
                  </ul>
                )}
              </div>
            )}

            {form.schedule.length === 0 && (
              <p className="text-base text-pix-butter/60 sm:col-span-2">No schedule items.</p>
            )}
            {form.schedule.map((r, i) => (
              <div key={r.key} className="grid gap-3 border-4 border-pix-teal/60 p-3 sm:col-span-2 sm:grid-cols-2">
                <div className="flex items-center justify-between sm:col-span-2">
                  <p className={`${hd} text-2xl`}>Item {i + 1}</p>
                  <button type="button" onClick={() => removeRow(r.key)} aria-label={`Remove schedule item ${i + 1}`} className={`border-2 border-pix-butter/60 p-1 transition-colors hover:bg-pix-rust ${focus}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <Field label="Title *" className="sm:col-span-2">
                  <input value={r.title} onChange={(e) => patchRow(r.key, { title: e.target.value })} maxLength={120} className={inputCls()} />
                </Field>
                <Field label="Starts *">
                  <input type="datetime-local" value={r.starts_at} onChange={(e) => patchRow(r.key, { starts_at: e.target.value })} className={inputCls()} />
                </Field>
                <Field label="Ends">
                  <input type="datetime-local" value={r.ends_at} onChange={(e) => patchRow(r.key, { ends_at: e.target.value })} className={inputCls()} />
                </Field>
                <Field label="Speaker" className="sm:col-span-2">
                  <input value={r.speaker} onChange={(e) => patchRow(r.key, { speaker: e.target.value })} maxLength={120} className={inputCls()} />
                </Field>
                <Field label="Description" className="sm:col-span-2">
                  <textarea value={r.description} onChange={(e) => patchRow(r.key, { description: e.target.value })} maxLength={500} rows={2} className={`${inputCls()} resize-y`} />
                </Field>
              </div>
            ))}
            {errors.schedule && <p role="alert" className="text-base text-pix-coral sm:col-span-2">{errors.schedule}</p>}
            <div className="sm:col-span-2">
              <button type="button" onClick={addScheduleRow} disabled={form.schedule.length >= MAX_SCHEDULE} className={BTN_SECONDARY}>
                <Plus size={14} /> Add item
              </button>
            </div>
          </Group>

          {/* ── Status & visibility ── */}
          <Group title="Status & visibility">
            <Field label="Status">
              <select value={form.status} onChange={text("status")} className={inputCls()}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <label className="flex cursor-pointer items-start gap-3 self-end border-4 border-pix-butter/50 p-2.5">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => set("is_published", e.target.checked)}
                className="mt-1 h-4 w-4 accent-[#fff7a1]"
              />
              <span className="text-base">
                Published
                <span className="block text-sm text-pix-butter/60">
                  {form.is_published ? "Visible to everyone." : "Draft: hidden from the public, staff can still preview it."}
                </span>
              </span>
            </label>
          </Group>

          <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
            <div className="flex flex-wrap items-center gap-3">
              {editing && (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  disabled={saving}
                  className={`inline-flex items-center gap-2 border-4 border-pix-rust px-3 py-1 text-base text-pix-butter transition-colors hover:bg-pix-rust disabled:pointer-events-none disabled:opacity-40 ${focus}`}
                >
                  <Trash2 size={14} /> Delete event
                </button>
              )}
              <p className="text-sm text-pix-butter/60">Times above are in {tz}.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={onClose} className={`${BTN_SECONDARY} !px-6 !py-2 !text-base`}>Cancel</button>
              <button type="submit" disabled={saving || uploading} className={`${BTN_SUBMIT} !px-6 !py-2`}>
                {saving && <Loader2 size={16} className="animate-spin" />} {editing ? "Save changes" : "Create event"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {editing && confirmingDelete && (
        <DeleteEventDialog
          event={event!}
          onCancel={() => setConfirmingDelete(false)}
          onDeleted={onClose}
          setToast={setToast}
        />
      )}
    </div>
  );
}
