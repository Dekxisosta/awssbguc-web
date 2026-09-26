"use client";

import { useState } from "react";
import type { SetupResponse } from "@/src/shared/types/auth";

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success" }
  | { status: "error"; message: string; field?: "password" | "confirmPassword" };

export function SetupForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState<FormState>({ status: "idle" });

  const isSubmitting = state.status === "submitting";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setState({
        status: "error",
        message: "Passwords do not match.",
        field: "confirmPassword",
      });
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
        setState({
          status: "error",
          message: data.error,
          field: data.field,
        });
      }
    } catch {
      setState({
        status: "error",
        message: "Something went wrong. Please try again.",
      });
    }
  }

  if (state.status === "success") {
    return (
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-6 py-8 text-center">
        <p className="text-sm font-medium text-green-400">Password set</p>
        <p className="mt-2 text-sm text-neutral-400">Redirecting to your dashboard…</p>
      </div>
    );
  }

  const passwordError =
    state.status === "error" && state.field === "password" ? state.message : undefined;
  const confirmError =
    state.status === "error" && state.field === "confirmPassword" ? state.message : undefined;
  const globalError =
    state.status === "error" && !state.field ? state.message : undefined;

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

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-neutral-300">
          New password
        </label>
        <input
          id="password"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          disabled={isSubmitting}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-describedby={passwordError ? "password-error" : "password-hint"}
          aria-invalid={!!passwordError}
          className={inputClass(!!passwordError)}
          placeholder="••••••••"
        />
        {passwordError ? (
          <p id="password-error" role="alert" className="text-xs text-red-400">
            {passwordError}
          </p>
        ) : (
          <p id="password-hint" className="text-xs text-neutral-500">
            Min. 8 characters with uppercase, lowercase, and a number.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-neutral-300">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          disabled={isSubmitting}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          aria-describedby={confirmError ? "confirmPassword-error" : undefined}
          aria-invalid={!!confirmError}
          className={inputClass(!!confirmError)}
          placeholder="••••••••"
        />
        {confirmError && (
          <p id="confirmPassword-error" role="alert" className="text-xs text-red-400">
            {confirmError}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 rounded-md bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? "Setting password…" : "Set password"}
      </button>
    </form>
  );
}

function inputClass(hasError: boolean): string {
  const base =
    "w-full rounded-md border bg-neutral-900 px-3 py-2 text-sm text-neutral-100 " +
    "placeholder:text-neutral-600 focus:outline-none focus:ring-2 disabled:opacity-50 transition-colors";
  return hasError
    ? `${base} border-red-700 focus:ring-red-600`
    : `${base} border-neutral-700 focus:ring-neutral-500`;
}
