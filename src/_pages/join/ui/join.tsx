import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SOCIALS } from "@/src/shared/config/socials";

export const joinMetadata: Metadata = {
  title: "Join Us — AWSSBG-UC",
  description:
    "How to become a member of the AWS Student Builder Group — University of Cabuyao: eligibility, the application steps, and what happens after you register.",
};

const STEPS = [
  {
    title: "Create your account",
    body: "Sign up with your email and set a password. This gets you a personal dashboard — membership isn't required yet at this step.",
  },
  {
    title: "Fill out your membership details",
    body: "Head to Membership and enter your student number, full name, year level, program, and section. This information is self-reported by you.",
  },
  {
    title: "Get your SBG member ID",
    body: "Submitting the form immediately generates your official SBG-UC-YYXXXX member ID and registers you in the member roster — no waiting period.",
  },
  {
    title: "Start participating",
    body: "Register for workshops and events, get your personal event QR code for attendance, and read the Constitution and By-Laws to see how the org runs.",
  },
];

const ELIGIBILITY = [
  "Currently enrolled as an undergraduate or graduate student of the University of Cabuyao (Pamantasan ng Cabuyao).",
  "Open to all academic colleges and degree programs — not limited to Computing Studies.",
  "No prior cloud computing, AI, or programming experience required.",
];

const FAQS = [
  {
    q: "Is there a membership fee?",
    a: "No. Membership in AWSSBG-UC is free for all eligible University of Cabuyao students.",
  },
  {
    q: "Do I need an AWS account already?",
    a: "No. Cloud accounts, sandboxes, and learning resources are introduced as part of workshops and onboarding after you join.",
  },
  {
    q: "What if I make a mistake on my membership form?",
    a: `Contact an administrator through Discord or ${SOCIALS.email} and they can help correct your record.`,
  },
  {
    q: "I already have an account — how do I register my membership?",
    a: "Sign in, then go to Membership from your profile menu and fill out the form there.",
  },
];

export default function JoinPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* Hero */}
      <section className="mb-14">
        <div className="flex flex-col items-center gap-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-center sm:text-left">
            <span className="mb-5 inline-block rounded-full border border-[#00e482]/30 bg-[#00e482]/10 px-4 py-1.5 text-sm font-semibold uppercase tracking-widest text-[#00e482]">
              Join Us
            </span>
            <h1 className="mb-5 text-5xl font-extrabold tracking-tighter text-neutral-50 sm:text-6xl">
              Become a Member
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-neutral-400">
              AWSSBG-UC is open to every currently enrolled University of Cabuyao student. Applying takes
              a few minutes and your membership is registered instantly — no waiting on approval.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <Link
                href="/signup"
                className="rounded-full bg-[#00e482] px-6 py-2.5 text-sm font-semibold text-[#161d27] transition-opacity hover:opacity-90"
              >
                Create your account
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-neutral-700 px-6 py-2.5 text-sm font-semibold text-neutral-300 transition-colors hover:border-neutral-500 hover:text-neutral-100"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </div>
          <div className="shrink-0">
            <Image
              src="/icons/temp_mascot.webp"
              alt="AWSSBG-UC mascot"
              width={160}
              height={160}
              className="drop-shadow-xl"
              priority
            />
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="mb-14">
        <SectionHeading>Who Can Join</SectionHeading>
        <div className="space-y-3">
          {ELIGIBILITY.map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#00e482]" />
              <p className="text-sm leading-relaxed text-neutral-300">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How to apply */}
      <section className="mb-14">
        <SectionHeading>How to Apply</SectionHeading>
        <div className="space-y-2">
          {STEPS.map((step, i) => (
            <div key={step.title} className="flex items-start gap-4 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#00e482]/10 text-xs font-bold text-[#00e482]">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-100">{step.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-400">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-14">
        <SectionHeading>Frequently Asked Questions</SectionHeading>
        <div className="space-y-3">
          {FAQS.map((f) => (
            <div key={f.q} className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
              <p className="text-sm font-semibold text-neutral-100">{f.q}</p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-400">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section>
        <blockquote className="rounded-xl border border-[#00e482]/20 bg-[#00e482]/10 px-6 py-5 text-center">
          <p className="text-sm font-medium leading-relaxed text-neutral-300">
            Ready to build with us?
          </p>
          <Link
            href="/signup"
            className="mt-4 inline-block rounded-full bg-[#00e482] px-6 py-2.5 text-sm font-semibold text-[#161d27] transition-opacity hover:opacity-90"
          >
            Create your account
          </Link>
        </blockquote>
      </section>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-5 text-xl font-bold tracking-tight text-neutral-50">
      {children}
    </h2>
  );
}
