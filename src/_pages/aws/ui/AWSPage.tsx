"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pixelify_Sans, Jersey_10 } from "next/font/google";
import { motion, useReducedMotion } from "framer-motion";
import { SidePixels, PixelClouds, PixelPhoto } from "@/src/widgets/home-client";
import { colors } from "@/tailwind.tokens";

/**
 * /aws in the pixel-art style of the home page:
 *  black ground, butter-yellow type, Jersey 10 headlines, Pixelify Sans text,
 *  the stripe "tunnel" as dividers, thick square borders and hard offset shadows.
 */

const pixel = Pixelify_Sans({ subsets: ["latin"], display: "swap" });
const jersey = Jersey_10({ subsets: ["latin"], weight: "400", display: "swap" });
const hd = `${jersey.className} font-normal leading-[0.9] tracking-normal`;

const wrap = "mx-auto w-full max-w-page px-5 sm:px-8";
const focus = "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-teal";
const btnDark = `inline-block border-4 border-black bg-black px-6 py-3 text-lg text-pix-butter shadow-pixel-rust-4 transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pixel-rust-2 ${focus}`;

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

// ─── Data ────────────────────────────────────────────────────────────────────

const MAJOR_SPONSOR = { name: "TutorialsDojo", logo: "/images/logos/tutorials-dojo.png", href: "https://tutorialsdojo.com/" };
const BROUGHT_BY = { name: "BayanHealth", logo: "/images/logos/bayanhealth.png", href: "https://bayanhealth.com/" };

const COMMUNITY_PARTNERS = [
  { name: "DEVCON Laguna Chapter", logo: "/images/logos/devcon-laguna.png", circle: false },
  { name: "Association of Computer Science Students - UC", logo: "/images/logos/acss-uc.png", circle: false },
  { name: "Society of Information Technology Students - UC", logo: "/images/logos/sits-uc.png", circle: false },
  { name: "Junior Mechatronics and Robotics Society of the Philippines - UC Chapter", logo: "/images/logos/jmrsp-uc.png", circle: false },
  { name: "Junior Institute of Electronics Engineers of the Philippines - UC", logo: "/images/logos/jieep-uc.png", circle: false },
  { name: "Association of Computer Engineering Students - UC", logo: "/images/logos/aces-uc.png", circle: false },
  { name: "AWS Learning Club - Polar", logo: "/images/logos/awslc-polar.png", circle: true },
  { name: "AWS Student Builder Group - Aeris", logo: "/images/logos/awssbg-aeris.png", circle: true },
  { name: "AWS Student User Group Philippines", logo: "/images/logos/awsug-ph.png", circle: true },
];

const FREE_RESOURCES = [
  {
    label: "Builder Labs",
    image: "/images/hero/builder_labs.png",
    href: "https://builder.aws.com/start?trk=9f01212c-9819-4534-ad0a-4c5e491af39a&sc_channel=el",
    desc: "Guided, hands-on labs in a live AWS environment. No setup, no cost. Just build.",
    items: ["Real AWS console access", "Step-by-step guidance", "No credit card required"],
    tag: "Hands-on labs",
  },
  {
    label: "Builder Center",
    image: "/images/hero/builder_center.jpg",
    href: "https://builder.aws.com/start?trk=9f01212c-9819-4534-ad0a-4c5e491af39a&sc_channel=el",
    desc: "Your personal AWS learning hub: tracks, challenges, and curated content in one place.",
    items: ["Personalized learning paths", "Challenges & quests", "Community-driven content"],
    tag: "Learning hub",
  },
  {
    label: "Workshops",
    image: "/images/hero/workshops.png",
    href: "https://workshops.aws/",
    desc: "Self-paced workshop content built by AWS engineers covering every major service.",
    items: ["Serverless & containers", "ML & AI applications", "Security & DevOps"],
    tag: "Self-paced",
  },
  {
    label: "Project Hub",
    image: "/images/hero/projects.jpg",
    href: "https://aws.amazon.com/getting-started/hands-on/",
    desc: "End-to-end project tutorials: build a website, an API, a chatbot, and more.",
    items: ["Host a static website", "Deploy a REST API", "Build a serverless app"],
    tag: "Guided projects",
  },
  {
    label: "Skill Builder",
    image: "/images/hero/skill_builder.jpg",
    href: "https://skillbuilder.aws/",
    desc: "600+ free digital courses from AWS experts covering every service and domain.",
    items: ["Free digital courses", "Role-based learning", "Exam prep & practice"],
    tag: "Courses",
  },
  {
    label: "AWS Free Tier",
    image: "/images/hero/free_tier.jpg",
    href: "https://aws.amazon.com/free/",
    desc: "Try 100+ AWS products for free, with limits designed for learning and experimenting.",
    items: ["Always-free services", "12-month free usage", "No upfront commitment"],
    tag: "Free tier",
  },
  {
    label: "Certifications",
    image: "/images/hero/certifications.webp",
    href: "https://aws.amazon.com/certification/",
    desc: "Industry-recognized credentials that validate your AWS skills for any job market.",
    items: ["Foundational to specialty", "Practice exams available", "Global recognition"],
    tag: "Credentials",
  },
  {
    label: "Documentation",
    image: "/images/hero/documentation.jpg",
    href: "https://docs.aws.amazon.com/",
    desc: "The authoritative reference for every AWS service: guides, API docs, and tutorials.",
    items: ["All 200+ services covered", "Code examples included", "Updated continuously"],
    tag: "Reference",
  },
  {
    label: "Kiro",
    image: "/images/hero/kiro.jpg",
    href: "https://kiro.dev/",
    desc: "An AI-powered IDE built on VS Code that writes code alongside you, built with AWS.",
    items: ["AI agent coding", "Spec-driven development", "Free to get started"],
    tag: "AI IDE",
  },
];

