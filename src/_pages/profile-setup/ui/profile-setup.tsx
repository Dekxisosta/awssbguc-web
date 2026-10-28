"use client";

import { useState } from "react";
import Link from "next/link";
import { AvatarUpload } from "@/src/features/avatar-upload";
import { bodyFont, hd } from "@/src/shared/config/fonts";
import {
  darkBanner,
  darkErr,
  darkHint,
  darkInput,
  darkLabel,
  darkOutline,
  darkSubmit,
} from "@/src/shared/ui/pixel-form-dark";
import { Stripes, SidePixels, PixelClouds } from "@/src/widgets/home-client";

export const profileSetupMetadata = { title: "Set up your profile — AWSSBG-UC" };

type SaveState = "idle" | "saving" | "saved" | "error";

const wrap = "mx-auto w-full max-w-page px-5 sm:px-8";

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

  const saving = saveState === "saving";

  return (
    <div className={`${bodyFont.className} relative isolate bg-black tracking-normal text-pix-butter`}>
      <PixelClouds />
      <SidePixels side="left" />
      <SidePixels side="right" />

      <div className="relative z-10">
        <section className={`${wrap} pb-10 pt-10 sm:pb-14 sm:pt-14`}>
          <p className="text-xl">AWSSBG-UC</p>
          <h1 className={`${hd} mt-3 text-[clamp(4rem,11vw,8rem)]`}>
            {done ? "Profile saved" : "Your profile"}
          </h1>
          <p className="mt-6 max-w-2xl text-2xl leading-snug">
            {done
              ? "Ready to register your membership?"
              : "All fields are optional. You can update these anytime."}
          </p>
          <div className="mt-8">
            <Steps />
          </div>
        </section>

        <Stripes className="h-4" />

        <section className={`${wrap} py-12 sm:py-16`}>
          {done ? (
            <div className="mx-auto max-w-xl border-4 border-pix-teal p-8 text-center shadow-pixel-teal-6">
              <p className={`${hd} text-5xl`}>All set</p>
              <p className="mt-3 text-lg">Your profile is saved. Next up: your SBG membership.</p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/member" className={darkSubmit}>
                  Register membership
                  <ChevronIcon />
                </Link>
                <Link href="/" className={darkOutline}>
                  Skip, go to home
                </Link>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSave}
              noValidate
              className="mx-auto flex max-w-2xl flex-col gap-6 border-4 border-pix-teal p-6 shadow-pixel-teal-6 sm:p-8"
            >
              {/* Avatar */}
              <div className="flex flex-col items-center gap-2">
                <AvatarUpload
                  variant="pixel"
                  portal
                  avatarUrl={avatarUrl}
                  username={username || null}
                  onAvatarChange={setAvatarUrl}
                />
                <p className={darkHint}>Click the photo to upload one.</p>
              </div>

              {/* Username */}
              {!usernameAlreadyChanged ? (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="username" className={darkLabel}>
                    Username{" "}
                    <span className="ml-1 border-2 border-pix-green px-1.5 text-xs text-pix-green">one-time</span>
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setFieldError((f) => ({ ...f, username: "" }));
                    }}
                    placeholder="e.g. cloudbuilder"
                    autoComplete="username"
                    aria-invalid={!!fieldError.username}
                    aria-describedby={fieldError.username ? "username-error" : "username-hint"}
                    className={darkInput(!!fieldError.username)}
                  />
                  {fieldError.username ? (
                    <p id="username-error" role="alert" className={darkErr}>
                      <AlertIcon />
                      {fieldError.username}
                    </p>
                  ) : (
                    <p id="username-hint" className={darkHint}>
                      6–24 characters, letters, numbers and underscores. You can only set this once.
                    </p>
                  )}
                </div>
              ) : (
                <div className="border-4 border-pix-butter/40 px-4 py-3">
                  <p className="text-sm uppercase tracking-wide text-pix-butter/70">Username</p>
                  <p className="mt-1 text-lg">{initialUsername ?? "—"}</p>
                  <p className={`mt-1 ${darkHint}`}>Your username is already set and can&apos;t be changed here.</p>
                </div>
              )}

              {/* Bio */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="bio" className={darkLabel}>Bio</label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. AWS enthusiast, studying cloud security."
                  rows={3}
                  maxLength={280}
                  aria-describedby="bio-count"
                  className={`${darkInput(false)} resize-none`}
                />
                <p id="bio-count" className="text-right text-sm text-pix-butter/60">{bio.length}/280</p>
              </div>

              {/* Skills */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="skills" className={darkLabel}>Skills</label>
                <input
                  id="skills"
                  type="text"
                  value={skills}
                  onChange={(e) => {
                    setSkills(e.target.value);
                    setFieldError((f) => ({ ...f, skills: "" }));
                  }}
                  placeholder="e.g. Python, AWS, React"
                  aria-invalid={!!fieldError.skills}
                  aria-describedby={fieldError.skills ? "skills-error" : "skills-hint"}
                  className={darkInput(!!fieldError.skills)}
                />
                {fieldError.skills ? (
                  <p id="skills-error" role="alert" className={darkErr}>
                    <AlertIcon />
                    {fieldError.skills}
                  </p>
                ) : (
                  <p id="skills-hint" className={darkHint}>Comma-separated, up to 20 tags.</p>
                )}
              </div>

              {error && (
                <div role="alert" className={darkBanner}>
                  <AlertIcon />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-end">
                <Link href="/member" className={darkOutline}>
                  Skip for now
                </Link>
                <button type="submit" disabled={saving} className={darkSubmit}>
                  {saving ? "Saving…" : "Save and continue"}
                  {!saving && <ChevronIcon />}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

/* ── Pieces ──────────────────────────────────────────────────────────────── */

/** Account → Profile → Membership. Square markers, like the rest of the site's chrome. */
function Steps() {
  const items = [
    { label: "Account", state: "done" },
    { label: "Profile", state: "current" },
    { label: "Membership", state: "todo" },
  ] as const;

  const marker = {
    done: "border-pix-green bg-pix-green text-black",
    current: "border-pix-butter bg-pix-butter text-black",
    todo: "border-pix-butter/40 text-pix-butter/60",
  } as const;

  return (
    <ol aria-label="Registration progress" className="flex flex-wrap items-center gap-3 text-base">
      {items.map((it, i) => (
        <li
          key={it.label}
          aria-current={it.state === "current" ? "step" : undefined}
          className="flex items-center gap-3"
        >
          <span className={`flex h-8 w-8 items-center justify-center border-4 text-sm ${marker[it.state]}`}>
            {it.state === "done" ? "✓" : i + 1}
          </span>
          <span className={it.state === "todo" ? "text-pix-butter/60" : ""}>{it.label}</span>
          {i < items.length - 1 && <span aria-hidden="true" className="h-1 w-6 bg-pix-butter/40" />}
        </li>
      ))}
    </ol>
  );
}

function ChevronIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 shrink-0">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
