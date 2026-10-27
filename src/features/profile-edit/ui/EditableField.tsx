"use client";

import { useState, useRef, useEffect } from "react";
import { PencilIcon, btnSmGhost, btnSmSolid, focus } from "./pixel";

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
  /** Small tag shown next to the label (e.g. "one-time"). */
  badge?: React.ReactNode;
}

/**
 * Click the pencil to edit in place; Enter saves, Escape cancels.
 * Renders a <div> holding a <dt>/<dd> pair, so it belongs inside a <dl>.
 */
export function EditableField({
  label,
  value,
  id,
  onSave,
  hint,
  readOnly = false,
  inputType = "text",
  placeholder,
  badge,
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

  // After a failed save, put focus back in the field. Done in an effect because the input is
  // still `disabled` while saving, so focusing it synchronously would silently do nothing.
  useEffect(() => {
    if (saveState === "error") inputRef.current?.focus();
  }, [saveState]);

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
      // Cancel just this edit; without this the surrounding modal would close too.
      e.preventDefault();
      e.stopPropagation();
      cancelEditing();
    }
  }

  const isSaving = saveState === "saving";
  const inputErrorId = `${id}-error`;
  const inputHintId = `${id}-hint`;

  return (
    <div>
      <dt className="flex flex-wrap items-center gap-2 text-sm uppercase tracking-wide text-pix-butter/70">
        {label}
        {badge}
        {!readOnly && !editing && (
          <button
            type="button"
            onClick={startEditing}
            aria-label={`Edit ${label}`}
            className={`border-2 border-pix-butter/40 p-1 text-pix-butter/80 transition-colors hover:bg-pix-butter hover:text-black ${focus}`}
          >
            <PencilIcon size={13} />
          </button>
        )}
        {saveState === "saved" && (
          <span role="status" className="text-sm normal-case tracking-normal text-pix-green">
            Saved
          </span>
        )}
      </dt>

      {editing ? (
        <dd className="mt-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
              aria-label={label}
              aria-invalid={saveState === "error"}
              aria-describedby={saveState === "error" ? inputErrorId : hint ? inputHintId : undefined}
              className={[
                "w-full min-w-0 border-4 bg-black px-3 py-1.5 text-lg text-pix-butter sm:flex-1",
                "placeholder:text-pix-butter/40 disabled:opacity-50",
                focus,
                saveState === "error" ? "border-pix-coral" : "border-pix-teal",
              ].join(" ")}
            />
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={commitEdit} disabled={isSaving} aria-label="Save" className={btnSmSolid}>
                {isSaving ? "Saving…" : "Save"}
              </button>
              <button type="button" onClick={cancelEditing} disabled={isSaving} aria-label="Cancel edit" className={btnSmGhost}>
                Cancel
              </button>
            </div>
          </div>

          {saveState === "error" && errorMessage && (
            <p id={inputErrorId} role="alert" className="mt-2 text-sm text-pix-coral">
              {errorMessage}
            </p>
          )}
          {saveState !== "error" && hint && (
            <p id={inputHintId} className="mt-2 text-sm text-pix-butter/60">
              {hint}
            </p>
          )}
        </dd>
      ) : (
        <dd className={`mt-1 break-words text-lg ${value ? "text-pix-butter" : "text-pix-butter/50"}`}>{value || "—"}</dd>
      )}
    </div>
  );
}
