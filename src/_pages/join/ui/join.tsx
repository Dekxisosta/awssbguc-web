import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Pixelify_Sans, Jersey_10 } from "next/font/google";
import { SOCIALS } from "@/src/shared/config/socials";

export const joinMetadata: Metadata = {
  title: "Join Us — AWSSBG-UC",
  description:
    "How to become a member of the AWS Student Builder Group — University of Cabuyao: eligibility, the application steps, and what happens after you register.",
};

/**
 * Join page in the pixel-art direction of the home page:
 * black ground, butter-yellow type, Jersey 10 headlines, stripe dividers, square corners, hard offset shadows.
 */

const pixel = Pixelify_Sans({ subsets: ["latin"], display: "swap" });
const jersey = Jersey_10({ subsets: ["latin"], weight: "400", display: "swap" });

// Headlines: set the class directly, since the element-level heading font in globals.css would otherwise win.
const hd = `${jersey.className} font-normal leading-[0.9] tracking-normal`;

const wrap = "mx-auto w-full max-w-page px-5 sm:px-8";
const focus = "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-teal";

const btnPrimary = `inline-block border-4 border-pix-butter bg-pix-butter px-6 py-3 text-lg text-black shadow-pixel-rust-4 transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pixel-rust-2 ${focus}`;
const btnGhost = `inline-block border-4 border-pix-teal px-6 py-3 text-lg transition-colors hover:bg-pix-teal hover:text-black ${focus}`;
const btnDark = `inline-block border-4 border-black bg-black px-10 py-4 text-xl text-pix-butter shadow-pixel-rust-4 transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pixel-rust-2 ${focus}`;

// ─── Content ──────────────────────────────────────────────────────────────────

const PERKS = [
  { label: "Free", note: "No membership fee" },
  { label: "Instant", note: "Member ID the moment you submit" },
  { label: "Open", note: "Any college, no experience needed" },
];

const ELIGIBILITY = [
  {
    title: "Enrolled",
    body: "Currently enrolled as an undergraduate or graduate student of the University of Cabuyao (Pamantasan ng Cabuyao).",
    border: "border-pix-teal",
  },
  {
    title: "Any college",
    body: "Open to all academic colleges and degree programs — not limited to Computing Studies.",
    border: "border-pix-mustard",
  },
  {
    title: "No experience",
    body: "No prior cloud computing, AI, or programming experience required.",
    border: "border-pix-green",
  },
];

const STEPS = [
  {
    title: "Create your account",
    body: "Sign up with your email and set a password. This gets you a personal dashboard — membership isn't required yet at this step.",
    shadow: "shadow-pixel-teal-6",
  },
  {
    title: "Fill out your membership details",
    body: "Head to Membership and enter your student number, full name, year level, program, and section. This information is self-reported by you.",
    shadow: "shadow-pixel-mustard-6",
  },
  {
    title: "Get your SBG member ID",
    body: "Submitting the form immediately generates your official SBG-UC-YYXXXX member ID and registers you in the member roster — no waiting period.",
    shadow: "shadow-pixel-rust-6",
  },
  {
    title: "Start participating",
    body: "Register for workshops and events, get your personal event QR code for attendance, and read the Constitution and By-Laws to see how the org runs.",
    shadow: "shadow-pixel-green-6",
  },
];

const FAQS = [
  {
    q: "Is there a membership fee?",
    a: "No. Membership in AWSSBG-UC is free for all eligible University of Cabuyao students.",
    border: "border-pix-teal",
  },
  {
    q: "Do I need an AWS account already?",
    a: "No. Cloud accounts, sandboxes, and learning resources are introduced as part of workshops and onboarding after you join.",
    border: "border-pix-mustard",
  },
  {
    q: "What if I make a mistake on my membership form?",
    a: `Contact an administrator through Discord or ${SOCIALS.email} and they can help correct your record.`,
    border: "border-pix-rust",
  },
  {
    q: "I already have an account — how do I register my membership?",
    a: "Sign in, then go to Membership from your profile menu and fill out the form there.",
    border: "border-pix-green",
  },
];

// ─── Pieces ───────────────────────────────────────────────────────────────────

function Stripes({ className = "h-4" }: { className?: string }) {
  return <div aria-hidden="true" className={`bg-stripes ${className}`} />;
}

function Section({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <>
      <Stripes />
      <section className={`${wrap} py-14 sm:py-20`}>
        <h2 className={`${hd} text-6xl sm:text-8xl`}>{title}</h2>
        {intro && <p className="mt-5 max-w-xl text-lg leading-relaxed">{intro}</p>}
        <div className="mt-10">{children}</div>
      </section>
    </>
  );
}

