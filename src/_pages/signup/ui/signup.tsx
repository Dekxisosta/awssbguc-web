"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { RegisterForm } from "@/src/features/auth";

export const signupMetadata = {
  title: "Sign up — AWSSBG-UC",
};

type Step = "account" | "profile" | "membership";

export function SignupPage() {
  const [step, setStep] = useState<Step>("account");

  const headings: Record<Step, { title: string; sub: string }> = {
    account: {
      title: "Create your account",
      sub: "Start here — takes less than a minute.",
    },
    profile: {
      title: "Set up your profile",
      sub: "Sign in first, then personalise your profile.",
    },
    membership: {
      title: "Register your membership",
      sub: "Optional — you can always do this later.",
    },
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-900 px-4 py-16">
      <div className="w-full max-w-sm">

        {/* Logo + heading */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image
            src="/icons/logo.webp"
            alt="AWSSBG-UC logo"
            width={44}
            height={44}
            className="rounded-md object-contain"
          />
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-neutral-100">
              {headings[step].title}
            </h1>
            <p className="mt-1 text-sm text-neutral-500">{headings[step].sub}</p>
          </div>
        </div>

        {/* Step indicator — 3 steps */}
        <div className="mb-6 flex items-center gap-2">
          <StepDot n={1} active={step === "account"}    done={step === "profile" || step === "membership"} label="Account" />
          <div className="h-px flex-1 bg-neutral-800" />
          <StepDot n={2} active={step === "profile"}    done={step === "membership"} label="Profile" />
          <div className="h-px flex-1 bg-neutral-800" />
          <StepDot n={3} active={step === "membership"} done={false} label="Membership" />
        </div>

        {step === "account" && (
          <>
            <RegisterForm onSuccess={() => setStep("profile")} />
            <p className="mt-6 text-center text-xs text-neutral-600">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-neutral-400 underline-offset-2 hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}

        {step === "profile" && <ProfileStep onContinue={() => setStep("membership")} />}

        {step === "membership" && <MembershipStep />}

      </div>
    </div>
  );
}

/* ── Step dot ───────────────────────────────────────────────────────────── */

function StepDot({ n, active, done, label }: { n: number; active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={[
          "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
          done
            ? "bg-[#00e482] text-[#161d27]"
            : active
            ? "border-2 border-[#00e482] text-[#00e482]"
            : "border border-neutral-700 text-neutral-600",
        ].join(" ")}
      >
        {done ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : n}
      </div>
      <span className={`text-[10px] font-medium ${active ? "text-neutral-300" : done ? "text-[#00e482]" : "text-neutral-600"}`}>
        {label}
      </span>
    </div>
  );
}

/* ── Step 2: Profile interstitial (requires sign-in first) ─────────────── */

function ProfileStep({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Account confirmed */}
      <div className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00e482]/10">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#00e482]" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-100">Account created</p>
          <p className="text-xs text-neutral-500">Check your email to verify your address.</p>
        </div>
      </div>

      {/* What profile setup includes */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
          Profile setup lets you
        </p>
        <ul className="flex flex-col gap-2">
          {[
            { label: "Choose your username", note: "One-time — choose carefully" },
            { label: "Upload a profile photo", note: "Shown on your public card" },
            { label: "Write a short bio", note: "Up to 280 characters" },
            { label: "Add your skills", note: "Comma-separated tags" },
          ].map(({ label, note }) => (
            <li key={label} className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00e482]" aria-hidden="true" />
              <div>
                <span className="text-sm text-neutral-300">{label}</span>
                <span className="ml-2 text-xs text-neutral-600">{note}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-2.5">
        {/* Sign in → goes to /profile-setup after auth */}
        <Link
          href="/login?redirect=%2Fprofile-setup"
          className="flex items-center justify-center gap-2 rounded-lg bg-[#161d27] px-4 py-3 text-sm font-semibold text-[#00e482] transition-opacity hover:opacity-90"
        >
          Sign in and set up profile
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Link>
        <button
          type="button"
          onClick={onContinue}
          className="flex items-center justify-center rounded-lg border border-neutral-800 px-4 py-3 text-sm font-medium text-neutral-500 transition-colors hover:border-neutral-700 hover:text-neutral-300"
        >
          Skip — go to membership
        </button>
      </div>

      <p className="text-center text-xs text-neutral-700">
        You can set up your profile anytime from your account settings.
      </p>
    </div>
  );
}

/* ── Step 3: Membership interstitial ───────────────────────────────────── */

function MembershipStep() {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-500">
          SBG Membership includes
        </p>
        <ul className="flex flex-col gap-2">
          {[
            "Your official SBG-UC-YYXXXX member ID",
            "Event attendance tracking via QR code",
            "Member roster recognition across all org activities",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-neutral-400">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00e482]" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2.5">
        <Link
          href="/login?redirect=%2Fmember"
          className="flex items-center justify-center gap-2 rounded-lg bg-[#161d27] px-4 py-3 text-sm font-semibold text-[#00e482] transition-opacity hover:opacity-90"
        >
          Sign in and register membership
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Link>
        <Link
          href="/login"
          className="flex items-center justify-center rounded-lg border border-neutral-800 px-4 py-3 text-sm font-medium text-neutral-500 transition-colors hover:border-neutral-700 hover:text-neutral-300"
        >
          Skip — just sign in
        </Link>
      </div>

      <p className="text-center text-xs text-neutral-700">
        You can register your membership later from your profile.
      </p>
    </div>
  );
}
