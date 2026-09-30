"use client";

import { useState } from "react";
import { createClient } from "@/src/shared/supabase/client";

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string; field?: "email" | "password" };

interface LoginFormProps {
  onPasswordFocus?: () => void;
  onPasswordBlur?: () => void;
  /** Path to redirect to after successful login. Defaults to "/" */
  redirectTo?: string;
}

export function LoginForm({ onPasswordFocus, onPasswordBlur, redirectTo = "/" }: LoginFormProps = {}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [state, setState] = useState<FormState>({ status: "idle" });

  const isSubmitting = state.status === "submitting";
  const fieldError = (f: "email" | "password") =>
    state.status === "error" && state.field === f ? state.message : undefined;
  const globalError =
    state.status === "error" && !state.field ? state.message : undefined;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setState({ status: "error", message: "Please enter your email address.", field: "email" });
      return;
    }
    if (!password) {
      setState({ status: "error", message: "Please enter your password.", field: "password" });
      return;
    }

    setState({ status: "submitting" });

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error) {
      const isInvalid =
        error.message.toLowerCase().includes("invalid login") ||
        error.message.toLowerCase().includes("invalid credentials");
      setState({
        status: "error",
        message: isInvalid ? "Incorrect email or password." : error.message,
      });
      return;
    }

    window.location.href = redirectTo;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Global error banner */}
      {globalError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-400"
        >
          <AlertIcon />
          <span>{globalError}</span>
        </div>
      )}

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="text-sm font-medium text-neutral-300"
        >
          Email address
        </label>
        <input
          id="email"
          type="email"
          name="email"
          autoComplete="email"
          required
          disabled={isSubmitting}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state.status === "error" && state.field === "email")
              setState({ status: "idle" });
          }}
          aria-invalid={!!fieldError("email")}
          aria-describedby={fieldError("email") ? "email-error" : undefined}
          placeholder="you@example.com"
          className={inputClass(!!fieldError("email"))}
        />
        {fieldError("email") && (
          <p id="email-error" role="alert" className="flex items-center gap-1.5 text-xs text-red-400">
            <AlertIcon small />
            {fieldError("email")}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-sm font-medium text-neutral-300"
          >
            Password
          </label>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            required
            disabled={isSubmitting}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (state.status === "error" && state.field === "password")
                setState({ status: "idle" });
            }}
            onFocus={onPasswordFocus}
            onBlur={onPasswordBlur}
            aria-invalid={!!fieldError("password")}
            aria-describedby={fieldError("password") ? "password-error" : undefined}
            placeholder="••••••••"
            className={inputClass(!!fieldError("password")) + " pr-10"}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500 transition-colors hover:text-neutral-300 focus:outline-none"
          >
            <EyeIcon open={showPassword} />
          </button>
        </div>
        {fieldError("password") && (
          <p id="password-error" role="alert" className="flex items-center gap-1.5 text-xs text-red-400">
            <AlertIcon small />
            {fieldError("password")}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="relative mt-1 flex items-center justify-center rounded-lg bg-[#161d27] px-4 py-2.5 text-sm font-semibold text-[#00e482] transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00e482] focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <SpinnerIcon />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function inputClass(hasError: boolean): string {
  const base =
    "w-full rounded-lg border bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 " +
    "placeholder:text-neutral-600 transition-colors focus:outline-none focus:ring-2 " +
    "disabled:opacity-50";
  return hasError
    ? `${base} border-red-700 focus:ring-red-600/40`
    : `${base} border-neutral-700 focus:ring-[#00e482]/30 focus:border-[#00e482]/40`;
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

function AlertIcon({ small }: { small?: boolean }) {
  const size = small ? 12 : 15;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
