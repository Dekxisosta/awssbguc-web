"use client";

import { useState } from "react";
import type { SetupResponse } from "@/src/shared/types/auth";
import { AlertIcon, EyeToggle, Field, SpinnerIcon } from "./RegisterForm";
import { bannerCls, inputClass, submitCls } from "./pixel-form";

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; message: string; field?: "password" | "confirmPassword" };

/** Mirrors validatePassword() on the server, which stays the source of truth. */
const RULES = [
  { id: "len", label: "8–72 characters", test: (p: string) => p.length >= 8 && p.length <= 72, error: "Password must be 8–72 characters." },
  { id: "upper", label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p), error: "Password must contain at least one uppercase letter." },
  { id: "lower", label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p), error: "Password must contain at least one lowercase letter." },
  { id: "num", label: "One number", test: (p: string) => /[0-9]/.test(p), error: "Password must contain at least one number." },
] as const;

export function SetupForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [state, setState] = useState<FormState>({ status: "idle" });

  const isSubmitting = state.status === "submitting";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!password) {
      setState({ status: "error", message: "Please enter a new password.", field: "password" });
      return;
    }
    const failed = RULES.find((r) => !r.test(password));
    if (failed) {
      setState({ status: "error", message: failed.error, field: "password" });
      return;
    }
    if (password !== confirmPassword) {
      setState({ status: "error", message: "Passwords do not match.", field: "confirmPassword" });
      return;
    }

    setState({ status: "submitting" });

    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      });

      const data: SetupResponse = await res.json();

      if (data.success) {
        setState({ status: "success" });
        window.location.href = "/";
      } else {
        setState({ status: "error", message: data.error, field: data.field });
      }
    } catch {
      setState({ status: "error", message: "Something went wrong. Please try again." });
    }
  }

  /* ── Success state ── */
  if (state.status === "success") {
    return (
      <div className="border-4 border-black bg-pix-green px-6 py-8 text-center text-black shadow-pixel-ink-6">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center border-4 border-black bg-pix-butter">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-black" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <p className="text-2xl">Password set</p>
        <p className="mt-2 text-base">Redirecting to your dashboard…</p>
      </div>
    );
  }

  const passwordError = state.status === "error" && state.field === "password" ? state.message : undefined;
  const confirmError = state.status === "error" && state.field === "confirmPassword" ? state.message : undefined;
  const globalError = state.status === "error" && !state.field ? state.message : undefined;

  const clearError = (field: "password" | "confirmPassword") => {
    if (state.status === "error" && state.field === field) setState({ status: "idle" });
  };

  const matches = confirmPassword.length > 0 && confirmPassword === password;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {globalError && (
        <div role="alert" className={bannerCls}>
          <AlertIcon />
          <span>{globalError}</span>
        </div>
      )}

      <Field id="password" label="New password" required error={passwordError}>
        <div className="relative">
          <input
            id="password"
            type={showPasswords ? "text" : "password"}
            name="password"
            autoComplete="new-password"
            required
            disabled={isSubmitting}
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
            aria-describedby={passwordError ? "password-error" : "password-rules"}
            aria-required="true"
            aria-invalid={!!passwordError}
            className={inputClass(!!passwordError) + " pr-10"}
            placeholder="••••••••"
          />
          <EyeToggle open={showPasswords} onToggle={() => setShowPasswords((v) => !v)} />
        </div>
      </Field>

      {/* Live requirements: each square fills in as the rule is met. */}
      <ul id="password-rules" aria-label="Password requirements" className="-mt-2 grid gap-x-4 gap-y-1.5 border-4 border-black p-3 sm:grid-cols-2">
        {RULES.map((rule) => {
          const met = rule.test(password);
          return (
            <li key={rule.id} className="flex items-center gap-2 text-sm text-black">
              <span
                aria-hidden="true"
                className={`flex h-4 w-4 shrink-0 items-center justify-center border-2 border-black ${met ? "bg-pix-green" : "bg-transparent"}`}
              >
                {met && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="square" strokeLinejoin="miter">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </span>
              <span className={met ? "" : "text-black/70"}>{rule.label}</span>
              <span className="sr-only">{met ? "(met)" : "(not met)"}</span>
            </li>
          );
        })}
      </ul>

      <Field
        id="confirmPassword"
        label="Confirm password"
        required
        error={confirmError}
        hint={matches ? "Passwords match." : undefined}
      >
        <div className="relative">
          <input
            id="confirmPassword"
            type={showPasswords ? "text" : "password"}
            name="confirmPassword"
            autoComplete="new-password"
            required
            disabled={isSubmitting}
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); clearError("confirmPassword"); }}
            aria-describedby={confirmError ? "confirmPassword-error" : matches ? "confirmPassword-hint" : undefined}
            aria-required="true"
            aria-invalid={!!confirmError}
            className={inputClass(!!confirmError) + " pr-10"}
            placeholder="••••••••"
          />
        </div>
      </Field>

      <button type="submit" disabled={isSubmitting} className={submitCls}>
        {isSubmitting ? (
          <>
            <SpinnerIcon />
            Setting password…
          </>
        ) : (
          "Set password"
        )}
      </button>
    </form>
  );
}
