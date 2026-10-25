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

const STRIPES: [string, number][] = [
  ["#b32a0e", 8], ["#b89a0a", 10], ["#000000", 3], ["#3aaa6e", 14], ["#b32a0e", 9], ["#000000", 3],
  ["#b89a0a", 8], ["#2c8f8f", 12], ["#3aaa6e", 9], ["#000000", 3], ["#b32a0e", 11], ["#b89a0a", 10],
];
const STRIPE_BG = (() => {
  let at = 0;
  const stops = STRIPES.map(([c, w]) => {
    const s = `${c} ${at}% ${at + w}%`;
    at += w;
    return s;
  });
  return `linear-gradient(90deg, ${stops.join(", ")})`;
})();

// Narrow column that widens into a stepped base (same shape as the home hero).
const FLARE =
  "polygon(12% 0, 88% 0, 88% 58%, 92% 58%, 92% 70%, 96% 70%, 96% 82%, 100% 82%, 100% 100%, 0 100%, 0 82%, 4% 82%, 4% 70%, 8% 70%, 8% 58%, 12% 58%)";

const wrap = "mx-auto w-full max-w-[1300px] px-5 sm:px-8";
const focus = "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#2c8f8f]";

const btnPrimary = `inline-block border-4 border-[#fff7a1] bg-[#fff7a1] px-6 py-3 text-lg text-black shadow-[4px_4px_0_#b32a0e] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#b32a0e] ${focus}`;
const btnGhost = `inline-block border-4 border-[#2c8f8f] px-6 py-3 text-lg transition-colors hover:bg-[#2c8f8f] hover:text-black ${focus}`;
const btnDark = `inline-block border-4 border-black bg-black px-10 py-4 text-xl text-[#fff7a1] shadow-[4px_4px_0_#b32a0e] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#b32a0e] ${focus}`;

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
    border: "border-[#2c8f8f]",
  },
  {
    title: "Any college",
    body: "Open to all academic colleges and degree programs — not limited to Computing Studies.",
    border: "border-[#b89a0a]",
  },
  {
    title: "No experience",
    body: "No prior cloud computing, AI, or programming experience required.",
    border: "border-[#3aaa6e]",
  },
];

const STEPS = [
  {
    title: "Create your account",
    body: "Sign up with your email and set a password. This gets you a personal dashboard — membership isn't required yet at this step.",
    shadow: "shadow-[6px_6px_0_#2c8f8f]",
  },
  {
    title: "Fill out your membership details",
    body: "Head to Membership and enter your student number, full name, year level, program, and section. This information is self-reported by you.",
    shadow: "shadow-[6px_6px_0_#b89a0a]",
  },
  {
    title: "Get your SBG member ID",
    body: "Submitting the form immediately generates your official SBG-UC-YYXXXX member ID and registers you in the member roster — no waiting period.",
    shadow: "shadow-[6px_6px_0_#b32a0e]",
  },
  {
    title: "Start participating",
    body: "Register for workshops and events, get your personal event QR code for attendance, and read the Constitution and By-Laws to see how the org runs.",
    shadow: "shadow-[6px_6px_0_#3aaa6e]",
  },
];

const FAQS = [
  {
    q: "Is there a membership fee?",
    a: "No. Membership in AWSSBG-UC is free for all eligible University of Cabuyao students.",
    border: "border-[#2c8f8f]",
  },
  {
    q: "Do I need an AWS account already?",
    a: "No. Cloud accounts, sandboxes, and learning resources are introduced as part of workshops and onboarding after you join.",
    border: "border-[#b89a0a]",
  },
  {
    q: "What if I make a mistake on my membership form?",
    a: `Contact an administrator through Discord or ${SOCIALS.email} and they can help correct your record.`,
    border: "border-[#b32a0e]",
  },
  {
    q: "I already have an account — how do I register my membership?",
    a: "Sign in, then go to Membership from your profile menu and fill out the form there.",
    border: "border-[#3aaa6e]",
  },
];

// ─── Pieces ───────────────────────────────────────────────────────────────────

function Stripes({ className = "h-4" }: { className?: string }) {
  return <div aria-hidden="true" className={className} style={{ background: STRIPE_BG }} />;
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
          <div aria-hidden="true" className="absolute inset-0" style={{ background: STRIPE_BG, clipPath: FLARE }} />
          <div className="relative mx-auto w-[64%] border-4 border-black bg-black p-3 shadow-[6px_6px_0_#000]">
            <Image
              src="/icons/temp_mascot.webp"
              alt="AWSSBG-UC mascot"
              width={220}
              height={220}
              priority
              className="h-auto w-full"
            />
          </div>
          <div className="relative z-10 mx-auto -mt-5 w-[80%] bg-[#fff7a1] p-5 text-black shadow-[6px_6px_0_#000]">
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
            <span className={`${hd} block text-6xl text-[#fff7a1]/30`}>{String(i + 1).padStart(2, "0")}</span>
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
          <li key={step.title} className={`bg-[#fff7a1] p-5 text-black ${step.shadow}`}>
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
              className={`flex cursor-pointer list-none items-center justify-between gap-4 p-4 transition-colors hover:bg-[#fff7a1] hover:text-black [&::-webkit-details-marker]:hidden ${focus}`}
            >
              <span className={`${hd} text-2xl sm:text-3xl`}>{f.q}</span>
              <span aria-hidden="true" className="relative h-5 w-5 shrink-0">
                <span className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-current" />
                <span className="absolute left-1/2 top-0 h-full w-1 -translate-x-1/2 bg-current transition-opacity group-open:opacity-0" />
              </span>
            </summary>
            <p className="px-4 pb-5 pt-1 leading-relaxed text-[#fff7a1]/85">{f.a}</p>
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
      <section className="bg-[#fff7a1] text-black">
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
    <div className={`${pixel.className} bg-black tracking-normal text-[#fff7a1]`}>
      <Hero />
      <Eligibility />
      <Steps />
      <Faq />
      <ClosingCta />
    </div>
  );
}