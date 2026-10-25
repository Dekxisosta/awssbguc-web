"use client";

import { useState } from "react";
import { PrivacyModal, TermsModal, errTxt, linkBtn, focusRing } from "@/src/features/auth";
import { parseSkills } from "@/src/shared/lib/account/validation";
import type { WizardData, WizardErrors, WizardStep } from "../model/types";
import { membershipInput } from "../model/validateStep";
import { InfoBox } from "./fields";

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-3 text-base">
      <dt className="text-black/60">{label}</dt>
      <dd className="break-words">{value || <span className="text-black/40">—</span>}</dd>
    </div>
  );
}

function Section({ title, step, onEdit, disabled, children }: {
  title: string; step: WizardStep; onEdit: (s: WizardStep) => void; disabled: boolean; children: React.ReactNode;
}) {
  return (
    <section className="border-4 border-black p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg">{title}</h3>
        <button type="button" disabled={disabled} onClick={() => onEdit(step)} className={`underline underline-offset-4 ${focusRing}`}>
          Edit
        </button>
      </div>
      <dl className="flex flex-col gap-1">{children}</dl>
    </section>
  );
}

export function ReviewStep({
  data, errors, disabled, onEdit, onAgree,
}: {
  data: WizardData;
  errors: WizardErrors;
  disabled: boolean;
  onEdit: (s: WizardStep) => void;
  onAgree: (v: boolean) => void;
}) {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const m = membershipInput(data);
  const registeringMembership = Object.values(m).some((v) => v.trim());
  const skills = parseSkills(data.skills).tags.join(", ");

  return (
    <div className="flex flex-col gap-4">
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}

      <p className="text-base text-black/80">Check your answers. Nothing is created until you submit.</p>

      <Section title="Account" step="account" onEdit={onEdit} disabled={disabled}>
        <Row label="Full name" value={data.fullName.trim()} />
        <Row label="Email" value={data.email.trim()} />
        <Row label="Password" value="••••••••" />
      </Section>

      <Section title="Profile" step="profile" onEdit={onEdit} disabled={disabled}>
        <Row label="Photo" value={data.avatar ? data.avatar.name : null} />
        <Row label="Username" value={data.username.trim() || "Auto-generated"} />
        <Row label="Discord ID" value={data.discordId.trim()} />
        <Row label="GitHub" value={data.githubUsername.trim()} />
        <Row label="Skills" value={skills} />
        <Row label="Bio" value={data.bio.trim()} />
      </Section>

      <Section title="Membership" step="membership" onEdit={onEdit} disabled={disabled}>
        {registeringMembership ? (
          <>
            <Row label="Student number" value={m.studentNumber.trim()} />
            <Row label="Name" value={[m.firstName, m.middleName, m.lastName].map((s) => s.trim()).filter(Boolean).join(" ")} />
            <Row label="Year level" value={m.yearLevel} />
            <Row label="Program" value={m.program.trim()} />
            <Row label="Section" value={m.section.trim()} />
          </>
        ) : (
          <p className="text-base">Not registering. You&apos;ll have an account without SBG membership.</p>
        )}
      </Section>

      {registeringMembership && (
        <InfoBox>Submitting will create your account and register you as an SBG member.</InfoBox>
      )}

      <div className="flex flex-col gap-1">
        <div className="flex items-start gap-2.5">
          <input
            id="terms" type="checkbox" checked={data.agreedToTerms} disabled={disabled}
            onChange={(e) => onAgree(e.target.checked)} aria-invalid={!!errors.terms}
            className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-black disabled:opacity-50"
          />
          <label htmlFor="terms" className="cursor-pointer select-none text-sm leading-relaxed text-black/80">
            I agree to the{" "}
            <button type="button" onClick={() => setShowTerms(true)} className={linkBtn}>Terms of Service</button>{" "}
            and acknowledge the{" "}
            <button type="button" onClick={() => setShowPrivacy(true)} className={linkBtn}>Privacy Policy</button>.
          </label>
        </div>
        {errors.terms && <p role="alert" className={`${errTxt} pl-7`}>{errors.terms}</p>}
      </div>
    </div>
  );
}
