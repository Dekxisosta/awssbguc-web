"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { RegisterForm } from "@/src/features/auth";
import { AvatarUpload } from "@/src/features/avatar-upload";
import { MemberLinkForm } from "@/src/features/member-link";

export const signupMetadata = {
  title: "Sign up — AWSSBG-UC",
};

type Step = "account" | "profile" | "membership";

const HEADINGS: Record<Step, { title: string; sub: string }> = {
  account:    { title: "Create your account",      sub: "Start here — takes less than a minute." },
  profile:    { title: "Set up your profile",       sub: "All fields optional — you can update these anytime." },
  membership: { title: "Register your membership",  sub: "Optional — you can always do this later." },
};

export function SignupPage() {
  const [step, setStep] = useState<Step>("account");

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-900 px-4 py-16">
      <div className={`w-full transition-all duration-300 ${step === "account" ? "max-w-sm" : "max-w-lg"}`}>

        {/* Logo + heading */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image src="/icons/logo.webp" alt="AWSSBG-UC logo" width={44} height={44} className="rounded-md object-contain" />
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-neutral-100">{HEADINGS[step].title}</h1>
            <p className="mt-1 text-sm text-neutral-500">{HEADINGS[step].sub}</p>
          </div>
        </div>

        {/* Step indicator */}
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

        {step === "profile" && (
          <ProfileStep onContinue={() => setStep("membership")} />
        )}

        {step === "membership" && (
          <MembershipStep />
        )}

      </div>
    </div>
  );
}

/* ── Step dot ───────────────────────────────────────────────────────────── */

function StepDot({ n, active, done, label }: { n: number; active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={[
        "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
        done  ? "bg-[#00e482] text-[#161d27]"
              : active ? "border-2 border-[#00e482] text-[#00e482]"
              : "border border-neutral-700 text-neutral-600",
      ].join(" ")}>
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

/* ── Step 2: Profile setup (user is now signed in) ─────────────────────── */

function ProfileStep({ onContinue }: { onContinue: () => void }) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const body: Record<string, unknown> = {};
    if (username.trim()) body.username = username.trim().toLowerCase();
    if (bio.trim())      body.bio      = bio.trim();
    if (skills.trim())   body.skills   = skills.trim();

    if (Object.keys(body).length === 0) {
      onContinue();
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        if (data.field) setFieldErrors({ [data.field]: data.error });
        else setError(data.error);
        setSaving(false);
        return;
      }
      onContinue();
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} noValidate className="flex flex-col gap-5">

      {/* Avatar */}
      <div className="flex flex-col items-center gap-2">
        <AvatarUpload avatarUrl={avatarUrl} username={username || null} onAvatarChange={setAvatarUrl} />
        <p className="text-xs text-neutral-600">Click to upload a photo</p>
      </div>

      {/* Username + bio side by side on wider layout */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="su-username" className="flex items-center gap-2 text-sm font-medium text-neutral-300">
            Username
            <span className="text-[10px] font-normal text-[#00e482] uppercase tracking-wider">one-time</span>
          </label>
          <input
            id="su-username"
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setFieldErrors((f) => ({ ...f, username: "" })); }}
            placeholder="e.g. cloudbuilder"
            className={inputCls(!!fieldErrors.username)}
          />
          {fieldErrors.username
            ? <p className="text-xs text-red-400">{fieldErrors.username}</p>
            : <p className="text-xs text-neutral-600">6–24 chars, letter/number/_. Set once.</p>
          }
        </div>

        {/* Skills */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="su-skills" className="text-sm font-medium text-neutral-300">Skills</label>
          <input
            id="su-skills"
            type="text"
            value={skills}
            onChange={(e) => { setSkills(e.target.value); setFieldErrors((f) => ({ ...f, skills: "" })); }}
            placeholder="e.g. Python, AWS, React"
            className={inputCls(!!fieldErrors.skills)}
          />
          {fieldErrors.skills
            ? <p className="text-xs text-red-400">{fieldErrors.skills}</p>
            : <p className="text-xs text-neutral-600">Comma-separated, up to 20 tags.</p>
          }
        </div>
      </div>

      {/* Bio */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="su-bio" className="text-sm font-medium text-neutral-300">Bio</label>
        <textarea
          id="su-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="e.g. AWS enthusiast, studying cloud security."
          rows={3}
          maxLength={280}
          className={inputCls(false) + " resize-none"}
        />
        <p className="text-right text-[10px] text-neutral-700">{bio.length}/280</p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-800/50 bg-red-950/30 px-4 py-2.5 text-sm text-red-400">{error}</p>
      )}

      <div className="flex flex-col gap-2.5">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#161d27] px-4 py-3 text-sm font-semibold text-[#00e482] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save and continue"}
          {!saving && (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
          )}
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="flex items-center justify-center rounded-lg border border-neutral-800 px-4 py-3 text-sm font-medium text-neutral-500 transition-colors hover:border-neutral-700 hover:text-neutral-300"
        >
          Skip for now
        </button>
      </div>
    </form>
  );
}

/* ── Step 3: Membership (user is signed in, MemberLinkForm works) ───────── */

function MembershipStep() {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <MemberLinkForm onSuccess={() => { window.location.href = "/"; }} />
      </div>
      <div className="text-center">
        <a
          href="/"
          className="text-xs text-neutral-600 underline-offset-2 hover:text-neutral-400 hover:underline"
        >
          Skip — go to home
        </a>
      </div>
    </div>
  );
}

function inputCls(hasError: boolean): string {
  return [
    "w-full rounded-lg border bg-neutral-800 px-3 py-2.5 text-sm text-neutral-100",
    "placeholder:text-neutral-600 focus:outline-none focus:ring-2 transition-colors",
    hasError
      ? "border-red-700 focus:ring-red-600/30"
      : "border-neutral-700 focus:ring-[#00e482]/20 focus:border-[#00e482]/30",
  ].join(" ");
}
