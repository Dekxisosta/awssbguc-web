"use client";

import { useState } from "react";
import type { RegisterInput, RegisterResponse } from "@/src/shared/types/auth";

type FieldErrors = Partial<Record<keyof RegisterInput | "confirmPassword" | "terms", string>>;

type FormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fields: FieldErrors };

/* ─── Icons ──────────────────────────────────────────────────────────────── */

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

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}

function AlertIcon({ small }: { small?: boolean }) {
  const size = small ? 12 : 15;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
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

/* ─── Shared modal shell ─────────────────────────────────────────────────── */

function ModalShell({
  id,
  title,
  onClose,
  children,
}: {
  id: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={id}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-800 px-6 py-4">
          <h2 id={id} className="text-sm font-semibold text-neutral-100">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300 focus:outline-none"
          >
            <XIcon />
          </button>
        </div>
        <div className="space-y-5 overflow-y-auto px-6 py-5 text-sm leading-relaxed text-neutral-400">
          {children}
        </div>
        <div className="shrink-0 border-t border-neutral-800 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 transition-colors hover:bg-neutral-700 focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-300">
        {number}. {title}
      </h3>
      <p>{children}</p>
    </section>
  );
}

/* ─── Terms of Service Modal ─────────────────────────────────────────────── */

function TermsModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell id="terms-title" title="Terms of Service" onClose={onClose}>
      <Section number="1" title="Acceptance">
        By creating an account on this platform, you agree to be bound by these Terms of Service.
        If you do not agree, do not register.
      </Section>
      <Section number="2" title="Eligibility &amp; Membership">
        Creating an account does not automatically establish or confirm AWS SBG membership.
        Membership eligibility is determined separately and may be verified against current
        university or member records maintained by the organization.
      </Section>
      <Section number="3" title="Account Responsibility">
        You are responsible for maintaining the confidentiality of your credentials and for all
        activity that occurs under your account. Notify us immediately of any unauthorized use.
      </Section>
      <Section number="4" title="Acceptable Use">
        You agree not to misuse this platform, impersonate others, or attempt to gain unauthorized
        access to any part of the system or its data.
      </Section>
      <Section number="5" title="Changes">
        These terms may be updated at any time. Continued use of the platform after changes
        constitutes acceptance of the revised terms.
      </Section>
    </ModalShell>
  );
}

/* ─── Privacy Policy Modal ───────────────────────────────────────────────── */

function PrivacyModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell id="privacy-title" title="Privacy Policy" onClose={onClose}>
      <Section number="1" title="Information We Collect">
        We collect the information you provide during registration — specifically your full name and
        email address — solely to create and manage your account.
      </Section>
      <Section number="2" title="How We Use Your Information">
        Your data is used to authenticate you, facilitate membership verification against university
        or organization records, and communicate essential account-related notices.
      </Section>
      <Section number="3" title="Data Sharing">
        We do not sell or share your personal information with third parties except as strictly
        necessary to operate this service or as required by law.
      </Section>
      <Section number="4" title="Data Retention">
        Your account data is retained for as long as your account remains active. You may request
        deletion of your account and associated data by contacting the organization administrators.
      </Section>
      <Section number="5" title="Security">
        We take reasonable technical measures to protect your data. However, no system is completely
        secure, and we cannot guarantee absolute security.
      </Section>
      <Section number="6" title="Changes">
        This policy may be updated at any time. We encourage you to review it periodically.
        Continued use of the platform constitutes acceptance of any revisions.
      </Section>
    </ModalShell>
  );
}

/* ─── Membership Notice Modal ────────────────────────────────────────────── */