function Hero() {
  return (
    <section className={`${wrap} pb-14 pt-10 sm:pt-14`}>
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_400px] lg:gap-16">
        <div className="text-center lg:text-left">
          <p className="text-xl">Hi, future builder</p>
          <h1 className={`${hd} mt-3 text-[clamp(6rem,17vw,13rem)]`}>
            JOIN
            <br />
            US
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-xl leading-snug lg:mx-0">
            AWSSBG-UC is open to every currently enrolled University of Cabuyao student. Applying takes a few minutes and your
            membership is registered instantly — no waiting on approval.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <Link href="/signup" className={btnPrimary}>
              Create your account
            </Link>
            <Link href="/login" className={btnGhost}>
              Already a member? Sign in
            </Link>
          </div>
        </div>

        {/* Stripe tunnel: mascot on top, butter card with the three promises overlapping it */}
        <div className="relative mx-auto w-full max-w-[400px] pb-8">
          <div aria-hidden="true" className="absolute inset-0 bg-stripes clip-flare" />
          <div className="relative mx-auto w-[64%] border-4 border-black bg-black p-3 shadow-pixel-ink-6">
            <Image
              src="/icons/temp_mascot.webp"
              alt="AWSSBG-UC mascot"
              width={220}
              height={220}
              priority
              className="h-auto w-full"
            />
          </div>
          <div className="relative z-10 mx-auto -mt-5 w-[80%] bg-pix-butter p-5 text-black shadow-pixel-ink-6">
            <h2 className={`${hd} text-center text-4xl`}>Here&apos;s the deal</h2>
            <dl className="mt-4 space-y-3">
              {PERKS.map((p) => (
                <div key={p.label} className="flex items-baseline gap-3">
                  <dt className={`${hd} w-24 shrink-0 text-3xl`}>{p.label}</dt>
                  <dd className="text-sm leading-snug">{p.note}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

function Eligibility() {
  return (
    <Section title="Who can join?">
      <ul className="grid gap-6 md:grid-cols-3">
        {ELIGIBILITY.map((item, i) => (
          <li key={item.title} className={`border-4 ${item.border} p-5`}>
            <span className={`${hd} block text-6xl text-pix-butter/30`}>{String(i + 1).padStart(2, "0")}</span>
            <h3 className={`${hd} mt-4 text-4xl`}>{item.title}</h3>
            <p className="mt-3 leading-snug">{item.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Steps() {
  return (
    <Section title="How to apply" intro="Four steps from sign-up to your first workshop.">
      <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <li key={step.title} className={`bg-pix-butter p-5 text-black ${step.shadow}`}>
            <span className={`${hd} block text-8xl`}>{i + 1}</span>
            <h3 className={`${hd} mt-4 text-3xl`}>{step.title}</h3>
            <p className="mt-3 text-sm leading-snug">{step.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function Faq() {
  return (
    <Section title="Questions?">
      <div className="max-w-3xl space-y-5">
        {FAQS.map((f) => (
          <details key={f.q} className={`group border-4 ${f.border}`}>
            <summary
              className={`flex cursor-pointer list-none items-center justify-between gap-4 p-4 transition-colors hover:bg-pix-butter hover:text-black [&::-webkit-details-marker]:hidden ${focus}`}
            >
              <span className={`${hd} text-2xl sm:text-3xl`}>{f.q}</span>
              <span aria-hidden="true" className="relative h-5 w-5 shrink-0">
                <span className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-current" />
                <span className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-current transition-opacity group-open:opacity-0" />
              </span>
            </summary>
            <p className="px-4 pb-5 pt-1 leading-relaxed text-pix-butter/85">{f.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

function ClosingCta() {
  return (
    <>
      <Stripes />
      <section className="bg-pix-butter text-black">
        <div className={`${wrap} py-16 text-center sm:py-24`}>
          <h2 className={`${hd} text-[clamp(4rem,11vw,9rem)]`}>
            Ready to build
            <br />
            with us?
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-xl leading-snug">
            Make an account, fill in your details, and get your member ID in minutes.
          </p>
          <div className="mt-10">
            <Link href="/signup" className={btnDark}>
              Create your account
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JoinPage() {
  return (
    <div className={`${pixel.className} bg-black tracking-normal text-pix-butter`}>
      <Hero />
      <Eligibility />
      <Steps />
      <Faq />
      <ClosingCta />
    </div>
  );
}