"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  pixel,
  hd,
  wrap,
  focus,
  btnDark,
  Stripes,
  Section,
  SidePixels,
  PixelClouds,
} from "@/src/widgets/home-client";

/**
 * About page in the same pixel-art direction as the home page (see HomeClient):
 *  black ground, butter-yellow type, Jersey 10 headlines + Pixelify Sans text,
 *  stripe dividers, thick square borders with hard offset shadows, no blur / gradients / rounding.
 * Motion is limited to a short reveal on scroll, and is skipped when reduced motion is on.
 */

// ─── Data ────────────────────────────────────────────────────────────────────

const IDENTITY = [
  { label: "Type", value: "Academic student org", color: "#2c8f8f" },
  { label: "Domain", value: "Cloud · AI · Software", color: "#b89a0a" },
  { label: "Structure", value: "Startup-style governance", color: "#3aaa6e" },
];

const PILLARS = [
  {
    title: "Education & skill-building",
    body: "Workshops, bootcamps, certification prep, and hackathons centred on cloud computing, AI, and software development. Built for students, run by students.",
    icon: "/images/additional/wrench2.png",
    color: "#2c8f8f",
  },
  {
    title: "Community & civic outreach",
    body: "Digital literacy drives and ethical-AI awareness sessions reaching LGUs, schools, and underserved communities around Cabuyao and beyond.",
    icon: "/images/additional/community.png",
    color: "#b89a0a",
  },
  {
    title: "Student governance",
    body: "A four-tier leadership structure with C-suite titles, KPI reviews, and dual-signatory financial controls.",
    icon: "/images/additional/key2.png",
    color: "#b32a0e",
  },
  {
    title: "Institutional recognition",
    body: "Chartered under the University of Cabuyao's Student Affairs and Services Department (SASD), supervised by a Faculty Adviser and the Student Organization Accreditation Office (SOAO).",
    icon: "/images/additional/trophy2.png",
    color: "#3aaa6e",
  },
];

const ORG_TIERS = [
  {
    tier: "Executive Board",
    roles: [
      "Chief Executive Officer",
      "Chief Operating Officer",
      "Chief Financial Officer",
      "Chief Marketing Officer",
      "Chief Relations Officer",
      "Chief Technology Officer",
    ],
    color: "#b32a0e",
    indent: "",
  },
  {
    tier: "Directors",
    roles: ["Directorate layer overseeing each executive portfolio"],
    color: "#b89a0a",
    indent: "lg:ml-[6%]",
  },
  {
    tier: "Leads",
    roles: ["Team leads managing programme and project execution"],
    color: "#3aaa6e",
    indent: "lg:ml-[12%]",
  },
  {
    tier: "Technical Working Group",
    roles: ["Specialist contributors and project implementers"],
    color: "#2c8f8f",
    indent: "lg:ml-[18%]",
  },
];