function MembershipNoticeModal({ onConfirm }: { onConfirm: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl">
        <div className="flex justify-center pt-7">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/15 ring-4 ring-amber-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400" aria-hidden="true">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
              <path d="M12 9v4" /><path d="M12 17h.01" />
            </svg>
          </div>
        </div>
        <div className="px-6 pb-2 pt-4 text-center">
          <h2 id="notice-title" className="mb-2 text-base font-semibold text-neutral-100">
            Before you continue
          </h2>
          <p className="text-sm leading-relaxed text-neutral-400">
            Creating an account does not automatically establish or confirm AWS SBG membership.
            Membership eligibility may be verified against the current university&nbsp;/&nbsp;member
            records.
          </p>
        </div>
        <div className="px-6 pb-6 pt-4">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-lg bg-[#161d27] px-4 py-2.5 text-sm font-semibold text-[#00e482] transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00e482] focus-visible:ring-offset-2"
          >
            I understand — create my account
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Register Form ──────────────────────────────────────────────────────── */

interface RegisterFormProps {
  onPasswordFocus?: () => void;
  onPasswordBlur?: () => void;
}

export function RegisterForm({ onPasswordFocus, onPasswordBlur }: RegisterFormProps = {}) {
  const [form, setForm] = useState<RegisterInput>({ email: "", fullName: "", password: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const [state, setState] = useState<FormState>({ status: "idle" });

  const fieldError = (field: keyof RegisterInput | "confirmPassword" | "terms"): string | undefined =>
    state.status === "error" ? state.fields[field] : undefined;

  const isSubmitting = state.status === "submitting";

  const clearFieldError = (field: keyof RegisterInput | "confirmPassword" | "terms") => {
    if (state.status === "error" && state.fields[field]) {
      setState((prev) =>
        prev.status === "error"
          ? { ...prev, fields: { ...prev.fields, [field]: undefined } }
          : prev
      );
    }
  };

  function handleSubmitClick(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errors: FieldErrors = {};
    if (!form.fullName.trim()) errors.fullName = "Full name is required.";
    if (!form.email.trim()) errors.email = "Email address is required.";
    if (!form.password) errors.password = "Password is required.";
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (form.password && form.password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    if (!agreedToTerms) errors.terms = "You must agree to the Terms of Service.";

    if (Object.keys(errors).length > 0) {
      setState({ status: "error", message: "Please fix the errors above.", fields: errors });
      return;
    }
    setState({ status: "idle" });
    setShowNotice(true);
  }

  async function submitRegistration() {
    setShowNotice(false);
    setState({ status: "submitting" });
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data: RegisterResponse = await res.json();
      if (data.success) {
        setState({ status: "success", message: data.message });
        setForm({ email: "", fullName: "", password: "" });
        setConfirmPassword("");
        setAgreedToTerms(false);
      } else {
        setState({
          status: "error",
          message: data.error,
          fields: data.field ? { [data.field]: data.error } : {},
        });
      }
    } catch {
      setState({
        status: "error",
        message: "Something went wrong. Please check your connection and try again.",
        fields: {},
      });
    }
  }

  /* ── Success state ── */
  if (state.status === "success") {
    return (
      <div className="rounded-xl border border-green-800/50 bg-green-950/30 px-6 py-8 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-800/40">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-green-400">Account created</p>
        <p className="mt-1.5 text-sm text-neutral-400">{state.message}</p>
        <a
          href="/login"
          className="mt-4 inline-block rounded-lg bg-[#161d27] px-5 py-2 text-sm font-semibold text-[#00e482] transition-opacity hover:opacity-90"
        >
          Sign in
        </a>
      </div>
    );
  }

  const hasGlobalError =
    state.status === "error" &&
    !state.fields.email &&
    !state.fields.fullName &&
    !state.fields.password &&
    !state.fields.confirmPassword &&
    !state.fields.terms;

  return (
    <>
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
      {showNotice && <MembershipNoticeModal onConfirm={submitRegistration} />}

      <form onSubmit={handleSubmitClick} noValidate className="flex flex-col gap-4">
        {/* Global error banner */}
        {hasGlobalError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <AlertIcon />
            <span>{state.message}</span>
          </div>
        )}

        {/* Full name */}
        <Field
          id="fullName"
          label="Full name"
          required
          error={fieldError("fullName")}
          hint={undefined}
        >
          <input
            id="fullName"
            type="text"
            name="fullName"
            autoComplete="name"
            required
            disabled={isSubmitting}
            value={form.fullName}
            onChange={(e) => { setForm((f) => ({ ...f, fullName: e.target.value })); clearFieldError("fullName"); }}
            aria-describedby={fieldError("fullName") ? "fullName-error" : undefined}
            aria-required="true"
            aria-invalid={!!fieldError("fullName")}
            className={inputClass(!!fieldError("fullName"))}
            placeholder="Jane Doe"
          />
        </Field>

        {/* Email */}
        <Field
          id="email"
          label="Email address"
          required
          error={fieldError("email")}
          hint={undefined}
        >
          <input
            id="email"
            type="email"
            name="email"
            autoComplete="email"
            required
            disabled={isSubmitting}
            value={form.email}
            onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); clearFieldError("email"); }}
            aria-describedby={fieldError("email") ? "email-error" : undefined}
            aria-required="true"
            aria-invalid={!!fieldError("email")}
            className={inputClass(!!fieldError("email"))}
            placeholder="jane@example.com"
          />
        </Field>

        {/* Password */}
        <Field
          id="password"
          label="Password"
          required
          error={fieldError("password")}
          hint={!fieldError("password") ? "Min. 8 characters with uppercase, lowercase, and a number." : undefined}
        >
          <div className="relative">
            <input
              id="password"
              type={showPasswords ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              required
              disabled={isSubmitting}
              value={form.password}
              onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); clearFieldError("password"); }}
              onFocus={onPasswordFocus}
              onBlur={onPasswordBlur}
              aria-describedby={fieldError("password") ? "password-error" : "password-hint"}
              aria-required="true"
              aria-invalid={!!fieldError("password")}
              className={inputClass(!!fieldError("password")) + " pr-10"}
              placeholder="••••••••"
            />
            <EyeToggle open={showPasswords} onToggle={() => setShowPasswords((v) => !v)} />
          </div>
        </Field>

        {/* Confirm password */}
        <Field
          id="confirmPassword"
          label="Confirm password"
          required
          error={fieldError("confirmPassword")}
          hint={undefined}
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
              onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError("confirmPassword"); }}
              onFocus={onPasswordFocus}
              onBlur={onPasswordBlur}
              aria-describedby={fieldError("confirmPassword") ? "confirmPassword-error" : undefined}
              aria-required="true"
              aria-invalid={!!fieldError("confirmPassword")}
              className={inputClass(!!fieldError("confirmPassword")) + " pr-10"}
              placeholder="••••••••"
            />
            <EyeToggle open={showPasswords} onToggle={() => setShowPasswords((v) => !v)} />
          </div>
        </Field>

        {/* Terms */}
        <div className="flex flex-col gap-1 pt-1">
          <div className="flex items-start gap-2.5">
            <input
              id="terms"
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => {
                setAgreedToTerms(e.target.checked);
                if (e.target.checked) clearFieldError("terms");
              }}
              disabled={isSubmitting}
              aria-describedby={fieldError("terms") ? "terms-error" : undefined}
              aria-invalid={!!fieldError("terms")}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-[#00e482] disabled:opacity-50"
            />
            <label
              htmlFor="terms"
              className="cursor-pointer select-none text-xs leading-relaxed text-neutral-600"
            >
              I agree to the{" "}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="font-medium text-neutral-800 underline underline-offset-2 hover:text-[#0f1923] focus:outline-none"
              >
                Terms of Service
              </button>{" "}
              and acknowledge the{" "}
              <button
                type="button"
                onClick={() => setShowPrivacy(true)}
                className="font-medium text-neutral-800 underline underline-offset-2 hover:text-[#0f1923] focus:outline-none"
              >
                Privacy Policy
              </button>
              .
            </label>
          </div>
          {fieldError("terms") && (
            <p id="terms-error" role="alert" className="flex items-center gap-1.5 pl-6 text-xs text-red-600">
              <AlertIcon small />
              {fieldError("terms")}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 flex items-center justify-center rounded-lg bg-[#161d27] px-4 py-2.5 text-sm font-semibold text-[#00e482] transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00e482] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <SpinnerIcon />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>
    </>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-neutral-700">
        {label}
        {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertIcon small />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-neutral-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function EyeToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={open ? "Hide passwords" : "Show passwords"}
      tabIndex={-1}
      className="absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400 transition-colors hover:text-neutral-600 focus:outline-none"
    >
      <EyeIcon open={open} />
    </button>
  );
}

function inputClass(hasError: boolean): string {
  const base =
    "w-full rounded-lg border bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 " +
    "placeholder:text-neutral-600 transition-colors focus:outline-none focus:ring-2 " +
    "disabled:opacity-50";
  return hasError
    ? `${base} border-red-700 focus:ring-red-600/40`
    : `${base} border-neutral-700 focus:ring-[#00e482]/30 focus:border-[#00e482]/40`;
}
