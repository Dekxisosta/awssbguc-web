"use client";

import { useState } from "react";

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
  const base =
    "w-full rounded-md border bg-neutral-900 px-3 py-2 text-sm text-neutral-100 " +
    "placeholder:text-neutral-600 focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors";
  return hasError
    ? `${base} border-red-700 focus:ring-red-600`
    : `${base} border-neutral-700 focus:ring-neutral-500`;
}

export function MemberLinkForm() {
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
        window.location.reload();
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
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-6 py-8 text-center">
        <p className="text-sm font-medium text-green-400">Membership registered</p>
        <p className="mt-2 font-mono text-sm text-neutral-300">{state.memberId}</p>
        <p className="mt-2 text-xs text-neutral-500">Reloading your dashboard…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {globalError && (
        <div
          role="alert"
          className="rounded-md border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400"
        >
          {globalError}
        </div>
      )}

      {/* Student number */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="studentNumber" className="text-sm font-medium text-neutral-300">
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
          <p id="studentNumber-error" role="alert" className="text-xs text-red-400">
            {fieldError("studentNumber")}
          </p>
        ) : (
          <p id="studentNumber-hint" className="text-xs text-neutral-500">
            Your university student number.
          </p>
        )}
      </div>

      {/* Name */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="firstName" className="text-sm font-medium text-neutral-300">
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
            <p role="alert" className="text-xs text-red-400">{fieldError("firstName")}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="middleName" className="text-sm font-medium text-neutral-300">
            Middle name <span className="font-normal text-neutral-500">(optional)</span>
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
          <label htmlFor="lastName" className="text-sm font-medium text-neutral-300">
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
            <p role="alert" className="text-xs text-red-400">{fieldError("lastName")}</p>
          )}
        </div>
      </div>

      {/* Academic details */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="yearLevel" className="text-sm font-medium text-neutral-300">
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
            className={inputClass(!!fieldError("yearLevel"))}
          >
            <option value="" disabled>Select year level</option>
            {YEAR_LEVELS.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          {fieldError("yearLevel") && (
            <p role="alert" className="text-xs text-red-400">{fieldError("yearLevel")}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="program" className="text-sm font-medium text-neutral-300">
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
            <p role="alert" className="text-xs text-red-400">{fieldError("program")}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="section" className="text-sm font-medium text-neutral-300">
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
            <p role="alert" className="text-xs text-red-400">{fieldError("section")}</p>
          )}
        </div>
      </div>

      <p className="text-xs text-neutral-500">
        This information is self-reported and used to generate your SBG membership record.
      </p>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 rounded-md bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? "Registering…" : "Register membership"}
      </button>
    </form>
  );
}
