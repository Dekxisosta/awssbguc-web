"use client";

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { GlobeOrbit } from "./GlobeOrbit";
import { SOCIALS, MAILTO } from "@/src/shared/config/socials";

const PixelBlast = dynamic(
  () => import("@/src/widgets/pixel-blast/ui/PixelBlast"),
  { ssr: false }
);

const BorderGlow = dynamic(
  () => import("@/src/widgets/border-glow/ui/BorderGlow"),
  { ssr: false }
);

const HERO_IMAGES = [
  "/images/hero/1.jpg",
  "/images/hero/2.jpg",
  "/images/hero/3.jpg",
  "/images/hero/4.jpg"
];

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

function SectionHeading({ children, y, light = false }: { children: React.ReactNode; y: MotionValue<string>; light?: boolean }) {
  return (
    <motion.h2 variants={fadeUp} style={{ y }} className={`text-4xl font-bold tracking-tight sm:text-5xl ${light ? "text-neutral-900" : "text-neutral-100"}`}>
      {children}
    </motion.h2>
  );
}

function HeroSection() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);

  return (
    <div ref={ref} className="relative h-[70vh] min-h-[500px] overflow-hidden">

      
      
      <div
        aria-hidden="true"
        className="pixel-bg pointer-events-none absolute inset-y-0 left-0 z-10 w-40 opacity-40"
        style={{ maskImage: "linear-gradient(to right, black 0%, transparent 100%)", WebkitMaskImage: "linear-gradient(to right, black 0%, transparent 100%)" }}
      />
      
      <div
        aria-hidden="true"
        className="pixel-bg pointer-events-none absolute inset-y-0 right-0 z-10 w-40 opacity-40"
        style={{ maskImage: "linear-gradient(to left, black 0%, transparent 100%)", WebkitMaskImage: "linear-gradient(to left, black 0%, transparent 100%)" }}
      />
      
      <motion.div
        className="absolute inset-0"
        style={{ y: imgY }}
        aria-hidden="true"
      >
        {HERO_IMAGES.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 transition-opacity duration-[1200ms] ease-in-out"
            style={{ opacity: i === current ? 1 : 0 }}
          >
            <Image
              src={src}
              alt=""
              fill
              priority={i === 0}
              className="object-cover object-center"
              sizes="100vw"
            />
          </div>
        ))}
      </motion.div>

      
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" aria-hidden="true" />

      
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5] opacity-20 mix-blend-screen">
        <PixelBlast
          variant="square"
          pixelSize={2}
          color="#00e482"
          patternScale={1.6}
          patternDensity={0.9}
          pixelSizeJitter={0.4}
          enableRipples
          rippleSpeed={0.35}
          rippleThickness={0.1}
          rippleIntensityScale={1.2}
          liquid
          liquidStrength={0.08}
          liquidRadius={1.0}
          liquidWobbleSpeed={4}
          speed={0.5}
          edgeFade={0.3}
          transparent
        />
      </div>

      
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          animate="show"
          className="max-w-3xl"
        >

          <motion.h1
            variants={fadeUp}
            className="mt-8 text-5xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-8xl"
          >
            Build on the cloud.<br />
            <span className="text-[#00e482]">Start here.</span>
          </motion.h1>

          <motion.div variants={fadeUp} className="mt-10 flex flex-wrap justify-center gap-4">
            <BorderGlow
              borderRadius={9999}
              backgroundColor="#00e482"
              glowColor="150 100 60"
              glowRadius={32}
              glowIntensity={1.2}
              edgeSensitivity={20}
              coneSpread={30}
              colors={["#00e482", "#00c9ff", "#00e482"]}
              fillOpacity={0.3}
              className="rounded-full"
            >
              <Link
                href="/signup"
                className="rounded-full bg-[#00e482] px-8 py-3 text-base font-bold text-[#161d27] transition-opacity hover:opacity-90"
              >
                Join the community
              </Link>
            </BorderGlow>
            <BorderGlow
              borderRadius={9999}
              backgroundColor="transparent"
              glowColor="0 0 50"
              glowRadius={32}
              glowIntensity={0.2}
              edgeSensitivity={20}
              coneSpread={30}
              colors={["#ffffff", "#a0c4ff", "#ffffff"]}
              fillOpacity={0.15}
              className="rounded-full"
            >
              <Link
                href="/events"
                className="rounded-full border border-white/30 bg-white/10 px-8 py-3 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                Upcoming events
              </Link>
            </BorderGlow>
          </motion.div>
        </motion.div>

        
        <div className="absolute bottom-5 flex gap-1.5">
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === current}
              className={[
                "h-1.5 rounded-full transition-all duration-300",
                i === current ? "w-6 bg-[#00e482]" : "w-1.5 bg-white/40 hover:bg-white/70",
              ].join(" ")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Member counter ──────────────────────────────────────────────────────────

function CounterCard({
  value,
  label,
  sublabel,
  accent,
  icon,
}: {
  value: number;
  label: string;
  sublabel: string;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={viewport}
      whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      className="relative flex flex-1 flex-col gap-4 overflow-hidden border-2 border-neutral-200 bg-white p-8 shadow-sm shadow-neutral-100 transition-shadow hover:shadow-md"
    >
      {/* accent bar */}
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: accent }} />

      {/* icon */}
      <div
        className="flex h-10 w-10 items-center justify-center"
        style={{ background: `${accent}18`, color: accent }}
      >
        {icon}
      </div>

      {/* number */}
      <span
        className="text-7xl font-extrabold tabular-nums tracking-tight sm:text-8xl"
        style={{ color: accent }}
      >
        {value.toLocaleString()}
      </span>

      {/* labels */}
      <div>
        <p className="text-base font-semibold text-neutral-800">{label}</p>
        <p className="mt-0.5 text-sm text-neutral-400">{sublabel}</p>
      </div>
    </motion.div>
  );
}

