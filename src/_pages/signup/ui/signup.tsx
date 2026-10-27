"use client";

import { useState } from "react";
import Link from "next/link";
import { focusRing } from "@/src/features/auth";
import { SignupWizard, type WizardStep } from "@/src/features/signup-wizard";
import { AuthShell } from "@/src/widgets/auth-shell";

const HEADINGS: Record<WizardStep, { title: string; sub: string; bubble: string }> = {
  account:    { title: "Create your account",       sub: "Start here. Nothing is created until the last step.",        bubble: "I don't bite" },
  profile:    { title: "Set up your profile",       sub: "All fields optional. You can update these anytime.",          bubble: "Looking good!" },
  membership: { title: "Register your membership",  sub: "Optional. Filling this in makes you an SBG member.",          bubble: "Almost there!" },
  review:     { title: "Review and create",         sub: "Check everything, then create your account.",                 bubble: "Last step!" },
};

const linkCls = `underline underline-offset-4 hover:bg-black hover:text-pix-butter ${focusRing}`;

export function SignupPage() {
  const [step, setStep] = useState<WizardStep>("account");
  const h = HEADINGS[step];

  return (
    <AuthShell title={h.title} sub={h.sub} bubble={h.bubble} wide={step !== "account"}>
      <SignupWizard onStepChange={setStep} />
      {step === "account" && (
        <p className="mt-6 text-center text-base">
          Already have an account?{" "}
          <Link href="/login" className={linkCls}>
            Sign in
          </Link>
        </p>
      )}
    </AuthShell>
  );
}
