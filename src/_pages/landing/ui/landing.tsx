"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";

const PixelBlast = dynamic(
  () => import("@/src/widgets/pixel-blast/ui/PixelBlast"),
  { ssr: false }
);

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const gridY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  return (
    <main className="bg-neutral-900 text-neutral-100">
      {/* Hero */}
      <section
        ref={heroRef}
        className="relative flex min-h-screen items-center justify-center overflow-hidden"
      >
        {/* Layer 1 — PixelBlast WebGL canvas */}
        <motion.div aria-hidden="true" style={{ y: bgY }} className="absolute inset-0">
          <PixelBlast
            variant="circle"
            pixelSize={5}
            color="#00e482"
            patternScale={1.75}
            patternDensity={1.05}
            pixelSizeJitter={0.5}
            enableRipples
            rippleSpeed={0.4}
            rippleThickness={0.12}
            rippleIntensityScale={1.5}
            liquid
            liquidStrength={0.12}
            liquidRadius={1.2}
            liquidWobbleSpeed={5}
            speed={0.65}
            edgeFade={0.25}
            transparent
          />
        </motion.div>

        {/* Layer 2 — radial amber glow */}
        <motion.div
          aria-hidden="true"
          style={{ y: gridY }}
          className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_60%,#00e48218_0%,transparent_70%)]"
        />

        {/* Layer 3 — foreground content */}
        <motion.div
          style={{ y: contentY, opacity: contentOpacity }}
          className="relative z-10 mx-auto max-w-2xl px-6 text-center"
        >
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-[#00e482]"
          >
            AWS Student Builder Group — University of Cabuyao
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl"
          >
            Build on the cloud.{" "}
            <span className="text-[#00e482]">Learn together.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.22, ease: "easeOut" }}
            className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-neutral-400"
          >
            AWSSBG-UC is UC's official AWS student community — where you earn
            certifications, ship real projects, and grow alongside the next
            generation of cloud engineers.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.36, ease: "easeOut" }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/login"
              className="rounded-md bg-[#161d27] px-6 py-2.5 text-sm font-semibold text-[#00e482] transition-opacity hover:opacity-90"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-md border border-neutral-700 px-6 py-2.5 text-sm font-semibold text-neutral-300 transition-colors hover:border-neutral-500 hover:text-neutral-100"
            >
              Create account
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          style={{ opacity: useTransform(scrollYProgress, [0, 0.15], [1, 0]) }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className="flex h-8 w-5 items-start justify-center rounded-full border border-neutral-700 pt-1.5"
          >
            <div className="h-1.5 w-0.5 rounded-full bg-neutral-500" />
          </motion.div>
        </motion.div>
      </section>

      {/* Below-fold teaser */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            { label: "Cloud Workshops", body: "Hands-on labs on real AWS infrastructure, no credit card required." },
            { label: "Certification Path", body: "Structured study groups covering Foundational → Professional tracks." },
            { label: "Community Events", body: "Hackathons, cloud talks, and industry networking all year long." },
          ].map(({ label, body }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: "easeOut" }}
              className="rounded-xl border border-neutral-800 bg-neutral-900/60 px-6 py-6"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-[#00e482]">{label}</p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">{body}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, delay: 0.3, ease: "easeOut" }}
          className="mt-12 text-center"
        >
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-md bg-[#161d27] px-6 py-2.5 text-sm font-semibold text-[#00e482] transition-opacity hover:opacity-90"
          >
            Get started
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </motion.div>
      </section>
    </main>
  );
}
