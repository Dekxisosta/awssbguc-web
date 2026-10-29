"use client";

import { useState } from "react";
import { EyeToggle, Field, inputClass, labelCls, errTxt, hintTxt } from "@/src/features/auth";
import { YEAR_LEVELS } from "@/src/shared/lib/account/validation";
import type { RegistrationField } from "@/src/shared/types/auth";
import type { WizardData, WizardErrors, WizardField } from "../model/types";
import { AvatarPicker } from "./AvatarPicker";
import { InfoBox, TextField } from "./fields";

export interface StepProps {
  data: WizardData;
  errors: WizardErrors;
  checking: ReadonlySet<WizardField>;
  disabled: boolean;
  set: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void;
  onBlurCheck: (field: RegistrationField) => void;
}

/* ── Step 1: Account (required) ─────────────────────────────────────────── */

export function AccountStep({ data, errors, checking, disabled, set, onBlurCheck }: StepProps) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <TextField id="fullName" label="Full name" required disabled={disabled} autoComplete="name"
        value={data.fullName} onChange={(v) => set("fullName", v)} error={errors.fullName} placeholder="Jane Doe" />

      <TextField id="email" label="Email address" required disabled={disabled} type="email" autoComplete="email"
        value={data.email} onChange={(v) => set("email", v)} onBlur={() => onBlurCheck("email")}
        error={errors.email} checking={checking.has("email")} placeholder="jane@example.com" />

      <Field id="password" label="Password" required error={errors.password}
        hint={!errors.password ? "Min. 8 characters with uppercase, lowercase, and a number." : undefined}>
        <div className="relative">
          <input id="password" name="password" type={show ? "text" : "password"} autoComplete="new-password"
            disabled={disabled} value={data.password} onChange={(e) => set("password", e.target.value)}
            aria-required="true" aria-invalid={!!errors.password}
            className={inputClass(!!errors.password) + " pr-10"} placeholder="••••••••" />
          <EyeToggle open={show} onToggle={() => setShow((v) => !v)} />
        </div>
      </Field>

      <Field id="confirmPassword" label="Confirm password" required error={errors.confirmPassword}>
        <div className="relative">
          <input id="confirmPassword" name="confirmPassword" type={show ? "text" : "password"} autoComplete="new-password"
            disabled={disabled} value={data.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)}
            aria-required="true" aria-invalid={!!errors.confirmPassword}
            className={inputClass(!!errors.confirmPassword) + " pr-10"} placeholder="••••••••" />
          <EyeToggle open={show} onToggle={() => setShow((v) => !v)} />
        </div>
      </Field>

      <p className={hintTxt}>Nothing is created until you submit on the last step.</p>
    </div>
  );
}

/* ── Step 2: Profile (all optional) ─────────────────────────────────────── */

