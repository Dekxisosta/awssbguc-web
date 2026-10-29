"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/src/shared/supabase/client";
import { normalizeMembershipInput } from "@/src/shared/lib/account/validation";
import type { MembershipOutcome, RegisterResponse, RegistrationField, RegistrationPayload } from "@/src/shared/types/auth";
import { AlertIcon, SpinnerIcon, bannerCls, focusRing, submitCls } from "@/src/features/auth";
import { checkAvailability } from "../model/checkAvailability";
import {
  EMPTY_DATA, FIELD_STEP, STEPS, TAKEN_MESSAGES, UNIQUE_FIELDS_BY_STEP,
  type WizardData, type WizardErrors, type WizardField, type WizardStep,
} from "../model/types";
import { availabilityQueryFor, membershipInput, profileInput, uniqueFieldValue, validateStep } from "../model/validateStep";
import { ReviewStep } from "./ReviewStep";
import { StepIndicator } from "./StepIndicator";
import { AccountStep, MembershipStep, ProfileStep } from "./steps";

type Phase = "editing" | "validating" | "submitting" | "done";

interface DoneInfo {
  membership: MembershipOutcome;
  signedIn: boolean;
  avatarFailed: boolean;
}

const secondaryBtn = `border-4 border-black px-4 py-3 text-lg transition-colors hover:bg-black hover:text-pix-butter disabled:opacity-50 ${focusRing}`;

export function SignupWizard({ onStepChange }: { onStepChange?: (step: WizardStep) => void }) {
  const [step, setStep] = useState<WizardStep>("account");
  const [furthest, setFurthest] = useState(0);
  const [data, setData] = useState<WizardData>(EMPTY_DATA);
  const [errors, setErrors] = useState<WizardErrors>({});
  const [checking, setChecking] = useState<ReadonlySet<WizardField>>(new Set());
  const [phase, setPhase] = useState<Phase>("editing");
  const [banner, setBanner] = useState<string | null>(null);
  const [done, setDone] = useState<DoneInfo | null>(null);

  const dataRef = useRef(data);
  dataRef.current = data;

  const busy = phase !== "editing";
  const stepIdx = STEPS.indexOf(step);

  const goTo = useCallback((s: WizardStep) => {
    setStep(s);
    onStepChange?.(s);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [onStepChange]);

  // Warn before losing in-memory answers (nothing is persisted on purpose: it includes the password).
  useEffect(() => {
    if (phase === "done") return;
    const dirty = JSON.stringify({ ...data, avatar: !!data.avatar }) !== JSON.stringify({ ...EMPTY_DATA, avatar: false });
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [data, phase]);

  const set = useCallback(<K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    setData((d) => ({ ...d, [key]: value }));
    setErrors((e) => {
      const next = { ...e };
      delete next[key as WizardField];
      if (key === "agreedToTerms") delete next.terms;
      if (key === "password") delete next.confirmPassword;
      return next;
    });
    setBanner(null);
  }, []);

  // Flag a taken value as soon as the user leaves the field.
  const onBlurCheck = useCallback(async (field: RegistrationField) => {
    if (field !== "email" && field !== "username" && field !== "discordId" && field !== "githubUsername" && field !== "studentNumber") return;
    const queried = uniqueFieldValue(field, dataRef.current);
    if (!queried) return; // blank or badly formatted: Next reports that
    setChecking((c) => new Set(c).add(field));
    const taken = await checkAvailability({ [field]: queried });
    setChecking((c) => { const n = new Set(c); n.delete(field); return n; });
    if (uniqueFieldValue(field, dataRef.current) !== queried) return; // edited while checking
    if (taken?.includes(field)) {
      setErrors((e) => ({ ...e, [field]: TAKEN_MESSAGES[field] ?? "Already in use." }));
    }
  }, []);

  async function next() {
    const local = validateStep(step, data);
    if (Object.keys(local).length > 0) { setErrors(local); return; }

    setPhase("validating");
    setBanner(null);
    const taken = UNIQUE_FIELDS_BY_STEP[step].length > 0
      ? await checkAvailability(availabilityQueryFor(step, data))
      : [];
    setPhase("editing");

    // taken === null means the check could not run; the final submit re-checks.
    if (taken && taken.length > 0) {
      setErrors(Object.fromEntries(taken.map((f) => [f, TAKEN_MESSAGES[f] ?? "Already in use."])));
      return;
    }
    setErrors({});
    const nextStep = STEPS[stepIdx + 1];
    setFurthest((f) => Math.max(f, stepIdx + 1));
    goTo(nextStep);
  }

  function back() {
    setErrors({});
    goTo(STEPS[Math.max(0, stepIdx - 1)]);
  }

  function jumpTo(s: WizardStep) {
    setErrors({});
    goTo(s);
  }

  async function submit() {
    const all: WizardErrors = {
      ...validateStep("account", data),
      ...validateStep("profile", data),
      ...validateStep("membership", data),
      ...validateStep("review", data),
    };
    if (Object.keys(all).length > 0) {
      setErrors(all);
      jumpToFirstErrorStep(all);
      return;
    }

    setPhase("submitting");
    setBanner(null);

    const membership = normalizeMembershipInput(membershipInput(data)).value;
    const payload: RegistrationPayload = {
      email: data.email.trim().toLowerCase(),
      fullName: data.fullName.trim(),
      password: data.password,
      profile: profileInput(data),
      ...(membership ? { membership: { ...membership, middleName: membership.middleName ?? undefined } } : {}),
    };

    let res: RegisterResponse;
    try {
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      res = await r.json();
    } catch {
      setBanner("Something went wrong. Please check your connection and try again.");
      setPhase("editing");
      return;
    }

    if (!res.success) {
      const fieldErrors: WizardErrors = res.errors ?? (res.field ? { [res.field]: res.error } : {});
      setPhase("editing");
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        jumpToFirstErrorStep(fieldErrors);
      } else {
        setBanner(res.error);
      }
      return;
    }

    // Account exists. Everything below is "afterwards" and must not undo it.
    const { error: signInError } = await createClient().auth.signInWithPassword({
      email: payload.email,
      password: data.password,
    });
    const signedIn = !signInError;

    let avatarFailed = false;
    if (data.avatar && signedIn) {
      try {
        const form = new FormData();
        form.append("file", data.avatar);
        const up = await fetch("/api/profile/avatar", { method: "POST", body: form });
        avatarFailed = !(await up.json()).success;
      } catch {
        avatarFailed = true;
      }
    }

    setData(EMPTY_DATA); // drop the password from memory
    setDone({ membership: res.membership, signedIn, avatarFailed });
    setPhase("done");
  }

  function jumpToFirstErrorStep(errs: WizardErrors) {
    const steps = Object.keys(errs).map((f) => FIELD_STEP[f as WizardField]).filter((s): s is WizardStep => !!s);
    const first = STEPS.find((s) => steps.includes(s));
    if (first) goTo(first);
  }

  /* ── Done ── */
  if (phase === "done" && done) return <DoneCard info={done} />;

  const stepProps = { data, errors, checking, disabled: busy, set, onBlurCheck };
  const isReview = step === "review";

  return (
    <div>
      <StepIndicator current={step} furthest={furthest} onSelect={jumpTo} disabled={busy} />

      {banner && (
        <div role="alert" className={`${bannerCls} mb-4`}>
          <AlertIcon />
          <span>{banner}</span>
        </div>
      )}

      <form
        noValidate
        onSubmit={(e) => { e.preventDefault(); if (!busy) void (isReview ? submit() : next()); }}
        className="flex flex-col gap-6"
      >
        {step === "account" && <AccountStep {...stepProps} />}
        {step === "profile" && <ProfileStep {...stepProps} />}
        {step === "membership" && <MembershipStep {...stepProps} />}
        {isReview && (
          <ReviewStep data={data} errors={errors} disabled={busy} onEdit={jumpTo} onAgree={(v) => set("agreedToTerms", v)} />
        )}

        <div className="flex flex-col gap-3">
          <button type="submit" disabled={busy} className={submitCls}>
            {phase === "submitting" ? (<><SpinnerIcon />Creating account…</>)
              : phase === "validating" ? (<><SpinnerIcon />Checking…</>)
              : isReview ? "Create account"
              : step === "membership" && !Object.values(membershipInput(data)).some((v) => v.trim()) ? "Skip membership"
              : step === "profile" && !data.username && !data.discordId && !data.githubUsername && !data.bio && !data.skills && !data.avatar && data.directoryVisible ? "Skip profile"
              : "Next"}
          </button>
          {stepIdx > 0 && (
            <button type="button" disabled={busy} onClick={back} className={secondaryBtn}>Back</button>
          )}
        </div>
      </form>
    </div>
  );
}

