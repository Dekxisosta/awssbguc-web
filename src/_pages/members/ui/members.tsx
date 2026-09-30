"use client";

import Image from "next/image";
import Link from "next/link";
import {
  MessageSquare,
  Bell,
  Users,
  Wrench,
  Calendar,
  Camera,
  Megaphone,
  LinkIcon,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  UserRound,
} from "lucide-react";
import type { PublicMemberProfile } from "@/src/entities/member";
import { SOCIALS } from "@/src/shared/config/socials";

export const membersMetadata = { title: "Community — AWSSBG-UC" };

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
// Colours match Discord's actual dark theme:
//   Server icon rail  #1e1f22
//   Channel sidebar   #2b2d31
//   Chat background   #313338
//   Input area        #383a40
//   Hover channel     #35373c
//   Active channel    #404249 + white text
//   Category label    #949ba4
//   Username (default)#f2f3f5
//   Timestamp / muted #949ba4

const CHANNELS = [
  { id: "announcements", label: "announcements", category: "INFO",            active: false, announce: true },
  { id: "rules",         label: "rules",          category: null,             active: false, announce: false },
  { id: "welcome",       label: "welcome",        category: "AWSSBG-UC",     active: false, announce: false },
  { id: "general",       label: "general",         category: null,            active: true,  announce: false },
  { id: "ask-anything",  label: "ask-anything",    category: null,            active: false, announce: false },
  { id: "tech-news",     label: "tech-news",       category: null,            active: false, announce: false },
  { id: "study-groups",  label: "study-groups",    category: "VOICE",        active: false, announce: false, voice: true },
  { id: "build-brew",    label: "build-and-brew",  category: null,            active: false, announce: false, voice: true },
];

// Mock messages shown in the chat — conversational, AWS-flavoured
const MOCK_MESSAGES = [
  {
    id: "m1",
    user: "Capybara67",
    avatar: "/images/discord/discord.jpg",
    time: "Today at 2:14 PM",
    lines: ["just passed my AWS Cloud Practitioner 🎉", "anyone have tips for Solutions Architect Associate next?"],
    reactions: [{ emoji: "🎉", count: 7 }, { emoji: "🔥", count: 4 }],
  },
  {
    id: "m2",
    user: "rafael_dev",
    avatar: null,
    color: "#57F287",
    time: "Today at 2:16 PM",
    lines: ["congrats!! for SAA I'd start with the official exam guide and do at least 2 practice exams"],
    reactions: [],
  },
  {
    id: "m3",
    user: "cloudgirl.pnc",
    avatar: null,
    color: "#FEE75C",
    time: "Today at 2:18 PM",
    lines: ["Stephane Maarek's course on Udemy is 🐐", "plus check the #tech-news channel — someone shared free whitepapers"],
    reactions: [{ emoji: "👆", count: 5 }],
  },
  {
    id: "m4",
    user: "Capybara67",
    avatar: "/images/discord/discord.jpg",
    time: "Today at 2:19 PM",
    lines: ["saving this thread, thank you all 🙏"],
    reactions: [{ emoji: "❤️", count: 3 }],
  },
];