// Each card cycles through the stripe palette.
const TONES = [
  { border: "border-pix-teal", shadow: "shadow-pixel-teal-6 hover:shadow-pixel-teal-3", bg: "bg-pix-teal", text: "text-black" },
  { border: "border-pix-mustard", shadow: "shadow-pixel-mustard-6 hover:shadow-pixel-mustard-3", bg: "bg-pix-mustard", text: "text-black" },
  { border: "border-pix-rust", shadow: "shadow-pixel-rust-6 hover:shadow-pixel-rust-3", bg: "bg-pix-rust", text: "text-pix-butter" },
  { border: "border-pix-green", shadow: "shadow-pixel-green-6 hover:shadow-pixel-green-3", bg: "bg-pix-green", text: "text-black" },
];

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className={`${wrap} pb-14 pt-10 sm:pt-14`}>
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xl">100% free, no credit card</p>
          <h1 className={`${hd} mt-3 text-[clamp(5rem,13vw,10rem)]`}>
            Build real
            <br />
            things.
          </h1>
          <p className="mt-6 max-w-xl text-xl leading-snug">
            AWS gives students hands-on labs, guided workshops, and project starters that run in real cloud
            environments, all at zero cost. Pick one below and start building today.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a href="#resources" className={btnDark}>
              Browse resources
            </a>
            <Link
              href="/events"
              className={`inline-block border-4 border-pix-butter px-6 py-3 text-lg transition-colors hover:bg-pix-butter hover:text-black ${focus}`}
            >
              See upcoming events
            </Link>
          </div>
        </div>

        {/* Butter card with the headline numbers, echoing the home hero card. */}
        <div className="relative mx-auto w-full max-w-[340px] bg-pix-butter p-6 text-center text-black shadow-pixel-teal-8">
          <dl className="grid grid-cols-2 gap-4">
            {[
              { v: "9", l: "free resources" },
              { v: "600+", l: "free courses" },
              { v: "100+", l: "free tier products" },
              { v: "$0", l: "to get started" },
            ].map((s) => (
              <div key={s.l}>
                <dd className={`${hd} text-5xl tabular-nums`}>{s.v}</dd>
                <dt className="mt-1 text-xs leading-tight">{s.l}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

// ─── Resource card ───────────────────────────────────────────────────────────

function ResourceCard({ r, tone, index }: { r: (typeof FREE_RESOURCES)[number]; tone: (typeof TONES)[number]; index: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, delay: (index % 3) * 0.06 }}
      className="flex"
    >
      <a
        href={r.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`group flex w-full flex-col border-4 ${tone.border} bg-black p-4 transition-all hover:translate-x-[3px] hover:translate-y-[3px] ${tone.shadow} ${focus}`}
      >
        <div className={`relative border-4 ${tone.border} bg-black`}>
          <PixelPhoto src={r.image} width={64} height={36} />
          <span className={`absolute bottom-0 left-0 px-2 py-0.5 text-xs uppercase ${tone.bg} ${tone.text}`}>{r.tag}</span>
        </div>

        <div className="mt-5 flex items-start justify-between gap-3">
          <h3 className={`${hd} text-4xl`}>{r.label}</h3>
          <span aria-hidden="true" className="mt-1 text-xl opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            ↗
          </span>
        </div>
        <p className="mt-2 leading-snug text-pix-butter/80">{r.desc}</p>

        <ul className="mt-4 space-y-2">
          {r.items.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm">
              <span aria-hidden="true" className={`mt-1.5 h-2.5 w-2.5 shrink-0 ${tone.bg}`} />
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-auto pt-5 text-sm underline underline-offset-4">Explore</p>
      </a>
    </motion.li>
  );
}

function Resources() {
  return (
    <div id="resources" className="scroll-mt-4">
      <Section title="Free AWS resources" intro="Everything here is provided by Amazon Web Services and free to use. Each card opens in a new tab.">
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {FREE_RESOURCES.map((r, i) => (
            <ResourceCard key={r.label} r={r} tone={TONES[i % TONES.length]} index={i} />
          ))}
        </ul>
      </Section>
    </div>
  );
}

// ─── Sponsors & partners ─────────────────────────────────────────────────────

function SponsorTile({ name, logo, href, label, accent }: { name: string; logo: string; href: string; label: string; accent: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex flex-col items-start gap-3">
      <span className="text-sm uppercase">{label}</span>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={name}
        className={`group flex h-28 w-64 items-center justify-center border-4 bg-pix-butter p-4 text-black transition-transform hover:translate-x-[2px] hover:translate-y-[2px] ${focus}`}
        style={{ borderColor: accent, boxShadow: `6px 6px 0 ${accent}` }}
      >
        {failed ? (
          <span className={`${hd} text-3xl`}>{name}</span>
        ) : (
          <span className="relative block h-full w-full">
            <Image src={logo} alt={name} fill sizes="240px" className="object-contain" onError={() => setFailed(true)} />
          </span>
        )}
      </a>
    </div>
  );
}

function PartnerTile({ name, logo, circle }: { name: string; logo: string; circle: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null; // missing logo file: drop the tile instead of a broken image
  return (
    <span
      title={name}
      className="relative block h-24 w-24 border-4 border-pix-teal bg-pix-butter p-2 shadow-pixel-teal-4"
    >
      <span className={`relative block h-full w-full overflow-hidden ${circle ? "rounded-full" : ""}`}>
        <Image src={logo} alt={name} fill sizes="80px" className="object-contain" onError={() => setFailed(true)} />
      </span>
    </span>
  );
}

function Partners() {
  return (
    <Section title="Sponsors & partners" intro="The people and communities that make these free events and resources possible.">
      <div className="flex flex-wrap gap-10">
        <SponsorTile {...MAJOR_SPONSOR} label="Major sponsor" accent={colors.pix.mustard} />
        <SponsorTile {...BROUGHT_BY} label="Brought to you by" accent={colors.pix.green} />
      </div>
      <p className={`${hd} mt-14 text-4xl`}>Community partners</p>
      <div className="mt-6 flex flex-wrap gap-6">
        {COMMUNITY_PARTNERS.map((p) => (
          <PartnerTile key={p.name} {...p} />
        ))}
      </div>
    </Section>
  );
}

// ─── Closing CTA ─────────────────────────────────────────────────────────────

function Cta() {
  return (
    <>
      <Stripes />
      <section className="bg-pix-butter text-black">
        <div className={`${wrap} py-16 text-center sm:py-24`}>
          <h2 className={`${hd} text-[clamp(4rem,9vw,8rem)]`}>
            Learn it together.
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-xl leading-snug">
            Join AWSSBG-UC to get help, teammates, and events that turn these resources into real projects.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/signup" className={`${btnDark} px-10 py-4 text-xl`}>
              Join now, it&apos;s free
            </Link>
            <Link href="/events" className={`inline-block border-4 border-black px-8 py-3.5 text-xl transition-colors hover:bg-black hover:text-pix-butter ${focus}`}>
              See events
            </Link>
          </div>
          <p className="mx-auto mt-12 max-w-xl text-xs leading-snug opacity-70">
            All resources are provided by Amazon Web Services. No affiliation or sponsorship implied.
          </p>
        </div>
      </section>
      <Stripes />
    </>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function AWSPage() {
  return (
    <div className={`${pixel.className} relative isolate bg-black tracking-normal text-pix-butter`}>
      <PixelClouds />
      <SidePixels side="left" />
      <SidePixels side="right" />
      <div className="relative z-10">
        <Hero />
        <Resources />
        <Partners />
        <Cta />
      </div>
    </div>
  );
}