/* ── Result ─────────────────────────────────────────────────────────────── */

function DoneCard({ info }: { info: DoneInfo }) {
  const { membership, signedIn, avatarFailed } = info;
  return (
    <div className="flex flex-col gap-4">
      <div className="border-4 border-black bg-pix-green px-6 py-6 text-center text-black shadow-pixel-ink-6">
        <p className="text-2xl">Account created</p>
        {!signedIn && <p className="mt-2 text-base">Please sign in with your new credentials.</p>}
      </div>

      {membership.status === "registered" && (
        <div className="border-4 border-black p-4 text-center text-black">
          <p className="text-base">You&apos;re now an SBG member</p>
          <p className="mt-1 text-xl">{membership.memberId}</p>
        </div>
      )}
      {membership.status === "skipped" && (
        <p className="text-center text-base text-black/80">
          You have an account but no SBG membership yet. You can register from your member page anytime.
        </p>
      )}
      {membership.status === "failed" && (
        <div role="alert" className={bannerCls}>
          <AlertIcon />
          <span>Your account was created, but membership wasn&apos;t registered: {membership.error}</span>
        </div>
      )}
      {avatarFailed && (
        <p role="alert" className="text-center text-base text-pix-rust">
          Your profile photo couldn&apos;t be uploaded. You can add it from your profile.
        </p>
      )}

      <a
        href={signedIn ? (membership.status === "failed" ? "/membership" : "/") : "/login"}
        className={`${submitCls} no-underline`}
      >
        {signedIn ? (membership.status === "failed" ? "Go to member page" : "Continue") : "Sign in"}
      </a>
    </div>
  );
}
