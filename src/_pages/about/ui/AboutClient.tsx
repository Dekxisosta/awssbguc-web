"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";

// ─── Animation primitives (mirrored from HomeClient) ────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
};

const stagger = (delayChildren = 0.05) => ({
  hidden: {},
  show: { transition: { staggerChildren: delayChildren } },
});

const viewport = { once: true, margin: "-60px" };

// ─── Shared layout primitives ────────────────────────────────────────────────

function ParallaxSection({
  children,
  className = "",
  accentBehind,
}: {
  children: (params: { headingY: MotionValue<string>; bodyY: MotionValue<string> }) => React.ReactNode;
  className?: string;
  accentBehind?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const headingY = useTransform<number, string>(scrollYProgress, [0, 1], ["18px", "-18px"]);
  const bodyY    = useTransform<number, string>(scrollYProgress, [0, 1], ["10px", "-10px"]);
  const accentY  = useTransform<number, string>(scrollYProgress, [0, 1], ["-24px", "24px"]);

  return (
    <div ref={ref} className={`relative flex flex-col overflow-hidden ${className}`}>
      {accentBehind && (
        <motion.div aria-hidden="true" style={{ y: accentY }} className="pointer-events-none absolute inset-0">
          {accentBehind}
        </motion.div>
      )}
      <div className="flex flex-1 flex-col justify-center">
        {children({ headingY, bodyY })}
      </div>
    </div>
  );
}

function EyebrowLabel({ children }: { children: React.ReactNode }) {
  return (
    <motion.p variants={fadeUp} className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#00e482]">
      {children}
    </motion.p>
  );
}

function SectionHeading({
  children,
  y,
  light = false,
}: {
  children: React.ReactNode;
  y: MotionValue<string>;
  light?: boolean;
}) {
  return (
    <motion.h2
      variants={fadeUp}
      style={{ y }}
      className={`text-3xl font-bold tracking-tight sm:text-4xl ${light ? "text-neutral-900" : "text-neutral-100"}`}
    >
      {children}
    </motion.h2>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────

const PILLARS = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
    title: "Education & Skill-Building",
    body: "Workshops, bootcamps, certification prep, and hackathons centred on cloud computing, AI, and software development — built for students, run by students.",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20A14.5 14.5 0 0 0 12 2" />
        <path d="M2 12h20" />
      </svg>
    ),
    title: "Community & Civic Outreach",
    body: "Digital literacy drives and ethical-AI awareness sessions reaching LGUs, schools, and underserved communities around Cabuyao and beyond.",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Student Governance",
    body: "A four-tier leadership structure — Executive Board, Directors, Leads, and Technical Working Group — with C-suite titles, KPI reviews, and dual-signatory financial controls.",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Institutional Recognition",
    body: "Chartered under the University of Cabuyao's Student Affairs and Services Department (SASD) and supervised by a Faculty Adviser and the Student Organization Accreditation Office (SOAO).",
  },
];

const ORG_TIERS = [
  {
    tier: "Executive Board",
    roles: ["Chief Executive Officer", "Chief Operating Officer", "Chief Financial Officer", "Chief Marketing Officer", "Chief Relations Officer", "Chief Technology Officer"],
  },
  { tier: "Directors",              roles: ["Directorate layer overseeing each executive portfolio"] },
  { tier: "Leads",                  roles: ["Team leads managing programme and project execution"] },
  { tier: "Technical Working Group",roles: ["Specialist contributors and project implementers"] },
];