// ─── Tech domain marquee ─────────────────────────────────────────────────────

import {
  BrainCircuit,
  Sparkles,
  Globe,
  Cloud,
  GitBranch,
  ShieldCheck,
  BarChart2,
  Zap,
  Container,
  Cpu,
  Radio,
  Database,
  Network,
  Smartphone,
  Code2,
  type LucideIcon,
} from "lucide-react";

const TECH_ITEMS: { label: string; Icon: LucideIcon; tip: string }[] = [
  { label: "Machine Learning",        Icon: BrainCircuit, tip: "AWS SageMaker lets you build, train, and deploy ML models at scale — with managed infrastructure so you never have to wrangle servers." },
  { label: "Artificial Intelligence", Icon: Sparkles,     tip: "AWS AI services like Rekognition, Comprehend, and Bedrock give you pre-built intelligence — vision, language, and foundation models — through a single API call." },
  { label: "Web Development",         Icon: Globe,        tip: "Amplify, S3 static hosting, CloudFront CDN, and Lambda backends make AWS a full-stack platform for shipping web apps globally in minutes." },
  { label: "Cloud Computing",         Icon: Cloud,        tip: "EC2, Lambda, and Fargate give you compute in every shape — VMs, functions, containers — so you only pay for what you actually run." },
  { label: "DevOps",                  Icon: GitBranch,    tip: "CodePipeline, CodeBuild, and CodeDeploy wire together CI/CD from commit to production, while CloudFormation and CDK keep infrastructure as code." },
  { label: "Cybersecurity",           Icon: ShieldCheck,  tip: "IAM, GuardDuty, Security Hub, and AWS Shield form a layered defense — identity, threat detection, compliance, and DDoS protection in one place." },
  { label: "Data Engineering",        Icon: BarChart2,    tip: "Glue, Athena, Redshift, and Lake Formation handle the full data pipeline — ingestion, cataloging, querying petabytes, and governed data lakes." },
  { label: "Serverless",              Icon: Zap,          tip: "Lambda, API Gateway, Step Functions, and EventBridge let you build event-driven systems that scale to zero when idle and to millions when needed." },
  { label: "Containers",              Icon: Container,    tip: "ECS and EKS run Docker and Kubernetes workloads on AWS-managed control planes, while ECR stores your images close to where they run." },
  { label: "Generative AI",           Icon: Cpu,          tip: "Amazon Bedrock provides on-demand access to foundation models from Anthropic, Meta, Mistral, and Amazon — no GPU provisioning required." },
  { label: "IoT",                     Icon: Radio,        tip: "AWS IoT Core connects billions of devices, routes messages in real time, and integrates directly with Lambda and Kinesis for edge-to-cloud pipelines." },
  { label: "Databases",               Icon: Database,     tip: "RDS, Aurora, DynamoDB, ElastiCache, and DocumentDB cover every data model — relational, key-value, document, graph — all fully managed." },
  { label: "Networking",              Icon: Network,      tip: "VPC, Route 53, CloudFront, Transit Gateway, and Direct Connect give you private, global, and hybrid networking with fine-grained control." },
  { label: "Mobile Development",      Icon: Smartphone,   tip: "Amplify's mobile libraries, Cognito for auth, and AppSync for real-time GraphQL make AWS the backend for iOS and Android apps at any scale." },
  { label: "Software Engineering",    Icon: Code2,        tip: "Cloud9, CodeWhisperer, and the extensive AWS SDK ecosystem mean you can write, test, and ship cloud-native code without leaving AWS." },
];