function DiscordAvatar({ avatar, user, color, size = 32 }: { avatar: string | null; user: string; color?: string; size?: number }) {
  if (avatar) {
    return (
      <div className="shrink-0 overflow-hidden rounded-full" style={{ width: size, height: size }}>
        <Image src={avatar} alt={user} width={size} height={size} className="h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className="shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
      style={{ width: size, height: size, background: color ?? "#5865F2" }}
    >
      {user[0].toUpperCase()}
    </div>
  );
}

function DiscordMock() {
  return (
    <div
      className="flex h-[500px] w-full overflow-hidden rounded-xl shadow-2xl shadow-black/60 sm:h-[540px]"
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MOCK_MESSAGES.map((msg) => (
            <div key={msg.id} className="flex items-start gap-3 group">
              <DiscordAvatar avatar={msg.avatar ?? null} user={msg.user} color={msg.color} size={36} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-[13px] font-semibold" style={{ color: msg.color ?? "#f2f3f5" }}>{msg.user}</span>
                  <span className="text-[10px]" style={{ color: "#949ba4" }}>{msg.time}</span>
                </div>
                {msg.lines.map((line, i) => (
                  <p key={i} className="mt-0.5 text-[13px] leading-[1.375rem]" style={{ color: "#dcddde" }}>{line}</p>
                ))}
                {msg.reactions.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {msg.reactions.map((r) => (
                      <span key={r.emoji} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium cursor-default" style={{ background: "#383a40", color: "#b5bac1" }}>
                        {r.emoji} {r.count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Message input */}
        <div className="mx-4 mb-4 flex items-center gap-2 rounded-lg px-4 py-2.5" style={{ background: "#383a40" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#949ba4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
          <span className="flex-1 text-[13px]" style={{ color: "#6c6f78" }}>Message #general</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#949ba4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
        </div>
      </div>
    </div>
  );
}

// ─── Discord CTA (dark panel) ────────────────────────────────────────────────

const DISCORD_PERKS = [
  { icon: MessageSquare, text: "Channels for AWS services, study sessions, and job sharing" },
  { icon: Bell,          text: "First to hear about upcoming events and workshops" },
  { icon: Users,         text: "Connect directly with officers, mentors, and alumni" },
  { icon: Wrench,        text: "Project feedback, career tips, and certification support" },
] as const;

function DiscordCTA() {
  return (
    <div className="flex flex-col justify-center">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#00e482]">Community</p>

      <h2 className="text-4xl font-bold tracking-tight text-neutral-100 sm:text-5xl">
        Where the{" "}
        <span className="text-[#00e482]">community</span>{" "}
        lives.
      </h2>

      <p className="mt-4 max-w-md text-base leading-relaxed text-neutral-400">
        Ask questions, share projects, get feedback on your AWS journey, and meet members across every year level — all in one place.
      </p>

      <ul className="mt-6 flex flex-col gap-2.5">
        {DISCORD_PERKS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3 text-sm text-neutral-400">
            <Icon size={15} className="mt-0.5 shrink-0 text-[#00e482]" aria-hidden="true" />
            {text}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <a
          href={SOCIALS.discord}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#5865F2] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#4752c4] active:scale-[0.98]"
        >
          <DiscordIcon size={16} />
          Join the Discord
        </a>
        <span className="text-xs text-neutral-600">Free · Open to all members</span>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5">
        <span className="font-mono text-xs text-neutral-600">discord.gg/</span>
        <span className="font-mono text-xs font-semibold text-neutral-400">JxACGrMAMK</span>
        <a
          href={SOCIALS.discord}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open Discord invite"
          className="ml-auto flex items-center gap-1 rounded-md border border-neutral-800 px-2 py-1 text-[11px] font-medium text-neutral-600 transition-colors hover:border-neutral-700 hover:text-neutral-300"
        >
          <ArrowUpRight size={10} />
          Open
        </a>
      </div>
    </div>
  );
}

// ─── Facebook CTA (light panel) ───────────────────────────────────────────────

const FB_PERKS = [
  { icon: Calendar,  text: "Upcoming workshops, hackathons, and org events posted first" },
  { icon: Camera,    text: "Event photos and recaps from every activity" },
  { icon: Megaphone, text: "Official org announcements and important updates" },
  { icon: LinkIcon,  text: "Registration links and partner event listings" },
] as const;

function FacebookCTA() {
  return (
    <div className="order-1 flex flex-col justify-center lg:order-2">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#00e482]">Facebook</p>

      <h2 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
        Events, updates,{" "}
        <span className="text-[#1877F2]">announcements.</span>
      </h2>

      <p className="mt-4 max-w-md text-base leading-relaxed text-neutral-600">
        Our Facebook page is the primary channel for official announcements, event postings, and recaps. Follow to stay in the loop.
      </p>

      <ul className="mt-6 flex flex-col gap-2.5">
        {FB_PERKS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3 text-sm text-neutral-600">
            <Icon size={15} className="mt-0.5 shrink-0 text-neutral-400" aria-hidden="true" />
            {text}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <a
          href={SOCIALS.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1877F2] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#1565d8] active:scale-[0.98]"
        >
          <FacebookIcon size={16} />
          Follow on Facebook
        </a>
        <span className="text-xs text-neutral-400">facebook.com/awsccpnc</span>
      </div>
    </div>
  );
}

// ─── Member card (dark panel) ─────────────────────────────────────────────────

function MemberCard({ member }: { member: PublicMemberProfile }) {
  const handle = member.username ?? member.display_name ?? "Member";
  const isMemberId = /^SBG-UC-\d{6}$/.test(member.member_id);

  return (
    <div className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 transition-colors hover:border-neutral-700">

      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-neutral-800 transition-all group-hover:ring-[#00e482]/20">
          {member.avatar_url ? (
            <Image src={member.avatar_url} alt={`${handle}'s avatar`} fill sizes="40px" className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-neutral-600 bg-neutral-800">
              {handle.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-neutral-100">
            {member.username ? `@${member.username}` : (member.display_name ?? "—")}
          </p>
          {isMemberId && (
            <p className="font-mono text-[10px] text-neutral-600 truncate">{member.member_id}</p>
          )}
        </div>
      </div>

      {member.bio && (
        <p className="px-4 pb-3 text-xs leading-relaxed text-neutral-500 line-clamp-2">{member.bio}</p>
      )}

      {member.skills && member.skills.length > 0 && (
        <div className="flex flex-wrap gap-1 px-4 pb-3" aria-label="Skills">
          {member.skills.slice(0, 5).map((skill) => (
            <span key={skill} className="rounded-full border border-neutral-800 bg-neutral-800/50 px-2 py-0.5 text-[10px] font-medium text-neutral-500">{skill}</span>
          ))}
          {member.skills.length > 5 && (
            <span className="rounded-full border border-neutral-800 bg-neutral-800/50 px-2 py-0.5 text-[10px] font-medium text-neutral-600">+{member.skills.length - 5}</span>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-neutral-800/60 px-4 py-3">
        {member.github_username && (
          <a
            href={`https://github.com/${member.github_username}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${handle} on GitHub`}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-800/40 px-2.5 py-1 text-[11px] font-medium text-neutral-500 transition-colors hover:border-neutral-700 hover:bg-neutral-800 hover:text-neutral-300"
          >
            <GitHubIcon size={11} />
            GitHub
          </a>
        )}
        {member.discord_id && (
          <span
            title={`Discord: ${member.discord_id}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#5865F2]/15 bg-[#5865F2]/8 px-2.5 py-1 text-[11px] font-medium text-[#5865F2] cursor-default select-none"
          >
            <DiscordIcon size={11} />
            Discord
          </span>
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

  const btnBase = "flex h-9 min-w-[2.25rem] items-center justify-center rounded-md px-2.5 text-sm font-medium transition-colors";

  return (
    <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Pagination">
      {prevHref ? (
        <Link href={prevHref} aria-label="Previous page" className={`${btnBase} border border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:bg-neutral-800 hover:text-neutral-200`}>
          <ChevronLeft size={14} />
        </Link>
      ) : (
        <span className={`${btnBase} border border-neutral-800/40 text-neutral-700 cursor-not-allowed`} aria-disabled="true"><ChevronLeft size={14} /></span>
      )}

      {start > 1 && (
        <>
          <Link href="/members?page=1" className={`${btnBase} border border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:bg-neutral-800`}>1</Link>
          {start > 2 && <span className={`${btnBase} text-neutral-700`}>…</span>}
        </>
      )}

      {pageNumbers.map((n) =>
        n === page ? (
          <span key={n} aria-current="page" className={`${btnBase} border border-[#00e482]/30 bg-[#00e482]/10 text-[#00e482]`}>{n}</span>
        ) : (
          <Link key={n} href={`/members?page=${n}`} className={`${btnBase} border border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:bg-neutral-800`}>{n}</Link>
        )
      )}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className={`${btnBase} text-neutral-700`}>…</span>}
          <Link href={`/members?page=${totalPages}`} className={`${btnBase} border border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:bg-neutral-800`}>{totalPages}</Link>
        </>
      )}

      {nextHref ? (
        <Link href={nextHref} aria-label="Next page" className={`${btnBase} border border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:bg-neutral-800 hover:text-neutral-200`}>
          <ChevronRight size={14} />
        </Link>
      ) : (
        <span className={`${btnBase} border border-neutral-800/40 text-neutral-700 cursor-not-allowed`} aria-disabled="true"><ChevronRight size={14} /></span>
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
  return (
    <div>

      {/* ── Section 1: Discord — DARK (matches site's dark sections) ── */}
      <section className="border-b border-neutral-800 bg-[neutral-900]">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <DiscordCTA />
            <DiscordMock />
          </div>
        </div>
      </section>

      {/* ── Section 2: Facebook — LIGHT (matches site's white sections) ── */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            {/* Image */}
            <div className="relative order-2 lg:order-1">
              <div className="overflow-hidden rounded-xl border border-neutral-200 shadow-lg shadow-neutral-100">
                <Image
                  src="/images/facebook/facebook_image.png"
                  alt="AWSSBG-UC Facebook page"
                  width={800}
                  height={600}
                  className="w-full object-cover"
                  priority={false}
                />
              </div>
            </div>
            <FacebookCTA />
          </div>
        </div>
      </section>

      {/* ── Section 3: Member directory — DARK ── */}
      <section className="bg-[neutral-900]">
        {/* Header */}
        <div className="border-b border-neutral-800 px-6 py-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-xl font-bold tracking-tight text-neutral-100">Member Directory</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Members who have opted into the public directory.
              {(totalCount ?? 0) > 0 && (
                <span className="ml-1 text-neutral-400">
                  {totalCount} {totalCount !== 1 ? "profiles" : "profile"} shared.
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-6 py-10">
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-800 py-20 text-center">
              <UserRound size={36} className="mb-4 text-neutral-700" aria-hidden="true" />
              <p className="text-sm font-medium text-neutral-400">No public profiles yet</p>
              <p className="mt-1 text-xs text-neutral-600">Members who opt into the directory will appear here.</p>
            </div>
          ) : (
            <>
              <ul
                className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3"
                aria-label={`Members, page ${page} of ${totalPages}`}
              >
                {members.map((member) => (
                  <li key={member.member_id} className="flex">
                    <MemberCard member={member} />
                  </li>
                ))}
              </ul>
              <Pagination page={page} totalPages={totalPages} />
              {totalPages > 1 && (
                <p className="mt-4 text-center text-xs text-neutral-700">Page {page} of {totalPages}</p>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