export function ProfileStep({ data, errors, checking, disabled, set, onBlurCheck }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <AvatarPicker file={data.avatar} onChange={(f) => set("avatar", f)} error={errors.avatar} disabled={disabled} />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="username" label="Username" disabled={disabled} autoComplete="off"
          value={data.username} onChange={(v) => set("username", v)} onBlur={() => onBlurCheck("username")}
          error={errors.username} checking={checking.has("username")} placeholder="e.g. cloudbuilder"
          hint="6–24 chars, letter/number/_. Choosing one uses your one-time change; leave blank to get an auto-generated one." />
        <TextField id="skills" label="Skills" disabled={disabled}
          value={data.skills} onChange={(v) => set("skills", v)} error={errors.skills}
          placeholder="e.g. Python, AWS, React" hint="Comma-separated, up to 20 tags." />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="discordId" label="Discord ID" disabled={disabled} autoComplete="off"
          value={data.discordId} onChange={(v) => set("discordId", v)} onBlur={() => onBlurCheck("discordId")}
          error={errors.discordId} checking={checking.has("discordId")} placeholder="17–19 digit ID"
          hint="Numeric snowflake or username#0000." />
        <TextField id="githubUsername" label="GitHub username" disabled={disabled} autoComplete="off"
          value={data.githubUsername} onChange={(v) => set("githubUsername", v)} onBlur={() => onBlurCheck("githubUsername")}
          error={errors.githubUsername} checking={checking.has("githubUsername")} placeholder="octocat" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="bio" className={labelCls}>Bio</label>
        <textarea id="bio" rows={3} maxLength={280} disabled={disabled} value={data.bio}
          onChange={(e) => set("bio", e.target.value)} aria-invalid={!!errors.bio}
          placeholder="e.g. AWS enthusiast, studying cloud security."
          className={inputClass(!!errors.bio) + " resize-none"} />
        {errors.bio && <p role="alert" className={errTxt}>{errors.bio}</p>}
        <p className="text-right text-sm text-black/70">{data.bio.length}/280</p>
      </div>

      <div className="flex items-start justify-between gap-4 border-4 border-black p-3">
        <div className="min-w-0">
          <p id="directoryVisible-label" className={labelCls}>Show my profile publicly</p>
          <p id="directoryVisible-desc" className={hintTxt}>
            Lets anyone see your name, username, photo, bio and skills in the member directory. You can change this anytime from your profile.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={data.directoryVisible}
          aria-labelledby="directoryVisible-label"
          aria-describedby="directoryVisible-desc"
          disabled={disabled}
          onClick={() => set("directoryVisible", !data.directoryVisible)}
          className="flex shrink-0 items-center gap-2 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-teal disabled:opacity-50"
        >
          <span className="w-8 text-sm font-bold">{data.directoryVisible ? "On" : "Off"}</span>
          <span
            aria-hidden="true"
            className={`relative h-8 w-14 border-4 border-black transition-colors ${data.directoryVisible ? "bg-pix-green" : "bg-white"}`}
          >
            <span className={`absolute top-0 h-full w-5 bg-black transition-all ${data.directoryVisible ? "left-[calc(100%-1.25rem)]" : "left-0"}`} />
          </span>
        </button>
      </div>
    </div>
  );
}

/* ── Step 3: Membership (optional, all-or-nothing) ──────────────────────── */

export function MembershipStep({ data, errors, checking, disabled, set, onBlurCheck }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <InfoBox>
        <strong>Optional.</strong> An account is not a membership. Filling this section in registers you as an
        SBG member; leave it blank to create an account only. You can register later from your member page.
      </InfoBox>

      <TextField id="studentNumber" label="Student number" disabled={disabled} autoComplete="off" inputMode="numeric"
        value={data.studentNumber} onChange={(v) => set("studentNumber", v)} onBlur={() => onBlurCheck("studentNumber")}
        error={errors.studentNumber} checking={checking.has("studentNumber")} placeholder="e.g. 2403962"
        hint="Your university student number." />

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField id="firstName" label="First name" disabled={disabled} autoComplete="given-name"
          value={data.firstName} onChange={(v) => set("firstName", v)} error={errors.firstName} placeholder="Juan" />
        <TextField id="middleName" label="Middle name (optional)" disabled={disabled} autoComplete="additional-name"
          value={data.middleName} onChange={(v) => set("middleName", v)} error={errors.middleName} placeholder="Santos" />
        <TextField id="lastName" label="Last name" disabled={disabled} autoComplete="family-name"
          value={data.lastName} onChange={(v) => set("lastName", v)} error={errors.lastName} placeholder="Dela Cruz" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="yearLevel" label="Year level" error={errors.yearLevel}>
          <select id="yearLevel" name="yearLevel" disabled={disabled} value={data.yearLevel}
            onChange={(e) => set("yearLevel", e.target.value)} aria-invalid={!!errors.yearLevel}
            className={inputClass(!!errors.yearLevel)}>
            <option value="">Select year level</option>
            {YEAR_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </Field>
        <TextField id="program" label="Program" disabled={disabled}
          value={data.program} onChange={(v) => set("program", v)} error={errors.program} placeholder="CCS - BS Computer Science" />
        <TextField id="section" label="Section" disabled={disabled}
          value={data.section} onChange={(v) => set("section", v)} error={errors.section} placeholder="A" />
      </div>

      <p className={hintTxt}>Self-reported. Used to generate your SBG membership record.</p>
    </div>
  );
}