const AFFILIATIONS = [
  {
    tag: "Global",
    name: "AWS Builder Center",
    desc: "Globally recognised chapter under Amazon Web Services' student community network.",
    color: "#2c8f8f",
  },
  {
    tag: "National",
    name: "AWS Student User Group Philippines",
    desc: "National coordination body for AWS student chapters across the Philippines.",
    color: "#b89a0a",
  },
  {
    tag: "Professional",
    name: "AWS User Group Philippines (AWSUGPH)",
    desc: "Professional community tie-in connecting student members to industry practitioners.",
    color: "#3aaa6e",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Short reveal when scrolled into view. No-op under reduced motion. */
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35, delay, ease: "linear" }}
    >
      {children}
    </motion.div>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className={`${wrap} pb-14 pt-10 sm:pb-20 sm:pt-14`}>
      <div className="grid items-center gap-10 md:grid-cols-[1fr_auto] md:gap-14">
        <div>
          <p className="text-xl">About us</p>
          <h1 className={`${hd} mt-3 text-[clamp(4.5rem,11vw,9rem)]`}>
            What is
            <br />
            AWSSBG-UC?
          </h1>
          <p className="mt-6 max-w-2xl text-2xl leading-snug">
            The AWS Student Builder Group of the University of Cabuyao is a university-chartered, AWS-affiliated student tech
            organisation. It runs like a startup, but it is a non-profit student club under institutional oversight.
          </p>
        </div>

        {/* Duck engineer in front, mascot behind at the upper right (same stack as the home page). */}
        <div className="relative mx-auto w-44 sm:w-52 lg:w-64">
          <Image
            src="/icons/temp_mascot.webp"
            alt="AWSSBG-UC mascot"
            width={220}
            height={220}
            priority
            className="absolute -right-4 top-0 z-0 h-auto w-3/5 sm:-right-8"
          />
          <Image
            src="/images/additional/duck-engineer.svg"
            alt="Pixel-art engineer duck with a hard hat, laptop and coffee"
            width={368}
            height={472}
            unoptimized
            className="relative z-10 h-auto w-full [image-rendering:pixelated]"
          />
        </div>
      </div>

      <dl className="mt-14 grid gap-6 sm:grid-cols-3">
        {IDENTITY.map((c) => (
          <div
            key={c.label}
            className="border-4 bg-black p-5"
            style={{ borderColor: c.color, boxShadow: `6px 6px 0 ${c.color}` }}
          >
            <dt className="text-sm uppercase tracking-wider text-[#fff7a1]/70">{c.label}</dt>
            <dd className={`${hd} mt-2 text-4xl`}>{c.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// ─── Pillars ─────────────────────────────────────────────────────────────────

function Pillars() {
  return (
    <Section
      title="Four pillars, one mission"
      intro="Everything we do maps back to education, outreach, governance, or institutional growth, with AWS cloud technology as the common thread."
    >
      <ul className="grid gap-6 sm:grid-cols-2">
        {PILLARS.map((p, i) => (
          <li key={p.title}>
            <Reveal delay={i * 0.06} className="h-full">
              <div className="h-full border-4 p-6" style={{ borderColor: p.color }}>
                <Image src={p.icon} alt="" width={48} height={48} className="h-12 w-12 object-contain" />
                <h3 className={`${hd} mt-6 text-4xl`}>{p.title}</h3>
                <p className="mt-3 text-lg leading-snug">{p.body}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}

// ─── Org structure ───────────────────────────────────────────────────────────

function Structure() {
  return (
    <Section
      title="Structured like a startup"
      intro="We use C-suite titles instead of the usual President / VP model: a deliberate startup feel for a non-profit academic body."
    >
      <ol className="space-y-6">
        {ORG_TIERS.map((t, i) => (
          <li key={t.tier} className={t.indent}>
            <Reveal delay={i * 0.06}>
              <div
                className="flex items-start gap-5 border-4 bg-black p-5"
                style={{ borderColor: t.color, boxShadow: `6px 6px 0 ${t.color}` }}
              >
                <span
                  aria-hidden="true"
                  className={`${hd} flex h-14 w-14 shrink-0 items-center justify-center text-4xl text-black`}
                  style={{ background: t.color }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <h3 className={`${hd} text-4xl`}>{t.tier}</h3>
                  {t.roles.length > 1 ? (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {t.roles.map((r) => (
                        <li key={r} className="border-2 border-[#fff7a1]/60 px-2 py-0.5 text-sm">
                          {r}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-lg leading-snug">{t.roles[0]}</p>
                  )}
                </div>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
}

// ─── Affiliations ────────────────────────────────────────────────────────────

function Affiliations() {
  return (
    <Section
      title="Part of something bigger"
      intro="We sit inside a layered ecosystem, from campus to country to the global AWS community network."
    >
      <ul className="grid gap-8 sm:grid-cols-3">
        {AFFILIATIONS.map((a, i) => (
          <li key={a.name}>
            <Reveal delay={i * 0.06} className="h-full">
              <div
                className="h-full border-4 bg-[#fff7a1] p-5 text-black"
                style={{ borderColor: a.color, boxShadow: `6px 6px 0 ${a.color}` }}
              >
                <span className="inline-block bg-black px-2 py-0.5 text-sm uppercase tracking-wider text-[#fff7a1]">
                  {a.tag}
                </span>
                <h3 className={`${hd} mt-4 text-3xl`}>{a.name}</h3>
                <p className="mt-3 leading-snug">{a.desc}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}

// ─── Mission + CTA ───────────────────────────────────────────────────────────

function Mission() {
  const reduce = useReducedMotion();
  return (
    <>
      <Stripes className="h-4" />
      <section className="bg-[#fff7a1] text-black">
        <div className={`${wrap} py-16 sm:py-24`}>
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto] lg:gap-8">
            <div>
              <p className="text-xl">Mission &amp; vision</p>
              <h2 className={`${hd} mt-3 text-[clamp(4.5rem,10vw,9rem)]`}>What we stand for</h2>

              <blockquote className="mt-10 max-w-2xl border-4 border-black bg-black p-6 text-[#fff7a1] shadow-[6px_6px_0_#b32a0e] sm:p-8">
                <p className="text-xl leading-snug sm:text-2xl">
                  &ldquo;To cultivate a generation of cloud-literate, socially responsible tech leaders from the University of
                  Cabuyao, empowered by AWS technologies and a community-first mindset.&rdquo;
                </p>
                <footer className="mt-4 text-[#2cf57f]">AWSSBG-UC, Mission &amp; Vision</footer>
              </blockquote>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/signup" className={`${btnDark} px-10 py-4 text-xl`}>
                  Join now, it&apos;s free
                </Link>
                <Link
                  href="/events"
                  className={`inline-block border-4 border-black px-8 py-3.5 text-xl transition-colors hover:bg-black hover:text-[#fff7a1] ${focus}`}
                >
                  See upcoming events
                </Link>
                <Link href="/constitution" className={`self-center underline underline-offset-4 text-lg ${focus}`}>
                  Read the constitution
                </Link>
              </div>
            </div>

            <motion.div
              aria-hidden="true"
              className="mx-auto lg:mt-0"
              animate={reduce ? undefined : { y: [0, -4, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src="/images/additional/duck-engineer.svg"
                alt=""
                width={368}
                height={472}
                unoptimized
                className="h-auto w-48 [image-rendering:pixelated] sm:w-60 lg:w-72"
              />
            </motion.div>
          </div>
        </div>
      </section>
      <Stripes className="h-4" />
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AboutClient() {
  return (
    <div className={`${pixel.className} relative isolate bg-black tracking-normal text-[#fff7a1]`}>
      <PixelClouds />
      <SidePixels side="left" />
      <SidePixels side="right" />
      <div className="relative z-10">
        <Hero />
        <Pillars />
        <Structure />
        <Affiliations />
        <Mission />
      </div>
    </div>
  );
}
