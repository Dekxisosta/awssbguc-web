"use client";

import { useState, useRef, useEffect } from "react";

type SaveState = "idle" | "saving" | "saved" | "error";

interface EditableFieldProps {
  label: string;
  value: string | null | undefined;
  id: string;
  onSave: (newValue: string) => Promise<string | null>;
  hint?: string;
  readOnly?: boolean;
  inputType?: string;
  placeholder?: string;
}

export function EditableField({
  label,
  value,
  id,
  onSave,
  hint,
  readOnly = false,
  inputType = "text",
  placeholder,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function startEditing() {
    setDraft(value ?? "");
    setErrorMessage(null);
    setSaveState("idle");
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setErrorMessage(null);
    setSaveState("idle");
  }

  async function commitEdit() {
    const trimmed = draft.trim();
    if (trimmed === (value ?? "").trim()) {
      cancelEditing();
      return;
    }

    setSaveState("saving");
    setErrorMessage(null);

    const error = await onSave(trimmed);

    if (error) {
      setSaveState("error");
      setErrorMessage(error);
      inputRef.current?.focus();
    } else {
      setSaveState("saved");
      setEditing(false);
      setTimeout(() => setSaveState("idle"), 2000);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  }

  const isSaving = saveState === "saving";
  const inputErrorId = `${id}-error`;
  const inputHintId = `${id}-hint`;

  return (
    <div>
      <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
        {!readOnly && !editing && (
          <button
            type="button"
            onClick={startEditing}
            aria-label={`Edit ${label}`}
            className="rounded p-0.5 text-neutral-600 transition-colors hover:text-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500"
          >
            <PencilIcon />
          </button>
        )}
        {saveState === "saved" && (
          <span className="text-xs font-normal normal-case tracking-normal text-green-400">
            Saved
          </span>
        )}
      </dt>

      {editing ? (
        <dd className="mt-1">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              id={id}
              type={inputType}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (saveState === "error") {
                  setSaveState("idle");
                  setErrorMessage(null);
                }
              }}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              placeholder={placeholder}
              aria-invalid={saveState === "error"}
              aria-describedby={
                saveState === "error"
                  ? inputErrorId
                  : hint
                  ? inputHintId
                  : undefined
              }
              className={[
                "w-full rounded-md border px-3 py-1.5 text-sm",
                "bg-neutral-900 text-neutral-100 placeholder:text-neutral-600",
                "focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors",
                saveState === "error"
                  ? "border-red-700 focus:ring-red-600"
                  : "border-neutral-700 focus:ring-neutral-500",
              ].join(" ")}
            />
            <button
              type="button"
              onClick={commitEdit}
              disabled={isSaving}
              aria-label="Save"
              className="shrink-0 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              disabled={isSaving}
              aria-label="Cancel edit"
              className="shrink-0 rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:border-neutral-500 hover:text-neutral-200 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>

          {saveState === "error" && errorMessage && (
            <p id={inputErrorId} role="alert" className="mt-1.5 text-xs text-red-400">
              {errorMessage}
            </p>
          )}
          {saveState !== "error" && hint && (
            <p id={inputHintId} className="mt-1.5 text-xs text-neutral-500">
              {hint}
            </p>
          )}
        </dd>
      ) : (
        <dd className="mt-1 text-sm text-neutral-100">{value ?? "—"}</dd>
      )}
    </div>
  );
}

function PencilIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </svg>
  );
}
