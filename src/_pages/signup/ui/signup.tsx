"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { RegisterForm } from "@/src/features/auth";
import { BrandPanel } from "@/src/_pages/login";
import { WatcherCharacter } from "@/src/shared/ui/WatcherCharacter";

export const signupMetadata = {
  title: "Sign up — AWSSBG-UC",
};

export function SignupPage() {
  const [passwordFocused, setPasswordFocused] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* ── Left brand panel ── */}
      <BrandPanel
        heading="Build on the cloud. Learn together."
        sub="Join UC's official AWS student community and start earning certifications, shipping real projects, and growing alongside the next generation of cloud engineers."
      />

      {/* ── Right form panel ── */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-16 lg:px-16">
        <div className="w-full max-w-sm">
          {/* Mobile-only logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Image
              src="/icons/logo.webp"
              alt="AWSSBG-UC logo"
              width={28}
              height={28}
              className="rounded-sm object-contain"
            />
            <span className="text-sm font-semibold tracking-tight">AWSSBG-UC</span>
          </div>

          {/* Watcher character */}
          <div className="mb-6 flex justify-center">
            <WatcherCharacter eyesClosed={passwordFocused} />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-neutral-400">
              Your member ID will be assigned once verified by an officer.
            </p>
          </div>

          <RegisterForm
            onPasswordFocus={() => setPasswordFocused(true)}
            onPasswordBlur={() => setPasswordFocused(false)}
          />

          <p className="mt-8 text-center text-xs text-neutral-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-neutral-400 underline-offset-2 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
