/**
 * Pure helpers shared by the browser form (live diff preview) and the API
 * (authoritative validation). No server-only imports.
 */

import {
  EDITABLE_FIELDS,
  type EditableField,
  type StudentValues,
} from "./types";

export const FIELD_LABELS: Record<EditableField, string> = {
  first_name: "First name",
  middle_name: "Middle name",
  last_name: "Last name",
  year_level: "Year level",
  program: "Program",
  section: "Section",
};

export const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"] as const;

const MAX_LENGTH: Record<EditableField, number> = {
  first_name: 60,
  middle_name: 60,
  last_name: 60,
  year_level: 20,
  program: 120,
  section: 20,
};

const OPTIONAL: ReadonlySet<EditableField> = new Set(["middle_name"]);

export const REASON_MIN = 10;
export const REASON_MAX = 500;

/** Trim, drop control characters, collapse runs of whitespace. "" and non-strings become "". */
export function normalize(value: unknown): string {
  if (typeof value !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}

export type DiffResult =
  | { ok: true; changes: Partial<StudentValues> }
  | { ok: false; error: string; field?: EditableField };

/**
 * Compare the submitted values against the current record.
 * Fields that are missing from `input`, or equal to the current value, are
 * treated as unchanged. Only changed fields are validated, so a legacy value
 * that would not pass today's rules never blocks an unrelated edit.
 */
export function diffStudentValues(
  current: StudentValues,
  input: Record<string, unknown>
): DiffResult {
  const changes: Partial<StudentValues> = {};

  for (const key of Object.keys(input)) {
    if (!(EDITABLE_FIELDS as readonly string[]).includes(key)) {
      return { ok: false, error: `"${key}" can't be changed.` };
    }
  }

  for (const field of EDITABLE_FIELDS) {
    if (!(field in input)) continue;

    if (input[field] !== null && input[field] !== undefined && typeof input[field] !== "string") {
      return { ok: false, error: `${FIELD_LABELS[field]} must be text.`, field };
    }

    const next = normalize(input[field]);
    const prev = normalize(current[field]);
    if (next === prev) continue;

    if (next === "" && !OPTIONAL.has(field)) {
      return { ok: false, error: `${FIELD_LABELS[field]} can't be empty.`, field };
    }
    if (next.length > MAX_LENGTH[field]) {
      return {
        ok: false,
        error: `${FIELD_LABELS[field]} must be ${MAX_LENGTH[field]} characters or fewer.`,
        field,
      };
    }
    if (field === "year_level" && !(YEAR_LEVELS as readonly string[]).includes(next)) {
      return { ok: false, error: "Choose a year level from the list.", field };
    }

    changes[field] = next; // "" for a cleared optional field; the DB stores NULL
  }

  if (Object.keys(changes).length === 0) {
    return { ok: false, error: "You haven't changed anything yet." };
  }
  return { ok: true, changes };
}

export type ReasonResult = { ok: true; reason: string } | { ok: false; error: string };

export function validateReason(value: unknown): ReasonResult {
  const reason = normalize(value);
  if (reason.length < REASON_MIN) {
    return { ok: false, error: `Tell us why you're requesting this change (at least ${REASON_MIN} characters).` };
  }
  if (reason.length > REASON_MAX) {
    return { ok: false, error: `Keep the reason under ${REASON_MAX} characters.` };
  }
  return { ok: true, reason };
}

/** "Juan Santos Dela Cruz" from whichever name parts exist. */
export function fullName(v: Partial<StudentValues> | null | undefined): string {
  if (!v) return "";
  return [v.first_name, v.middle_name, v.last_name].filter(Boolean).join(" ").trim();
}
