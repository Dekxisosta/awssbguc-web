"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "@/src/features/auth";
import { WatcherCharacter } from "@/src/shared/ui/WatcherCharacter";

export const loginMetadata = {
  title: "Sign in — AWSSBG-UC",
};

export function LoginPage() {
  const [passwordFocused, setPasswordFocused] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* ── Left brand panel ── */}
      <BrandPanel
        heading="Welcome back."
        sub="Sign in to access your dashboard, events, and member resources."
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
              Sign in
            </h1>
            <p className="mt-2 text-sm text-neutral-400">
              Enter your credentials to continue.
            </p>
          </div>

          <LoginForm
            onPasswordFocus={() => setPasswordFocused(true)}
            onPasswordBlur={() => setPasswordFocused(false)}
          />

          <p className="mt-8 text-center text-xs text-neutral-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-neutral-400 underline-offset-2 hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

/* ── Shared brand panel ─────────────────────────────────────────────────── */

export function BrandPanel({ heading, sub }: { heading: string; sub: string }) {
  return (
    <aside
      aria-hidden="true"
      className="relative hidden w-[480px] shrink-0 flex-col justify-between overflow-hidden bg-neutral-900 px-12 py-14 lg:flex"
    >
      {/* Dot-grid texture */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      {/* Brand glow */}
      <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 -translate-x-1/3 translate-y-1/3 rounded-full bg-[#00e482]/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-[#00e482]/8 blur-3xl" />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <Image
          src="/icons/logo.jpg"
          alt="AWSSBG-UC logo"
          width={32}
          height={32}
          className="rounded-sm object-contain"
        />
        <div>
          <p className="text-sm font-bold leading-none tracking-tight text-neutral-100">
            AWSSBG-UC
          </p>
          <p className="mt-0.5 text-[10px] leading-none text-neutral-500">
            AWS Student Builder Group
          </p>
        </div>
      </div>

      {/* Heading */}
      <div className="relative z-10">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#00e482]">
          University of Cabuyao
        </p>
        <h2 className="text-3xl font-bold leading-snug tracking-tight text-neutral-100">
          {heading}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">{sub}</p>
      </div>

      {/* Feature callouts */}
      <div className="relative z-10 space-y-3">
        {[
          { label: "Cloud Workshops", desc: "Hands-on AWS labs, no credit card required" },
          { label: "Certification Tracks", desc: "Guided study from Foundational to Professional" },
          { label: "Community Events", desc: "Hackathons, talks, and industry networking" },
        ].map(({ label, desc }) => (
          <div key={label} className="flex items-start gap-3">
            <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-[#00e482]/20 ring-1 ring-[#00e482]/40 flex items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00e482]" />
            </span>
            <div>
              <p className="text-xs font-semibold text-neutral-200">{label}</p>
              <p className="text-xs text-neutral-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