const MARQUEE_ITEMS = [...TECH_ITEMS, ...TECH_ITEMS];

function MarqueePill({ label, Icon, tip }: { label: string; Icon: LucideIcon; tip: string }) {
  const [hovered, setHovered] = useState(false);
  // viewport-absolute coords for the portal tooltip
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function track(e: React.MouseEvent) {
    setCursor({ x: e.clientX, y: e.clientY });
  }

  const tooltip =
    mounted && hovered
      ? createPortal(
          <div
            className="pointer-events-none fixed w-64 border border-neutral-700 bg-[#0d1117] px-3 py-2.5 text-xs leading-relaxed text-neutral-300 shadow-2xl"
            style={{
              zIndex: 99999,
              left: cursor.x + 14,
              // flip above cursor so it doesn't chase off-screen
              top: cursor.y - 8,
              transform: "translateY(-100%)",
            }}
          >
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-[#00e482]">
              {label}
            </p>
            {tip}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <div
        onMouseEnter={(e) => { setHovered(true); track(e); }}
        onMouseMove={track}
        onMouseLeave={() => setHovered(false)}
        className="flex items-center gap-2.5 whitespace-nowrap border border-neutral-200 bg-neutral-50 px-4 py-1.5 cursor-default transition-colors hover:border-[#00e482]/40 hover:bg-[#00e482]/5"
      >
        <Icon size={14} strokeWidth={1.75} className="shrink-0 text-[#00e482]" />
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          {label}
        </span>
      </div>
      {tooltip}
    </>
  );
}

function TechMarquee() {
  const [paused, setPaused] = useState(false);

  return (
    <div
      className="relative overflow-hidden border-y border-neutral-200 bg-white py-3 select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* fade-out edges */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24"
        style={{ background: "linear-gradient(to right, #ffffff 0%, transparent 100%)" }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24"
        style={{ background: "linear-gradient(to left, #ffffff 0%, transparent 100%)" }}
      />

      {/* scrolling track */}
      <div
        className="flex w-max gap-6"
        style={{ animation: `marquee 65s linear infinite`, animationPlayState: paused ? "paused" : "running" }}
      >
        {MARQUEE_ITEMS.map(({ label, Icon, tip }, i) => (
          <MarqueePill key={`${label}-${i}`} label={label} Icon={Icon} tip={tip} />
        ))}
      </div>

      <style jsx>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          div { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function HomeClient({
  registeredCount = 0,
  participantCount = 0,
}: {
  registeredCount?: number;
  participantCount?: number;
}) {
  return (
    <div>
      
      <HeroSection />

      {/* white breathing room above the marquee + socials */}
      <div className="bg-white pt-10">
        <TechMarquee />

        <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-8 px-6 py-7">
          <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">Follow us</span>
          <div className="h-5 w-px bg-neutral-300" aria-hidden="true" />
          <div className="flex items-center gap-2">
            
            <a
              href={SOCIALS.discord}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Discord server"
              className="flex items-center gap-2.5 rounded-lg px-4 py-3 text-neutral-500 transition-colors hover:bg-[#5865F2]/10 hover:text-[#5865F2]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span className="text-sm font-semibold">Discord</span>
            </a>
            
            <a
              href={SOCIALS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook page"
              className="flex items-center gap-2.5 rounded-lg px-4 py-3 text-neutral-500 transition-colors hover:bg-[#1877F2]/10 hover:text-[#1877F2]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span className="text-sm font-semibold">Facebook</span>
            </a>
            
            <a
              href={MAILTO}
              aria-label="Email us"
              className="flex items-center gap-2.5 rounded-lg px-4 py-3 text-neutral-500 transition-colors hover:bg-[#00e482]/10 hover:text-[#00b86b]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <span className="text-sm font-semibold">Email</span>
            </a>
          </div>
        </div>
      </div>

      </div>{/* end white wrapper */}

      
      <ParallaxSection
        className="border-b border-neutral-200 bg-white min-h-screen"
        accentBehind={<div className="absolute -left-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[#00e482]/8 blur-3xl" />}
      >
        {({ headingY, bodyY }) => (
          <>
          <div className="mx-auto max-w-5xl px-6 py-20">
            <motion.div className="grid gap-12 sm:grid-cols-2 sm:items-center" variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={viewport}>
              <div>
                <EyebrowLabel>About AWS</EyebrowLabel>
                <SectionHeading y={headingY} light>The world runs on the cloud.</SectionHeading>
                <motion.p variants={fadeUp} style={{ y: bodyY }} className="mt-6 text-base leading-relaxed text-neutral-600">
                  Amazon Web Services powers millions of businesses globally — from startups to governments. With over 200 fully featured services spanning compute, storage, databases, AI/ML, and security, AWS is the on-ramp to building anything at scale.
                </motion.p>
                <motion.p variants={fadeUp} style={{ y: bodyY }} className="mt-4 text-base leading-relaxed text-neutral-600">
                  As members of AWSSBG-UC, you get hands-on exposure to the same infrastructure used by Netflix, Airbnb, NASA, and thousands more.
                </motion.p>
              </div>
              <motion.div className="relative flex items-center justify-center" variants={fadeIn}>
                
                <Image
                  src="/images/hero/globe.png"
                  alt="AWS global infrastructure"
                  width={640}
                  height={400}
                  className="w-full max-w-[640px] rounded-xl object-contain opacity-90"
                />
                
                
                <div className="absolute w-full max-w-[640px]" style={{ top: "50%", transform: "translateY(-50%)" }}>
                  <GlobeOrbit />
                </div>
              </motion.div>
            </motion.div>
          </div>

          
          <div className="pointer-events-none absolute inset-x-0 bottom-0" aria-hidden="true">
            <svg viewBox="0 0 1440 160" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="block w-full">
              
              <g fill="#171717" opacity="0.5">
                <rect x="0"    y="110" width="60"  height="50" />
                <rect x="80"   y="90"  width="40"  height="70" />
                <rect x="140"  y="100" width="55"  height="60" />
                <rect x="210"  y="80"  width="35"  height="80" />
                <rect x="260"  y="105" width="50"  height="55" />
                <rect x="330"  y="95"  width="45"  height="65" />
                <rect x="390"  y="115" width="30"  height="45" />
                <rect x="440"  y="85"  width="40"  height="75" />
                <rect x="500"  y="100" width="55"  height="60" />
                <rect x="570"  y="90"  width="35"  height="70" />
                <rect x="620"  y="110" width="50"  height="50" />
                <rect x="690"  y="80"  width="40"  height="80" />
                <rect x="750"  y="95"  width="45"  height="65" />
                <rect x="810"  y="105" width="30"  height="55" />
                <rect x="860"  y="85"  width="55"  height="75" />
                <rect x="930"  y="100" width="40"  height="60" />
                <rect x="990"  y="90"  width="35"  height="70" />
                <rect x="1040" y="110" width="50"  height="50" />
                <rect x="1110" y="80"  width="40"  height="80" />
                <rect x="1170" y="95"  width="45"  height="65" />
                <rect x="1230" y="105" width="55"  height="55" />
                <rect x="1300" y="85"  width="30"  height="75" />
                <rect x="1350" y="100" width="50"  height="60" />
                <rect x="1400" y="90"  width="40"  height="70" />
              </g>
              
              <g fill="#171717">
                <rect x="10"   y="70"  width="45"  height="90" />
                <rect x="30"   y="55"  width="4"   height="16" />
                <rect x="100"  y="50"  width="55"  height="110" />
                <rect x="108"  y="40"  width="38"  height="12" />
                <rect x="118"  y="30"  width="18"  height="12" />
                <rect x="170"  y="65"  width="40"  height="95" />
                <rect x="230"  y="35"  width="30"  height="125" />
                <rect x="243"  y="20"  width="4"   height="17" />
                <rect x="275"  y="75"  width="45"  height="85" />
                <rect x="340"  y="55"  width="50"  height="105" />
                <rect x="348"  y="44"  width="34"  height="13" />
                <rect x="410"  y="70"  width="35"  height="90" />
                <rect x="460"  y="42"  width="48"  height="118" />
                <rect x="482"  y="26"  width="4"   height="18" />
                <rect x="525"  y="60"  width="42"  height="100" />
                <rect x="585"  y="48"  width="30"  height="112" />
                <rect x="640"  y="68"  width="50"  height="92" />
                <rect x="710"  y="38"  width="40"  height="122" />
                <rect x="728"  y="22"  width="4"   height="18" />
                <rect x="770"  y="58"  width="35"  height="102" />
                <rect x="825"  y="44"  width="48"  height="116" />
                <rect x="833"  y="33"  width="32"  height="13" />
                <rect x="890"  y="62"  width="42"  height="98" />
                <rect x="950"  y="50"  width="38"  height="110" />
                <rect x="967"  y="34"  width="4"   height="18" />
                <rect x="1005" y="70"  width="45"  height="90" />
                <rect x="1065" y="40"  width="52"  height="120" />
                <rect x="1073" y="28"  width="36"  height="14" />
                <rect x="1083" y="16"  width="16"  height="14" />
                <rect x="1135" y="58"  width="38"  height="102" />
                <rect x="1190" y="45"  width="44"  height="115" />
                <rect x="1210" y="28"  width="4"   height="19" />
                <rect x="1250" y="66"  width="48"  height="94" />
                <rect x="1315" y="52"  width="36"  height="108" />
                <rect x="1365" y="42"  width="50"  height="118" />
                <rect x="1373" y="30"  width="34"  height="14" />
                <rect x="1420" y="68"  width="20"  height="92" />
              </g>
              <rect x="0" y="155" width="1440" height="5" fill="#171717" />
            </svg>
          </div>
          </>
        )}
      </ParallaxSection>

      {/* Section: Free Learning Resources — DARK */}
      <ParallaxSection
        className="border-b border-neutral-800 bg-neutral-900 min-h-screen"
        accentBehind={
          <>
            <div className="absolute -right-16 top-0 h-72 w-72 rounded-full bg-[#00e482]/5 blur-3xl" />
            
            <div className="pointer-events-none absolute -bottom-8 -left-8 overflow-hidden select-none" aria-hidden="true">
              <svg viewBox="0 0 500 160" xmlns="http://www.w3.org/2000/svg" className="w-[420px] opacity-[0.04] -rotate-12">
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
            
            <div className="pointer-events-none absolute right-8 top-8 opacity-[0.06] rotate-12" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="#00e482" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.59-7.59a1 1 0 0 0 0-1.41z"/>
                <circle cx="7" cy="7" r="1.5" fill="#00e482"/>
              </svg>
            </div>
          </>
        }
      >
        {({ headingY, bodyY }) => (
          <div className="mx-auto max-w-5xl px-6 py-20">
            {/* Header block — eyebrow, heading, subtext all aligned */}
            <motion.div variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={viewport}>
              <EyebrowLabel>100% Free</EyebrowLabel>
              <SectionHeading y={headingY}>Build real things. No credit card.</SectionHeading>
              <motion.p variants={fadeUp} style={{ y: bodyY }} className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-400">
                AWS provides hands-on labs, guided workshops, and project starters that run in real cloud environments — all at zero cost through AWS Builder Labs, Builder Center, Skill Builder, and the Free Tier.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-6">
                <Link
                  href="/aws"
                  className="inline-flex items-center gap-2 rounded-full border border-[#00e482]/40 bg-[#00e482]/10 px-5 py-2.5 text-sm font-semibold text-[#00e482] transition-colors hover:bg-[#00e482]/20"
                >
                  View all free resources
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Link>
              </motion.div>
            </motion.div>

            {/* Cards container — visually separated */}
            <motion.div
              className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
              variants={stagger(0.1)}
              initial="hidden"
              whileInView="show"
              viewport={viewport}
            >
                {[
                  {
                    label: "Builder Labs",
                    image: "/images/hero/builder_labs.png",
                    href: "https://builder.aws.com/start?trk=9f01212c-9819-4534-ad0a-4c5e491af39a&sc_channel=el",
                    desc: "Guided, hands-on labs in a live AWS environment. No setup, no cost — just build.",
                    items: ["Real AWS console access", "Step-by-step guidance", "No credit card required"],
                  },
                  {
                    label: "Builder Center",
                    image: "/images/hero/builder_center.jpg",
                    href: "https://builder.aws.com/start?trk=9f01212c-9819-4534-ad0a-4c5e491af39a&sc_channel=el",
                    desc: "Your personal AWS learning hub — tracks, challenges, and curated content in one place.",
                    items: ["Personalized learning paths", "Challenges & quests", "Community-driven content"],
                  },
                  {
                    label: "Workshops",
                    image: "/images/hero/workshops.png",
                    href: "https://workshops.aws/",
                    desc: "Self-paced workshop content built by AWS engineers covering every major service.",
                    items: ["Serverless & containers", "ML & AI applications", "Security & DevOps"],
                  },
                  {
                    label: "Project Hub",
                    image: "/images/hero/projects.jpg",
                    href: "https://aws.amazon.com/getting-started/hands-on/",
                    desc: "End-to-end project tutorials — build a website, an API, a chatbot, and more.",
                    items: ["Host a static website", "Deploy a REST API", "Build a serverless app"],
                  },
                ].map(({ label, image, href, desc, items }) => (
                  <motion.a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    variants={fadeUp}
                    whileHover={{ y: -4, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                    className="group flex flex-col rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden transition-colors hover:border-neutral-700"
                  >
                    
                    <div className="relative h-40 w-full shrink-0 overflow-hidden">
                      <Image
                        src={image}
                        alt={label}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/70 to-transparent" />
                    </div>
                    
                    <div className="flex flex-1 flex-col px-6 py-5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-widest text-[#00e482]">{label}</p>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#00e482] opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true">
                          <path d="M7 7h10v10" /><path d="M7 17 17 7" />
                        </svg>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-neutral-400">{desc}</p>
                      <ul className="mt-4 space-y-2">
                        {items.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-sm text-neutral-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-[#00e482]" aria-hidden="true">
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
                ))}
              </motion.div>
          </div>
        )}
      </ParallaxSection>

      
      <ParallaxSection
        className="bg-white min-h-screen overflow-visible"
        accentBehind={<div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00e482]/6 blur-3xl" />}
      >
        {({ headingY }) => (
          <>
            
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 -translate-y-full overflow-hidden leading-none text-white" aria-hidden="true">
              <svg viewBox="0 0 1440 56" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="block h-10 w-full sm:h-14">
                <path d="M0,56 L60,0 L120,56 L180,0 L240,56 L300,0 L360,56 L420,0 L480,56 L540,0 L600,56 L660,0 L720,56 L780,0 L840,56 L900,0 L960,56 L1020,0 L1080,56 L1140,0 L1200,56 L1260,0 L1320,56 L1380,0 L1440,56 L1440,56 Z" fill="currentColor" />
              </svg>
            </div>

            <div className="mx-auto max-w-5xl px-6 py-28">
              {/* Top row — mascot + heading side by side on lg, stacked on mobile */}
              <motion.div
                className="flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:gap-14"
                variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={viewport}
              >
                {/* Mascot */}
                <motion.div
                  variants={fadeIn}
                  className="flex shrink-0 items-center justify-center self-center"
                  whileHover={{ rotate: [-1, 1, -1, 0], transition: { duration: 0.5 } }}
                >
                  <Image
                    src="/icons/temp_mascot.webp"
                    alt="AWSSBG-UC mascot"
                    width={260}
                    height={260}
                    className="drop-shadow-2xl w-full max-w-[260px]"
                  />
                </motion.div>

                {/* Heading block */}
                <div>
                  <EyebrowLabel>Why AWSSBG-UC</EyebrowLabel>
                  <motion.h2 variants={fadeUp} className="text-4xl font-bold tracking-tight sm:text-5xl text-neutral-900">
                    Everything maps back to six pillars.
                  </motion.h2>
                  <motion.p variants={fadeUp} className="mt-4 max-w-xl text-base leading-relaxed text-neutral-500">
                    Education, outreach, governance, institutional growth, recognition, and technical innovation — with AWS cloud technology as the common thread.
                  </motion.p>
                </div>
              </motion.div>

              {/* Cards — full width below the header row */}
              <motion.div
                className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                variants={stagger(0.09)} initial="hidden" whileInView="show" viewport={viewport}
              >
                    {[
                      {
                        category: "Education",
                        tag: "Free for all members",
                        title: "Learn by building",
                        body: "Hands-on labs, workshops, and certification prep on real AWS infrastructure.",
                        image: "/images/additional/wrench2.png",
                      },
                      {
                        category: "Outreach",
                        tag: "Open to everyone",
                        title: "Grow the community",
                        body: "Events, partnerships, and programs that bring cloud skills to more students.",
                        image: "/images/additional/community.png",
                      },
                      {
                        category: "Governance",
                        tag: "Structured & transparent",
                        title: "Run like an org",
                        body: "Constitution-backed processes, officer roles, and democratic decision-making.",
                        image: "/images/additional/key2.png",
                      },
                      {
                        category: "Institutional Growth",
                        tag: "Long-term impact",
                        title: "Build something lasting",
                        body: "Alumni networks, school partnerships, and a track record that outlasts any batch.",
                        image: "/images/additional/ladder.png",
                      },
                      {
                        category: "Recognition",
                        tag: "Member milestones",
                        title: "Celebrate achievement",
                        body: "Certifications, competition wins, and org-wide recognition for members who level up.",
                        image: "/images/additional/trophy2.png",
                      },
                      {
                        category: "Technical Innovation",
                        tag: "Powered by AWS",
                        title: "Ship real things",
                        body: "Hackathons, internal tools, and projects that solve real problems using cloud tech.",
                        image: "/images/additional/thunder2.png",
                      },
                    ].map(({ category, tag, title, body, image }) => (
                      <motion.div
                        key={title}
                        variants={fadeUp}
                        whileHover={{ boxShadow: "0 8px 24px -4px rgba(0,0,0,0.10)", transition: { duration: 0.2 } }}
                        className="relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm"
                      >
                        {/* pixel dot grid — bottom-right decorative accent */}
                        <svg
                          aria-hidden="true"
                          className="pointer-events-none absolute bottom-0 right-0 h-24 w-24 opacity-[0.07]"
                          viewBox="0 0 80 80"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          {Array.from({ length: 6 }, (_, row) =>
                            Array.from({ length: 6 }, (_, col) => (
                              <rect
                                key={`${row}-${col}`}
                                x={col * 14 + 2}
                                y={row * 14 + 2}
                                width="4"
                                height="4"
                                rx="1"
                                fill="#00e482"
                              />
                            ))
                          )}
                        </svg>

                        {/* icon */}
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-neutral-100 shadow-sm">
                          <Image src={image} alt={title} width={28} height={28} className="object-contain" />
                        </div>

                        {/* category pill */}
                        <div className="mb-2">
                          <span className="inline-block rounded-full border border-neutral-300 bg-white px-2.5 py-0.5 text-[11px] font-medium text-neutral-500">
                            {category}
                          </span>
                        </div>

                        {/* tag row */}
                        <div className="mb-3 flex items-center gap-1.5 text-neutral-400">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.59-7.59a1 1 0 0 0 0-1.41z"/>
                            <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/>
                          </svg>
                          <span className="text-[11px]">{tag}</span>
                        </div>

                        <p className="text-base font-bold leading-snug text-neutral-900">{title}</p>
                        <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600">{body}</p>
                      </motion.div>
                    ))}
              </motion.div>
            </div>

            

            
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 translate-y-full overflow-hidden leading-none text-white" aria-hidden="true">
              <svg viewBox="0 0 1440 56" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="block h-10 w-full sm:h-14">
                <path d="M0,0 L60,56 L120,0 L180,56 L240,0 L300,56 L360,0 L420,56 L480,0 L540,56 L600,0 L660,56 L720,0 L780,56 L840,0 L900,56 L960,0 L1020,56 L1080,0 L1140,56 L1200,0 L1260,56 L1320,0 L1380,56 L1440,0 L1440,0 Z" fill="currentColor" />
              </svg>
            </div>
          </>
        )}
      </ParallaxSection>

      {/* Section: Community — DARK, CTA */}
      <ParallaxSection
        accentBehind={
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -left-20 bottom-0 h-[500px] w-[500px] rounded-full bg-[#00e482]/6 blur-3xl" />
            <div className="absolute -right-20 top-0 h-[400px] w-[400px] rounded-full bg-[#00e482]/4 blur-3xl" />
          </div>
        }
        className="bg-neutral-900 min-h-screen"
      >
        {({ headingY }) => (
          <div className="mx-auto max-w-4xl px-6 py-20 text-center">
            <motion.div variants={stagger(0.09)} initial="hidden" whileInView="show" viewport={viewport}>
              <EyebrowLabel>AWSSBG-UC</EyebrowLabel>
              <SectionHeading y={headingY}>
                What are you<br />waiting for?
              </SectionHeading>

              <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-neutral-400">
                Over 100 students have already joined. We run workshops, ship projects, and build cloud skills together — all free, all on AWS.
              </motion.p>

              {/* Pillars — no hard numbers, just what we do */}
              <motion.div className="mt-12 grid gap-4 sm:grid-cols-3 text-left" variants={stagger(0.08)}>
                {[
                  {
                    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg>,
                    title: "Hands-on labs",
                    body: "Real AWS accounts. Real deployments. Not just slides.",
                  },
                  {
                    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                    title: "A real community",
                    body: "People who actually show up, help each other, and build stuff.",
                  },
                  {
                    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
                    title: "Something on your CV",
                    body: "Certifications, projects, and events worth talking about.",
                  },
                ].map(({ icon, title, body }) => (
                  <motion.div
                    key={title}
                    variants={fadeUp}
                    className="rounded-xl border border-neutral-800 bg-neutral-900/60 px-6 py-5"
                  >
                    <div className="mb-3 text-[#00e482]">{icon}</div>
                    <p className="text-sm font-semibold text-neutral-100">{title}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">{body}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* CTAs */}
              <motion.div variants={fadeUp} className="mt-12 flex flex-wrap justify-center gap-4">
                <div className="border-spin rounded-full bg-[#161d27]">
                  <Link
                    href="/signup"
                    className="relative block rounded-full bg-[#00e482] px-10 py-3.5 text-base font-bold text-[#0f1923] transition-opacity hover:opacity-90"
                  >
                    Join now — it&apos;s free
                  </Link>
                </div>
                <div>
                  <Link
                    href="/about"
                    className="block rounded-full border border-neutral-700 px-8 py-3.5 text-base font-semibold text-neutral-300 transition-colors hover:border-neutral-500 hover:text-neutral-100"
                  >
                    Learn more
                  </Link>
                </div>
              </motion.div>

              <motion.p variants={fadeUp} className="mt-6 text-xs text-neutral-600">
                Open to all University of Cabuyao students. No experience needed.
              </motion.p>
            </motion.div>
          </div>
        )}
      </ParallaxSection>
    </div>
  );
}
