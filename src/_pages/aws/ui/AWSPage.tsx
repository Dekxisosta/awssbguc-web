"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const stagger = (delayChildren = 0.05) => ({
  hidden: {},
  show: { transition: { staggerChildren: delayChildren } },
});

const viewport = { once: true, margin: "-60px" };

// ─── Data ─────────────────────────────────────────────────────────────────────

const FREE_RESOURCES = [
  {
    label: "Builder Labs",
    image: "/images/hero/builder_labs.png",
    href: "https://builder.aws.com/start?trk=9f01212c-9819-4534-ad0a-4c5e491af39a&sc_channel=el",
    desc: "Guided, hands-on labs in a live AWS environment. No setup, no cost — just build.",
    items: ["Real AWS console access", "Step-by-step guidance", "No credit card required"],
    tag: "Hands-on Labs",
  },
  {
    label: "Builder Center",
    image: "/images/hero/builder_center.jpg",
    href: "https://builder.aws.com/start?trk=9f01212c-9819-4534-ad0a-4c5e491af39a&sc_channel=el",
    desc: "Your personal AWS learning hub — tracks, challenges, and curated content in one place.",
    items: ["Personalized learning paths", "Challenges & quests", "Community-driven content"],
    tag: "Learning Hub",
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
    desc: "End-to-end project tutorials — build a website, an API, a chatbot, and more.",
    items: ["Host a static website", "Deploy a REST API", "Build a serverless app"],
    tag: "Guided Projects",
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
    desc: "Try 100+ AWS products for free — with limits designed for learning and experimenting.",
    items: ["Always-free services", "12-month free usage", "No upfront commitment"],
    tag: "Free Tier",
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
    desc: "The authoritative reference for every AWS service — guides, API docs, and tutorials.",
    items: ["All 200+ services covered", "Code examples included", "Updated continuously"],
    tag: "Reference",
  },
  {
    label: "Kiro",
    image: "/images/hero/kiro.jpg",
    href: "https://kiro.dev/",
    desc: "An AI-powered IDE built on VS Code that writes code alongside you — built with AWS.",
    items: ["AI agent coding", "Spec-driven development", "Free to get started"],
    tag: "AI IDE",
  },
];

// ─── Card ─────────────────────────────────────────────────────────────────────

function ResourceCard({
  label,
  image,
  href,
  desc,
  items,
  tag,
}: (typeof FREE_RESOURCES)[number]) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      variants={fadeUp}
      whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      className="group flex flex-col rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden transition-colors hover:border-[#00e482]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00e482]"
    >
      {/* image */}
      <div className="relative h-44 w-full shrink-0 overflow-hidden">
        <Image
          src={image}
          alt={label}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onError={(e) => {
            // graceful fallback if image is missing
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 to-transparent" />
        {/* tag badge */}
        <span className="absolute bottom-3 left-4 rounded-full bg-neutral-900/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-neutral-400 backdrop-blur-sm border border-neutral-700">
          {tag}
        </span>
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col px-6 py-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#00e482]">
            {label}
          </p>
          {/* arrow icon — appears on hover */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 shrink-0 text-[#00e482] opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          >
            <path d="M7 7h10v10" />
            <path d="M7 17 17 7" />
          </svg>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-neutral-400">{desc}</p>

        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-neutral-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-0.5 shrink-0 text-[#00e482]"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-5 text-xs font-semibold text-[#00e482] opacity-0 transition-opacity group-hover:opacity-100">
          Explore →
        </p>
      </div>
    </motion.a>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AWSPage() {
  return (
    <div className="relative min-h-screen bg-neutral-900 overflow-hidden">
      {/* Background accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-[#00e482]/5 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-1/2 h-80 w-80 rounded-full bg-[#FF9900]/4 blur-3xl"
      />

      {/* Faint watermark */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 overflow-hidden select-none"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 600 160"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[480px] opacity-[0.03] -rotate-12"
        >
          <text
            x="0"
            y="75%"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
            fontWeight="900"
            fontSize="160"
            letterSpacing="-6"
            fill="#00e482"
          >
            FREE
          </text>
        </svg>
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20">
        {/* Header */}
        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          animate="show"
          className="mb-12"
        >
          <motion.p
            variants={fadeUp}
            className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#00e482]"
          >
            100% Free
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="text-4xl font-extrabold tracking-tight text-neutral-100 sm:text-5xl"
          >
            Build real things.{" "}
            <span className="text-[#00e482]">No credit card.</span>
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-400"
          >
            AWS provides hands-on labs, guided workshops, and project starters
            that run in real cloud environments — all at zero cost. Pick a
            resource below and start building today.
          </motion.p>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          variants={stagger(0.07)}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
        >
          {FREE_RESOURCES.map((resource) => (
            <ResourceCard key={resource.label} {...resource} />
          ))}
        </motion.div>

        {/* Footer note */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
          className="mt-12 text-center text-xs text-neutral-600"
        >
          All resources are provided by Amazon Web Services. No affiliation or
          sponsorship implied.
        </motion.p>
      </div>
    </div>
  );
}
