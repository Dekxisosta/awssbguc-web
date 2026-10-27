"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AvatarUpload } from "@/src/features/avatar-upload";

export const profileSetupMetadata = { title: "Set up your profile — AWSSBG-UC" };

type SaveState = "idle" | "saving" | "saved" | "error";

interface ProfileSetupPageProps {
  initialUsername: string | null;
  initialAvatarUrl: string | null;
  initialBio: string | null;
  initialSkills: string[] | null;
  usernameAlreadyChanged: boolean;
}

export function ProfileSetupPage({
  initialUsername,
  initialAvatarUrl,
  initialBio,
  initialSkills,
  usernameAlreadyChanged,
}: ProfileSetupPageProps) {
  const [username, setUsername] = useState(initialUsername ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [bio, setBio] = useState(initialBio ?? "");
  const [skills, setSkills] = useState(initialSkills ? initialSkills.join(", ") : "");

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveState("saving");
    setError(null);
    setFieldError({});

    const body: Record<string, unknown> = {};

    // Only send username if it's changed and the user hasn't already used their change
    if (!usernameAlreadyChanged && username.trim()) {
      body.username = username.trim().toLowerCase();
    }
    if (bio.trim()) body.bio = bio.trim();
    if (skills.trim()) body.skills = skills.trim();

    // Nothing to update — just move on
    if (Object.keys(body).length === 0) {
      setDone(true);
      return;
    }

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) {
        if (data.field) {
          setFieldError({ [data.field]: data.error });
        } else {
          setError(data.error);
        }
        setSaveState("error");
        return;
      }
      setSaveState("saved");
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
      setSaveState("error");
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-900 px-4 py-16">
        <div className="w-full max-w-sm flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <Image src="/icons/logo.webp" alt="" width={44} height={44} className="rounded-md object-contain" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-neutral-100">Profile saved</h1>
              <p className="mt-1 text-sm text-neutral-500">Ready to register your membership?</p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <Link
              href="/member"
              className="flex items-center justify-center gap-2 rounded-lg bg-brand-dark px-4 py-3 text-sm font-semibold text-brand-green transition-opacity hover:opacity-90"
            >
              Register membership
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center rounded-lg border border-neutral-800 px-4 py-3 text-sm font-medium text-neutral-500 transition-colors hover:border-neutral-700 hover:text-neutral-300"
            >
              Skip — go to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-900 px-4 py-16">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Image src="/icons/logo.webp" alt="AWSSBG-UC logo" width={44} height={44} className="rounded-md object-contain" />
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-neutral-100">Set up your profile</h1>
            <p className="mt-1 text-sm text-neutral-500">All fields are optional — you can update these anytime.</p>
          </div>
        </div>

        {/* Step indicator context */}
        <div className="mb-6 flex items-center justify-center gap-2 text-xs text-neutral-600">
          <span className="text-brand-green">✓ Account</span>
          <span>→</span>
          <span className="font-semibold text-neutral-300">Profile</span>
          <span>→</span>
          <span>Membership</span>
        </div>

        <form onSubmit={handleSave} noValidate className="flex flex-col gap-5">

          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <AvatarUpload
              avatarUrl={avatarUrl}
              username={username || null}
              onAvatarChange={setAvatarUrl}
            />
            <p className="text-xs text-neutral-600">Click to upload a photo</p>
          </div>

          {/* Username */}
          {!usernameAlreadyChanged ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-sm font-medium text-neutral-300">
                Username
                <span className="ml-2 text-[10px] font-normal text-brand-green uppercase tracking-wider">one-time</span>
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setFieldError((f) => ({ ...f, username: "" })); }}
                placeholder="e.g. cloudbuilder"
                autoComplete="username"
                className={inputClass(!!fieldError.username)}
              />
              {fieldError.username ? (
                <p className="text-xs text-red-400">{fieldError.username}</p>
              ) : (
                <p className="text-xs text-neutral-600">6–24 characters, letters/numbers/underscores. You can only set this once.</p>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-3">
              <p className="text-xs font-medium text-neutral-500">Username</p>
              <p className="mt-0.5 text-sm text-neutral-400 font-mono">{initialUsername ?? "—"}</p>
              <p className="mt-1 text-xs text-neutral-700">Username has already been set and cannot be changed here.</p>
            </div>
          )}

          {/* Bio */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="bio" className="text-sm font-medium text-neutral-300">Bio</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. AWS enthusiast, studying cloud security."
              rows={3}
              maxLength={280}
              className={inputClass(false) + " resize-none"}
            />
            <p className="text-right text-[10px] text-neutral-700">{bio.length}/280</p>
          </div>

          {/* Skills */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="skills" className="text-sm font-medium text-neutral-300">Skills</label>
            <input
              id="skills"
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Python, AWS, React"
              className={inputClass(!!fieldError.skills)}
            />
            {fieldError.skills ? (
              <p className="text-xs text-red-400">{fieldError.skills}</p>
            ) : (
              <p className="text-xs text-neutral-600">Comma-separated, up to 20 tags.</p>
            )}
          </div>

          {error && (
            <p className="rounded-lg border border-red-800/50 bg-red-950/30 px-4 py-2.5 text-sm text-red-400">{error}</p>
          )}

          <div className="flex flex-col gap-2.5 pt-1">
            <button
              type="submit"
              disabled={saveState === "saving"}
              className="flex items-center justify-center gap-2 rounded-lg bg-brand-dark px-4 py-3 text-sm font-semibold text-brand-green transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saveState === "saving" ? "Saving…" : "Save and continue"}
              {saveState !== "saving" && (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
              )}
            </button>
            <Link
              href="/member"
              className="flex items-center justify-center rounded-lg border border-neutral-800 px-4 py-3 text-sm font-medium text-neutral-500 transition-colors hover:border-neutral-700 hover:text-neutral-300"
            >
              Skip for now
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function inputClass(hasError: boolean): string {
  return [
    "w-full rounded-lg border bg-neutral-800 px-3 py-2.5 text-sm text-neutral-100",
    "placeholder:text-neutral-600 focus:outline-none focus:ring-2 transition-colors",
    hasError
      ? "border-red-700 focus:ring-red-600/30"
      : "border-neutral-700 focus:ring-brand-green/20 focus:border-brand-green/30",
  ].join(" ");
}
