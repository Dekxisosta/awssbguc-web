"use client";

import { useMemo, useState } from "react";
import {
  EDITABLE_FIELDS,
  FIELD_LABELS,
  REASON_MAX,
  YEAR_LEVELS,
  diffStudentValues,
  validateReason,
  type EditableField,
  type StudentValues,
} from "@/src/entities/student-data";
import { darkBanner, darkErr, darkHint, darkInput, darkLabel, darkOutline, darkSubmit } from "@/src/shared/ui/pixel-form-dark";

/** Native <select> popups ignore our colours unless the options are styled too. */
const selectExtra = " [&>option]:bg-black [&>option]:text-pix-butter";

const PLACEHOLDERS: Partial<Record<EditableField, string>> = {
  first_name: "Juan",
  middle_name: "Santos",
  last_name: "Dela Cruz",
  program: "CCS - BS Computer Science",
  section: "A",
};

type FormError = { message: string; field?: EditableField | "reason" } | null;

interface Props {
  current: StudentValues;
  onDone: () => void;
  onCancel: () => void;
}

export function ChangeRequestForm({ current, onDone, onCancel }: Props) {
  const [values, setValues] = useState<Record<EditableField, string>>(() => {
    const init = {} as Record<EditableField, string>;
    for (const f of EDITABLE_FIELDS) init[f] = current[f] ?? "";
    return init;
  });
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<FormError>(null);

  // Live preview of what would actually be sent. The server re-validates everything.
  const diff = useMemo(() => diffStudentValues(current, values), [current, values]);
  const changedCount = diff.ok ? Object.keys(diff.changes).length : 0;
  const reasonCheck = validateReason(reason);
  const canSubmit = diff.ok && reasonCheck.ok && !submitting;

  const fieldError = (f: EditableField | "reason") =>
    error?.field === f ? error.message : undefined;
  const globalError = error && !error.field ? error.message : undefined;

  function set(field: EditableField, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    if (error) setError(null);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!diff.ok) { setError({ message: diff.error, field: diff.field }); return; }
    if (!reasonCheck.ok) { setError({ message: reasonCheck.error, field: "reason" }); return; }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/member/change-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changes: diff.changes, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        onDone();
        return;
      }
      setError({ message: data.error ?? "Something went wrong. Please try again.", field: data.field });
    } catch {
      setError({ message: "Something went wrong. Please check your connection and try again." });
    } finally {
      setSubmitting(false);
    }
  }

  function textField(field: EditableField, opts: { optional?: boolean } = {}) {
    const err = fieldError(field);
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`cr-${field}`} className={darkLabel}>
          {FIELD_LABELS[field]}
          {opts.optional && <span className="text-pix-butter/60"> (optional)</span>}
        </label>
        <input
          id={`cr-${field}`}
          type="text"
          value={values[field]}
          disabled={submitting}
          onChange={(e) => set(field, e.target.value)}
          aria-invalid={!!err}
          aria-describedby={err ? `cr-${field}-err` : undefined}
          className={darkInput(!!err)}
          placeholder={PLACEHOLDERS[field]}
        />
        {err && <p id={`cr-${field}-err`} role="alert" className={darkErr}>{err}</p>}
      </div>
    );
  }

  // A legacy year level that isn't in today's list must still show as the selected option.
  const yearOptions: string[] = [...YEAR_LEVELS];
  if (current.year_level && !yearOptions.includes(current.year_level)) yearOptions.unshift(current.year_level);

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <p className={darkHint}>
        Edit whatever is wrong, tell us why, and an officer will review it. Your record only changes once the request is approved.
      </p>

      {globalError && (
        <div role="alert" className={darkBanner}>
          <span>{globalError}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {textField("first_name")}
        {textField("middle_name", { optional: true })}
        {textField("last_name")}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cr-year_level" className={darkLabel}>{FIELD_LABELS.year_level}</label>
          <select
            id="cr-year_level"
            value={values.year_level}
            disabled={submitting}
            onChange={(e) => set("year_level", e.target.value)}
            aria-invalid={!!fieldError("year_level")}
            className={darkInput(!!fieldError("year_level")) + selectExtra}
          >
            {!values.year_level && <option value="" disabled>Select year level</option>}
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          {fieldError("year_level") && <p role="alert" className={darkErr}>{fieldError("year_level")}</p>}
        </div>
        {textField("program")}
        {textField("section")}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="cr-reason" className={darkLabel}>Why does this need to change?</label>
        <textarea
          id="cr-reason"
          rows={3}
          value={reason}
          maxLength={REASON_MAX}
          disabled={submitting}
          onChange={(e) => { setReason(e.target.value); if (error) setError(null); }}
          aria-invalid={!!fieldError("reason")}
          aria-describedby="cr-reason-hint"
          className={darkInput(!!fieldError("reason"))}
          placeholder="e.g. I was promoted to 3rd year this semester / my surname was misspelled when I registered."
        />
        {fieldError("reason")
          ? <p role="alert" className={darkErr}>{fieldError("reason")}</p>
          : <p id="cr-reason-hint" className={darkHint}>{reason.length}/{REASON_MAX}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={!canSubmit} className={darkSubmit}>
          {submitting ? "Sending…" : changedCount > 0 ? `Send request (${changedCount} change${changedCount > 1 ? "s" : ""})` : "Send request"}
        </button>
        <button type="button" onClick={onCancel} disabled={submitting} className={darkOutline}>
          Cancel
        </button>
      </div>
    </form>
  );
}
