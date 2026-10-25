"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pixelify_Sans, Jersey_10 } from "next/font/google";
import type { PublicMemberProfile } from "@/src/entities/member";
import { SOCIALS } from "@/src/shared/config/socials";

export const membersMetadata = { title: "Community — AWSSBG-UC" };

/**
 * Community page in the pixel-art direction of the home page:
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

const wrap = "mx-auto w-full max-w-[1300px] px-5 sm:px-8";
const focus = "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#2c8f8f]";

const btnPrimary = `inline-flex items-center justify-center gap-2 border-4 border-[#fff7a1] bg-[#fff7a1] px-6 py-3 text-lg text-black shadow-[4px_4px_0_#b32a0e] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#b32a0e] ${focus}`;
const btnDark = `inline-flex items-center justify-center gap-2 border-4 border-black bg-black px-6 py-3 text-lg text-[#fff7a1] shadow-[4px_4px_0_#b32a0e] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#b32a0e] ${focus}`;

const CARD_BORDERS = ["border-[#2c8f8f]", "border-[#b89a0a]", "border-[#b32a0e]", "border-[#3aaa6e]"];

function Stripes({ className = "h-4" }: { className?: string }) {
  return <div aria-hidden="true" className={className} style={{ background: STRIPE_BG }} />;
}

// ─── Pixelated avatar ─────────────────────────────────────────────────────────

function PixelPhoto({ src, width = 24, height = 24 }: { src: string; width?: number; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const img = new window.Image();
    img.onload = () => {
      const k = Math.max(width / img.width, height / img.height); // cover
      const w = img.width * k;
      const h = img.height * k;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
    };
    img.src = src;
  }, [src, width, height]);
  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      aria-hidden="true"
      style={{ aspectRatio: `${width} / ${height}` }}
      className="block w-full [image-rendering:pixelated]"
    />
  );
}

// ─── Discord SVG ──────────────────────────────────────────────────────────────

function DiscordIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

// ─── Facebook SVG ─────────────────────────────────────────────────────────────

function FacebookIcon({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

// ─── GitHub SVG ───────────────────────────────────────────────────────────────

function GitHubIcon({ size = 12, className = "" }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

// ─── Discord app mock ─────────────────────────────────────────────────────────

const CHANNELS = [
  { id: "announcements", label: "announcements", category: "INFO",             active: false, announce: true,  voice: false },
  { id: "rules",         label: "rules",          category: null,              active: false, announce: false, voice: false },
  { id: "welcome",       label: "welcome",        category: "AWSSBG-UC",      active: false, announce: false, voice: false },
  { id: "general",       label: "general",        category: null,              active: true,  announce: false, voice: false },
  { id: "ask-anything",  label: "ask-anything",   category: null,              active: false, announce: false, voice: false },
  { id: "tech-news",     label: "tech-news",      category: null,              active: false, announce: false, voice: false },
  { id: "study-groups",  label: "study-groups",   category: "VOICE",          active: false, announce: false, voice: true  },
  { id: "build-brew",    label: "build-and-brew", category: null,              active: false, announce: false, voice: true  },
];

function DiscordMock() {
  return (
    <div
      className="flex h-[500px] w-full overflow-hidden border-4 border-[#fff7a1] shadow-[8px_8px_0_#2c8f8f] sm:h-[540px]"
      aria-label="Discord community preview"
      role="img"
    >
      {/* ── Server icon rail ── */}
      <div className="flex w-[52px] shrink-0 flex-col items-center gap-2 px-1.5 py-3 overflow-y-auto [scrollbar-width:none]" style={{ background: "#1e1f22" }}>
        {/* Server icon */}
        <div className="relative flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[16px] bg-[#5865F2] transition-all hover:rounded-[12px] cursor-default">
          <DiscordIcon size={22} className="text-white" />
          {/* Active pill */}
          <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-white" />
        </div>
        <div className="h-px w-8 rounded-full bg-white/10 my-1" />
        {/* DMs icon */}
        <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[#313338] cursor-default hover:rounded-[12px] hover:bg-[#5865F2] transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b5bac1" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
      </div>

      {/* ── Channel sidebar ── */}
      <div className="flex w-[172px] shrink-0 flex-col" style={{ background: "#2b2d31" }}>
        {/* Server name header */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b px-3 shadow-sm cursor-default" style={{ borderColor: "#1e1f22" }}>
          <span className="text-[13px] font-semibold truncate" style={{ color: "#f2f3f5" }}>AWSSBG-UC</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b5bac1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </div>

        {/* Channel list */}
        <div className="flex-1 overflow-y-auto px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(() => {
            let lastCategory: string | null = "";
            return CHANNELS.map((ch) => {
              const showCat = ch.category !== null && ch.category !== lastCategory;
              if (showCat) lastCategory = ch.category;
              return (
                <div key={ch.id}>
                  {showCat && (
                    <div className="flex items-center gap-1 px-1 pt-4 pb-1 cursor-default">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#949ba4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
                      <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#949ba4" }}>{ch.category}</span>
                    </div>
                  )}
                  <div
                    className="flex items-center gap-1.5 rounded-[4px] px-2 py-[5px] cursor-default"
                    style={{
                      background: ch.active ? "#404249" : "transparent",
                      color: ch.active ? "#f2f3f5" : "#949ba4",
                    }}
                  >
                    {ch.voice ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
                    ) : ch.announce ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true"><path d="M3 11l19-9-9 19-2-8-8-2z" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    )}
                    <span className="truncate text-[13px] font-medium">{ch.label}</span>
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* User bar */}
        <div className="flex h-[52px] shrink-0 items-center gap-2 px-2" style={{ background: "#232428" }}>
          <div className="relative shrink-0">
            <div className="h-8 w-8 overflow-hidden rounded-full">
              <Image src="/images/discord/discord.jpg" alt="Capybara67" width={32} height={32} className="h-full w-full object-cover" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 bg-[#23a559]" style={{ borderColor: "#232428" }} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold leading-none" style={{ color: "#f2f3f5" }}>Capybara67</p>
            <p className="mt-0.5 truncate text-[11px] leading-none" style={{ color: "#949ba4" }}>Online</p>
          </div>
          <div className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b5bac1" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b5bac1" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="23" y2="15" /><line x1="23" y1="9" x2="17" y2="12" /><line x1="23" y1="15" x2="17" y2="12" /></svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b5bac1" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M4.93 4.93a10 10 0 0 0 0 14.14" /></svg>
          </div>
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="flex min-w-0 flex-1 flex-col" style={{ background: "#313338" }}>
        {/* Channel header */}
        <div className="flex h-12 shrink-0 items-center gap-2 border-b px-4 shadow-sm" style={{ borderColor: "#1e1f22" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b5bac1" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          <span className="text-[13px] font-semibold" style={{ color: "#f2f3f5" }}>general</span>
          <div className="mx-2 h-4 w-px" style={{ background: "#4e5058" }} />
          <span className="text-[12px] truncate" style={{ color: "#949ba4" }}>AWSSBG-UC community · all members welcome</span>
          <div className="ml-auto flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b5bac1" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b5bac1" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          </div>
        </div>

        {/* Video — the actual chat content */}
        <div className="min-h-0 flex-1 overflow-hidden">
          <video src="/video/discord_video.mp4" autoPlay muted loop playsInline className="h-full w-full object-cover" />
        </div>

        {/* Message input bar */}
        <div className="mx-4 mb-4 flex items-center gap-2 rounded-lg px-4 py-2.5" style={{ background: "#383a40" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#949ba4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
          <span className="flex-1 text-[13px]" style={{ color: "#6c6f78" }}>Message #general</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#949ba4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
        </div>
      </div>
    </div>
  );
}

// ─── Discord CTA ──────────────────────────────────────────────────────────────

const DISCORD_PERKS = [
  { text: "Channels for AWS services, study sessions, and job sharing", dot: "bg-[#2c8f8f]" },
  { text: "First to hear about upcoming events and workshops", dot: "bg-[#b89a0a]" },
  { text: "Connect directly with officers, mentors, and alumni", dot: "bg-[#b32a0e]" },
  { text: "Project feedback, career tips, and certification support", dot: "bg-[#3aaa6e]" },
];

function DiscordCTA() {
  return (
    <div className="flex flex-col justify-center">
      <p className="text-xl">Community</p>
      <h2 className={`${hd} mt-3 text-[clamp(4.5rem,9vw,8rem)]`}>
        Where the <span className="text-[#3aaa6e]">community</span> lives.
      </h2>

      <p className="mt-6 max-w-md text-lg leading-snug">
        Ask questions, share projects, get feedback on your AWS journey, and meet members across every year level — all in one place.
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {DISCORD_PERKS.map((p) => (
          <li key={p.text} className="flex items-start gap-3 leading-snug">
            <span aria-hidden="true" className={`mt-1.5 h-3 w-3 shrink-0 ${p.dot}`} />
            {p.text}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <a href={SOCIALS.discord} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
          <DiscordIcon size={18} />
          Join the Discord
        </a>
        <span className="text-[#fff7a1]/70">Free · Open to all members</span>
      </div>

      <div className="mt-6 flex w-fit max-w-full items-center gap-3 border-4 border-[#2c8f8f] px-4 py-2">
        <span className="text-[#fff7a1]/60">discord.gg/</span>
        <span className="font-bold">JxACGrMAMK</span>
        <a
          href={SOCIALS.discord}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open Discord invite"
          className={`ml-2 border-2 border-[#fff7a1]/60 px-2 py-0.5 text-sm transition-colors hover:bg-[#2c8f8f] hover:text-black ${focus}`}
        >
          Open ↗
        </a>
      </div>
    </div>
  );
}

// ─── Facebook CTA (butter panel) ──────────────────────────────────────────────

const FB_PERKS = [
  "Upcoming workshops, hackathons, and org events posted first",
  "Event photos and recaps from every activity",
  "Official org announcements and important updates",
  "Registration links and partner event listings",
];

function FacebookCTA() {
  return (
    <div className="order-1 flex flex-col justify-center lg:order-2">
      <p className="text-xl">Facebook</p>
      <h2 className={`${hd} mt-3 text-[clamp(4rem,8vw,7rem)]`}>
        Events, updates, <span className="text-[#b32a0e]">announcements.</span>
      </h2>

      <p className="mt-6 max-w-md text-lg leading-snug">
        Our Facebook page is the primary channel for official announcements, event postings, and recaps. Follow to stay in the loop.
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {FB_PERKS.map((text) => (
          <li key={text} className="flex items-start gap-3 leading-snug">
            <span aria-hidden="true" className="mt-1.5 h-3 w-3 shrink-0 bg-black" />
            {text}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <a href={SOCIALS.facebook} target="_blank" rel="noopener noreferrer" className={btnDark}>
          <FacebookIcon size={18} />
          Follow on Facebook
        </a>
        <span className="text-black/70">facebook.com/awsccpnc</span>
      </div>
    </div>
  );
}

// ─── Member card ──────────────────────────────────────────────────────────────

function MemberCard({ member, border }: { member: PublicMemberProfile; border: string }) {
  const handle = member.username ?? member.display_name ?? "Member";
  const isMemberId = /^SBG-UC-\d{6}$/.test(member.member_id);

  return (
    <div className={`relative flex h-full w-full flex-col border-4 ${border} transition-colors focus-within:bg-[#fff7a1]/5 hover:bg-[#fff7a1]/5`}>
      <div className="flex items-center gap-4 p-4">
        {member.avatar_url ? (
          <div className="h-16 w-16 shrink-0 border-4 border-[#fff7a1]">
            <PixelPhoto src={member.avatar_url} width={24} height={24} />
          </div>
        ) : (
          <span className={`${hd} flex h-16 w-16 shrink-0 items-center justify-center border-4 border-[#fff7a1] bg-[#fff7a1] text-4xl text-black`}>
            {handle.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <h3 className={`${hd} truncate text-3xl`}>
            {member.username ? (
              // Stretched link: the whole card opens the profile; the GitHub link below sits above it.
              <Link href={`/members/${encodeURIComponent(member.username)}`} className={`after:absolute after:inset-0 ${focus}`}>
                {member.display_name ?? member.username}
              </Link>
            ) : (
              member.display_name ?? "—"
            )}
          </h3>
          {member.username && <p className="truncate text-sm text-[#fff7a1]/70">@{member.username}</p>}
          {isMemberId && <p className="truncate text-xs text-[#fff7a1]/50">{member.member_id}</p>}
        </div>
      </div>

      {member.bio ? (
        <p className="line-clamp-2 px-4 pb-3 text-sm leading-snug text-[#fff7a1]/85">{member.bio}</p>
      ) : (
        <p className="px-4 pb-3 text-sm italic text-[#fff7a1]/40">No bio added.</p>
      )}

      {member.skills && member.skills.length > 0 && (
        <ul className="flex flex-wrap gap-2 px-4 pb-4" aria-label="Skills">
          {member.skills.slice(0, 5).map((skill) => (
            <li key={skill} className="border-2 border-[#fff7a1]/60 px-2 py-0.5 text-xs">
              {skill}
            </li>
          ))}
          {member.skills.length > 5 && (
            <li className="border-2 border-[#fff7a1]/30 px-2 py-0.5 text-xs text-[#fff7a1]/60">+{member.skills.length - 5}</li>
          )}
        </ul>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t-4 border-dashed border-[#fff7a1]/20 px-4 py-3">
        {member.github_username ? (
          <a
            href={`https://github.com/${member.github_username}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${handle} on GitHub`}
            className={`relative z-10 inline-flex items-center gap-2 border-2 border-[#fff7a1]/60 px-2.5 py-1 text-sm transition-colors hover:bg-[#fff7a1] hover:text-black ${focus}`}
          >
            <GitHubIcon size={12} />
            GitHub
          </a>
        ) : (
          <span className="text-sm italic text-[#fff7a1]/40">No socials added.</span>
        )}
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null;

  const prevHref = page > 1 ? `/members?page=${page - 1}` : null;
  const nextHref = page < totalPages ? `/members?page=${page + 1}` : null;

  const windowSize = 5;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, page - half);
  const end = Math.min(totalPages, start + windowSize - 1);
  if (end - start < windowSize - 1) start = Math.max(1, end - windowSize + 1);
  const pageNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const btn = `flex h-10 min-w-[2.5rem] items-center justify-center px-2.5 text-lg transition-colors ${focus}`;
  const btnLink = `${btn} border-4 border-[#2c8f8f] hover:bg-[#2c8f8f] hover:text-black`;
  const btnOff = `${btn} border-4 border-[#fff7a1]/20 text-[#fff7a1]/30`;

  return (
    <nav className="mt-12 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      {prevHref ? (
        <Link href={prevHref} aria-label="Previous page" className={btnLink}>&lt;</Link>
      ) : (
        <span className={btnOff} aria-disabled="true">&lt;</span>
      )}

      {start > 1 && (
        <>
          <Link href="/members?page=1" className={btnLink}>1</Link>
          {start > 2 && <span className={`${btn} text-[#fff7a1]/50`}>…</span>}
        </>
      )}

      {pageNumbers.map((n) =>
        n === page ? (
          <span key={n} aria-current="page" className={`${btn} border-4 border-[#fff7a1] bg-[#fff7a1] text-black shadow-[3px_3px_0_#b32a0e]`}>{n}</span>
        ) : (
          <Link key={n} href={`/members?page=${n}`} className={btnLink}>{n}</Link>
        )
      )}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className={`${btn} text-[#fff7a1]/50`}>…</span>}
          <Link href={`/members?page=${totalPages}`} className={btnLink}>{totalPages}</Link>
        </>
      )}

      {nextHref ? (
        <Link href={nextHref} aria-label="Next page" className={btnLink}>&gt;</Link>
      ) : (
        <span className={btnOff} aria-disabled="true">&gt;</span>
      )}
    </nav>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface MembersPageProps {
  members: PublicMemberProfile[];
  page: number;
  totalPages: number;
  totalCount?: number;
}

export function MembersPage({ members, page, totalPages, totalCount }: MembersPageProps) {
  const shared = totalCount ?? 0;
  return (
    <div className={`${pixel.className} bg-black tracking-normal text-[#fff7a1]`}>

      {/* ── Discord ── */}
      <section className={`${wrap} py-14 sm:py-20`}>
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <DiscordCTA />
          <DiscordMock />
        </div>
      </section>

      {/* ── Facebook (butter panel) ── */}
      <Stripes />
      <section className="bg-[#fff7a1] text-black">
        <div className={`${wrap} py-14 sm:py-20`}>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div className="order-2 border-4 border-black bg-black shadow-[8px_8px_0_#b32a0e] lg:order-1">
              <Image
                src="/images/facebook/facebook_image.png"
                alt="AWSSBG-UC Facebook page"
                width={800}
                height={600}
                className="w-full object-cover"
              />
            </div>
            <FacebookCTA />
          </div>
        </div>
      </section>

      {/* ── Member directory ── */}
      <Stripes />
      <section className={`${wrap} py-14 sm:py-20`}>
        <h2 className={`${hd} text-6xl sm:text-8xl`}>Member directory</h2>
        <p className="mt-5 max-w-xl text-lg leading-relaxed">
          Members who have opted into the public directory.
          {shared > 0 && (
            <span className="ml-1 text-[#fff7a1]/70">
              {shared} {shared !== 1 ? "profiles" : "profile"} shared.
            </span>
          )}
        </p>

        <div className="mt-10">
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center border-4 border-dashed border-[#2c8f8f]/60 px-6 py-20 text-center">
              <p className={`${hd} text-4xl`}>No public profiles yet</p>
              <p className="mt-3 text-[#fff7a1]/70">Members who opt into the directory will appear here.</p>
            </div>
          ) : (
            <>
              <ul
                className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3"
                aria-label={`Members, page ${page} of ${totalPages}`}
              >
                {members.map((member, i) => (
                  <li key={member.member_id} className="flex">
                    <MemberCard member={member} border={CARD_BORDERS[i % CARD_BORDERS.length]} />
                  </li>
                ))}
              </ul>
              <Pagination page={page} totalPages={totalPages} />
              {totalPages > 1 && (
                <p className="mt-4 text-center text-sm text-[#fff7a1]/60">Page {page} of {totalPages}</p>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}