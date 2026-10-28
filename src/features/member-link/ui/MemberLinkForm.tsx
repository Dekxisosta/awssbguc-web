"use client";

import { useState } from "react";
import {
  darkBanner,
  darkErr,
  darkHint,
  darkInput,
  darkLabel,
  darkSubmit,
} from "@/src/shared/ui/pixel-form-dark";

type FormField =
  | "studentNumber"
  | "firstName"
  | "lastName"
  | "yearLevel"
  | "program"
  | "section";

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; memberId: string }
  | { status: "error"; message: string; field?: FormField };

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];

function inputClass(hasError: boolean): string {
  return darkInput(hasError);
}

/** Native <select> popups ignore our colours unless the options are styled too. */
const selectExtra = " [&>option]:bg-black [&>option]:text-pix-butter";

function AlertIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function FieldError({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className={darkErr}>
      <AlertIcon />
      {children}
    </p>
  );
}

export function MemberLinkForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [studentNumber, setStudentNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [program, setProgram] = useState("");
  const [section, setSection] = useState("");

  const [state, setState] = useState<FormState>({ status: "idle" });

  const isSubmitting = state.status === "submitting";

  function fieldError(field: FormField): string | undefined {
    return state.status === "error" && state.field === field ? state.message : undefined;
  }

  const globalError = state.status === "error" && !state.field ? state.message : undefined;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ status: "submitting" });

    try {
      const res = await fetch("/api/member/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentNumber: studentNumber.trim(),
          firstName: firstName.trim(),
          middleName: middleName.trim() || undefined,
          lastName: lastName.trim(),
          yearLevel,
          program: program.trim(),
          section: section.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setState({ status: "success", memberId: data.memberId });
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.reload();
        }
      } else {
        setState({ status: "error", message: data.error, field: data.field });
      }
    } catch {
      setState({
        status: "error",
        message: "Something went wrong. Please check your connection and try again.",
      });
    }
  }

  function clearError() {
    if (state.status === "error") setState({ status: "idle" });
  }

  if (state.status === "success") {
    return (
      <div className="border-4 border-pix-green px-6 py-8 text-center shadow-pixel-green-6">
        <p className="text-2xl text-pix-green">Membership registered</p>
        <p className="mt-2 text-lg">{state.memberId}</p>
        <p className={`mt-2 ${darkHint}`}>Reloading your dashboard…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {globalError && (
        <div role="alert" className={darkBanner}>
          <AlertIcon />
          <span>{globalError}</span>
        </div>
      )}

      {/* Student number */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="studentNumber" className={darkLabel}>
          Student number
        </label>
        <input
          id="studentNumber"
          type="text"
          name="studentNumber"
          autoComplete="off"
          inputMode="numeric"
          required
          disabled={isSubmitting}
          value={studentNumber}
          onChange={(e) => { setStudentNumber(e.target.value); clearError(); }}
          aria-describedby={fieldError("studentNumber") ? "studentNumber-error" : "studentNumber-hint"}
          aria-invalid={!!fieldError("studentNumber")}
          className={inputClass(!!fieldError("studentNumber"))}
          placeholder="e.g. 2403962"
        />
        {fieldError("studentNumber") ? (
          <FieldError id="studentNumber-error">{fieldError("studentNumber")}</FieldError>
        ) : (
          <p id="studentNumber-hint" className={darkHint}>
            Your university student number.
          </p>
        )}
      </div>

      {/* Name */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="firstName" className={darkLabel}>
            First name
          </label>
          <input
            id="firstName"
            type="text"
            name="firstName"
            autoComplete="given-name"
            required
            disabled={isSubmitting}
            value={firstName}
            onChange={(e) => { setFirstName(e.target.value); clearError(); }}
            aria-invalid={!!fieldError("firstName")}
            className={inputClass(!!fieldError("firstName"))}
            placeholder="Juan"
          />
          {fieldError("firstName") && (
            <FieldError>{fieldError("firstName")}</FieldError>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="middleName" className={darkLabel}>
            Middle name <span className="text-pix-butter/60">(optional)</span>
          </label>
          <input
            id="middleName"
            type="text"
            name="middleName"
            autoComplete="additional-name"
            disabled={isSubmitting}
            value={middleName}
            onChange={(e) => { setMiddleName(e.target.value); clearError(); }}
            className={inputClass(false)}
            placeholder="Santos"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="lastName" className={darkLabel}>
            Last name
          </label>
          <input
            id="lastName"
            type="text"
            name="lastName"
            autoComplete="family-name"
            required
            disabled={isSubmitting}
            value={lastName}
            onChange={(e) => { setLastName(e.target.value); clearError(); }}
            aria-invalid={!!fieldError("lastName")}
            className={inputClass(!!fieldError("lastName"))}
            placeholder="Dela Cruz"
          />
          {fieldError("lastName") && (
            <FieldError>{fieldError("lastName")}</FieldError>
          )}
        </div>
      </div>

      {/* Academic details */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="yearLevel" className={darkLabel}>
            Year level
          </label>
          <select
            id="yearLevel"
            name="yearLevel"
            required
            disabled={isSubmitting}
            value={yearLevel}
            onChange={(e) => { setYearLevel(e.target.value); clearError(); }}
            aria-invalid={!!fieldError("yearLevel")}
            className={inputClass(!!fieldError("yearLevel")) + selectExtra}
          >
            <option value="" disabled>Select year level</option>
            {YEAR_LEVELS.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          {fieldError("yearLevel") && (
            <FieldError>{fieldError("yearLevel")}</FieldError>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="program" className={darkLabel}>
            Program
          </label>
          <input
            id="program"
            type="text"
            name="program"
            required
            disabled={isSubmitting}
            value={program}
            onChange={(e) => { setProgram(e.target.value); clearError(); }}
            aria-invalid={!!fieldError("program")}
            className={inputClass(!!fieldError("program"))}
            placeholder="CCS - BS Computer Science"
          />
          {fieldError("program") && (
            <FieldError>{fieldError("program")}</FieldError>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="section" className={darkLabel}>
            Section
          </label>
          <input
            id="section"
            type="text"
            name="section"
            required
            disabled={isSubmitting}
            value={section}
            onChange={(e) => { setSection(e.target.value); clearError(); }}
            aria-invalid={!!fieldError("section")}
            className={inputClass(!!fieldError("section"))}
            placeholder="A"
          />
          {fieldError("section") && (
            <FieldError>{fieldError("section")}</FieldError>
          )}
        </div>
      </div>

      <p className={darkHint}>
        This information is self-reported and used to generate your SBG membership record.
      </p>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`${darkSubmit} mt-1`}
      >
        {isSubmitting ? "Registering…" : "Register membership"}
      </button>
    </form>
  );
}