const AFFILIATIONS = [
  { name: "AWS Builder Center",                    desc: "Globally recognised chapter under Amazon Web Services' student community network." },
  { name: "AWS Student User Group Philippines",    desc: "National coordination body for AWS student chapters across the Philippines." },
  { name: "AWS User Group Philippines (AWSUGPH)", desc: "Professional community tie-in connecting student members to industry practitioners." },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AboutClient() {
  return (
    <div>

      {/* ── Hero — DARK ──────────────────────────────────────────────────── */}
      <ParallaxSection
        className="border-b border-neutral-800 bg-[#0d1117] min-h-[55vh]"
        accentBehind={
          <>
            <div className="absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-[#00e482]/6 blur-3xl" />
            <div className="absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-[#00e482]/4 blur-3xl" />
          </>
        }
      >
        {({ headingY, bodyY }) => (
          <div className="mx-auto max-w-5xl px-6 py-24">
            <motion.div
              className="flex flex-col items-start gap-10 sm:flex-row sm:items-center sm:justify-between"
              variants={stagger(0.1)}
              initial="hidden"
              animate="show"
            >
              <div className="max-w-2xl">
                <EyebrowLabel>About Us</EyebrowLabel>
                <motion.h1
                  variants={fadeUp}
                  style={{ y: headingY }}
                  className="text-4xl font-extrabold tracking-tight text-neutral-50 sm:text-5xl lg:text-6xl"
                >
                  What is{" "}
                  <span className="text-[#00e482]">AWSSBG-UC?</span>
                </motion.h1>
                <motion.p variants={fadeUp} style={{ y: bodyY }} className="mt-6 text-lg leading-relaxed text-neutral-400">
                  AWS Student Builder Group — University of Cabuyao is a university-chartered, AWS-affiliated student tech organisation structured like a startup, but legally a non-profit student club under institutional oversight.
                </motion.p>
              </div>

              <motion.div variants={fadeIn} className="shrink-0 self-center">
                <Image
                  src="/icons/temp_mascot.webp"
                  alt="AWSSBG-UC mascot"
                  width={200}
                  height={200}
                  className="drop-shadow-2xl"
                  priority
                />
              </motion.div>
            </motion.div>

            {/* Identity cards */}
            <motion.div
              className="mt-14 grid gap-3 sm:grid-cols-3"
              variants={stagger(0.08)}
              initial="hidden"
              whileInView="show"
              viewport={viewport}
            >
              {[
                { label: "Type",      value: "Academic Student Org"      },
                { label: "Domain",    value: "Cloud · AI · Software"     },
                { label: "Structure", value: "Startup-style Governance"  },
              ].map(({ label, value }) => (
                <motion.div
                  key={label}
                  variants={fadeUp}
                  className="border border-neutral-800 bg-neutral-900/60 p-5 text-center"
                >
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-neutral-500">{label}</p>
                  <p className="text-sm font-semibold text-neutral-100">{value}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </ParallaxSection>

      {/* ── What We Do — LIGHT ───────────────────────────────────────────── */}
      <ParallaxSection
        className="border-b border-neutral-200 bg-white"
        accentBehind={
          <div className="absolute -right-20 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-[#00e482]/7 blur-3xl" />
        }
      >
        {({ headingY }) => (
          <div className="mx-auto max-w-5xl px-6 py-24">
            <motion.div variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={viewport}>
              <EyebrowLabel>What We Do</EyebrowLabel>
              <SectionHeading y={headingY} light>
                Four pillars, one mission.
              </SectionHeading>
              <motion.p variants={fadeUp} className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-600">
                Everything AWSSBG-UC does maps back to education, outreach, governance, or institutional growth — with AWS cloud technology as the common thread.
              </motion.p>

              <motion.div className="mt-10 grid gap-5 sm:grid-cols-2" variants={stagger(0.1)}>
                {PILLARS.map(({ icon, title, body }) => (
                  <motion.div
                    key={title}
                    variants={fadeUp}
                    whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                    className="border border-neutral-200 bg-neutral-50 p-6 shadow-md shadow-neutral-200/80 transition-shadow hover:shadow-lg hover:shadow-neutral-300/60"
                  >
                    <div className="mb-3 flex h-9 w-9 items-center justify-center bg-[#00e482]/10 text-[#00e482]">
                      {icon}
                    </div>
                    <p className="text-base font-semibold text-neutral-900">{title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-500">{body}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        )}
      </ParallaxSection>

      {/* ── Org Structure — DARK ─────────────────────────────────────────── */}
      <ParallaxSection
        className="border-b border-neutral-800 bg-neutral-900"
        accentBehind={
          <>
            <div className="absolute -left-16 top-0 h-64 w-64 rounded-full bg-[#00e482]/5 blur-3xl" />
            {/* watermark */}
            <div className="pointer-events-none absolute -bottom-4 right-4 opacity-[0.03] select-none" aria-hidden="true">
              <svg viewBox="0 0 500 160" xmlns="http://www.w3.org/2000/svg" className="w-[380px] -rotate-6">
                <text x="0" y="75%" fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="900" fontSize="160" letterSpacing="-6" fill="#00e482">
                  ORG
                </text>
              </svg>
            </div>
          </>
        }
      >
        {({ headingY }) => (
          <div className="mx-auto max-w-5xl px-6 py-24">
            <motion.div variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={viewport}>
              <EyebrowLabel>Organisational Structure</EyebrowLabel>
              <SectionHeading y={headingY}>Structured like a startup.</SectionHeading>
              <motion.p variants={fadeUp} className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-400">
                AWSSBG-UC uses C-suite titles instead of the traditional President / VP model — giving it a deliberate startup feel despite being a non-profit academic body.
              </motion.p>

              <motion.div className="mt-10 space-y-3" variants={stagger(0.1)}>
                {ORG_TIERS.map(({ tier, roles }, i) => (
                  <motion.div
                    key={tier}
                    variants={fadeUp}
                    whileHover={{ x: 4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                    className="flex items-start gap-4 border border-neutral-800 bg-neutral-900/60 p-5 transition-colors hover:border-neutral-700"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-[#00e482]/10 text-xs font-bold text-[#00e482]">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-100">{tier}</p>
                      <p className="mt-1 text-xs leading-relaxed text-neutral-400">{roles.join(" · ")}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        )}
      </ParallaxSection>

      {/* ── Affiliations — LIGHT ─────────────────────────────────────────── */}
      <ParallaxSection
        className="border-b border-neutral-200 bg-white"
        accentBehind={
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00e482]/5 blur-3xl" />
        }
      >
        {({ headingY }) => (
          <div className="mx-auto max-w-5xl px-6 py-24">
            <motion.div variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={viewport}>
              <EyebrowLabel>Affiliations</EyebrowLabel>
              <SectionHeading y={headingY} light>Part of something bigger.</SectionHeading>
              <motion.p variants={fadeUp} className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-600">
                AWSSBG-UC sits inside a layered ecosystem — from campus to country to the global AWS community network.
              </motion.p>

              <motion.div className="mt-10 grid gap-5 sm:grid-cols-3" variants={stagger(0.1)}>
                {AFFILIATIONS.map(({ name, desc }) => (
                  <motion.div
                    key={name}
                    variants={fadeUp}
                    whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                    className="border border-neutral-200 bg-neutral-50 p-6 shadow-md shadow-neutral-200/80 transition-shadow hover:shadow-lg hover:shadow-neutral-300/60"
                  >
                    <div className="mb-3 h-2 w-2 bg-[#00e482]" />
                    <p className="text-sm font-semibold text-neutral-900">{name}</p>
                    <p className="mt-2 text-xs leading-relaxed text-neutral-500">{desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        )}
      </ParallaxSection>

      {/* ── Mission — DARK, CTA ──────────────────────────────────────────── */}
      <ParallaxSection
        className="bg-neutral-900"
        accentBehind={
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -left-20 bottom-0 h-[500px] w-[500px] rounded-full bg-[#00e482]/6 blur-3xl" />
            <div className="absolute -right-20 top-0 h-[400px] w-[400px] rounded-full bg-[#00e482]/4 blur-3xl" />
          </div>
        }
      >
        {({ headingY }) => (
          <div className="mx-auto max-w-4xl px-6 py-24 text-center">
            <motion.div variants={stagger(0.09)} initial="hidden" whileInView="show" viewport={viewport}>
              <EyebrowLabel>Mission &amp; Vision</EyebrowLabel>
              <SectionHeading y={headingY}>
                What we stand for.
              </SectionHeading>

              <motion.blockquote
                variants={fadeUp}
                className="mx-auto mt-10 max-w-2xl border border-[#00e482]/20 bg-[#00e482]/5 px-8 py-7 text-left"
              >
                <p className="text-base font-medium italic leading-relaxed text-neutral-300">
                  &quot;To cultivate a generation of cloud-literate, socially responsible tech leaders from the University of Cabuyao — empowered by AWS technologies and a community-first mindset.&quot;
                </p>
                <footer className="mt-4 text-xs font-semibold text-[#00e482]">
                  AWSSBG-UC — Mission &amp; Vision
                </footer>
              </motion.blockquote>

              <motion.div variants={fadeUp} className="mt-12 flex flex-wrap justify-center gap-4">
                <Link
                  href="/join"
                  className="border border-[#00e482] bg-[#00e482] px-10 py-3.5 text-base font-bold text-[#0f1923] transition-opacity hover:opacity-90"
                >
                  Join now — it&apos;s free
                </Link>
                <Link
                  href="/events"
                  className="border border-neutral-700 px-8 py-3.5 text-base font-semibold text-neutral-300 transition-colors hover:border-neutral-500 hover:text-neutral-100"
                >
                  See upcoming events
                </Link>
              </motion.div>
            </motion.div>
          </div>
        )}
      </ParallaxSection>

    </div>
  );
}
