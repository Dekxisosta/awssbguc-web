"use client";

import Image from "next/image";
import Link from "next/link";
import type { PublicMemberProfile } from "@/src/entities/member";
import { SOCIALS } from "@/src/shared/config/socials";

export const membersMetadata = { title: "Community — AWSSBG-UC" };

// ─── Discord icon ─────────────────────────────────────────────────────────────

function DiscordIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

// ─── IDE-style Discord chat mock ──────────────────────────────────────────────

type ChannelType = "text" | "voice" | "announcement" | "rules";

interface MockChannel {
  id: string;
  label: string;
  type: ChannelType;
  category?: string; // starts a new category group when set
  locked?: boolean;  // non-general channels
  icon?: string;     // emoji prefix
}

const MOCK_CHANNELS: MockChannel[] = [
  // ── Info ──────────────────────────────────────────────────────────
  { id: "announcements",    label: "announcements",   type: "announcement", category: "Info",              locked: true, icon: "📢" },
  { id: "about-server",     label: "about-server",    type: "rules",                                        locked: true, icon: "📋" },
  { id: "moderator-only",   label: "moderator-only",  type: "text",                                         locked: true, icon: "🛡️" },
  // ── AWSSBG UC Live! ───────────────────────────────────────────────
  { id: "live-updates",     label: "AWSSBG UC Live!", type: "voice",        category: "AWSSBG UC Live! 🎙", locked: true, icon: "⚡" },
  { id: "build-and-brew",   label: "Build & Brew",    type: "voice",                                        locked: true, icon: "☕" },
  { id: "community-hangout",label: "Community H...",  type: "voice",                                        locked: true, icon: "💻" },
  // ── AWSSBG UC - Channels ──────────────────────────────────────────
  { id: "welcome",          label: "welcome",         type: "text",         category: "AWSSBG UC - Channels", locked: true, icon: "👋" },
  { id: "general",          label: "general",         type: "text",                                         locked: false },
  { id: "ask-anything",     label: "ask-anything",    type: "text",                                         locked: true, icon: "❓" },
  { id: "celebrations",     label: "celebrations",    type: "text",                                         locked: true, icon: "🎉" },
  { id: "tech-news",        label: "tech-news",       type: "text",                                         locked: true, icon: "📰" },
  { id: "collab-requests",  label: "collab-requests", type: "text",                                         locked: true, icon: "🤝" },
];


function IDEChatMock() {
  const activeChannel = "general";

  return (
    <div
      className="flex h-[480px] w-full flex-col overflow-hidden rounded-xl border border-neutral-700/80 bg-[#1e1e2e] shadow-2xl shadow-black/40 sm:h-[520px]"
      aria-label="Discord community chat preview"
      role="img"
    >
      {/* Window chrome */}
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-neutral-700/60 bg-[#181825] px-4">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" aria-hidden="true" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" aria-hidden="true" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" aria-hidden="true" />
        <span className="ml-3 font-mono text-[11px] text-neutral-500">discord — AWSSBG-UC</span>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <div className="flex w-36 shrink-0 flex-col border-r border-neutral-700/50 bg-[#181825]">
          {/* Server header */}
          <div className="flex items-center gap-2 border-b border-neutral-700/50 px-3 py-2.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#5865F2]">
              <DiscordIcon size={13} />
            </div>
            <span className="truncate text-[11px] font-bold text-neutral-200">AWSSBG-UC</span>
          </div>

          {/* Channel list */}
          <nav className="mt-1 flex flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Channels">
            {MOCK_CHANNELS.map((ch) => (
              <div key={ch.id}>
                {/* Category header */}
                {ch.category && (
                  <p className="mt-2 px-3 pb-0.5 text-[9px] font-bold uppercase tracking-widest text-neutral-600 truncate">
                    {ch.category}
                  </p>
                )}

                {ch.locked ? (
                  /* Non-interactive locked channel */
                  <div className="flex w-full items-center gap-1.5 px-2 py-[3px] text-[11px] text-neutral-700 cursor-default select-none">
                    {ch.type === "voice" ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-neutral-700" aria-hidden="true">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                    ) : (
                      <span className="shrink-0 text-neutral-700">#</span>
                    )}
                    {ch.icon && <span className="shrink-0 text-[10px] leading-none">{ch.icon}</span>}
                    <span className="truncate">{ch.label}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-auto shrink-0 text-neutral-700" aria-hidden="true">
                      <rect width="11" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                ) : (
                  /* Active channel — #general, styled as selected */
                  <div
                    className="flex w-full items-center gap-1.5 rounded-md px-2 py-[3px] text-left text-[11px] bg-neutral-700/70 font-semibold text-neutral-100 cursor-default select-none"
                  >
                    <span className="shrink-0 text-neutral-500">#</span>
                    <span className="truncate">{ch.label}</span>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Spacer + user bar */}
          <div className="mt-auto border-t border-neutral-700/50 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <div className="relative h-6 w-6 shrink-0">
                <div className="h-6 w-6 rounded-full bg-[#00e482]/20 flex items-center justify-center text-[10px] font-bold text-[#00e482]">
                  Y
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#181825] bg-[#23a559]" aria-hidden="true" />
              </div>
              <span className="truncate text-[10px] text-neutral-400">you</span>
            </div>
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex min-w-0 flex-1 flex-col bg-[#1e1e2e]">
          {/* Channel header */}
          <div className="flex shrink-0 items-center gap-2 border-b border-neutral-700/50 px-4 py-2">
            <span className="text-neutral-500">#</span>
            <span className="text-[12px] font-semibold text-neutral-200">{activeChannel}</span>
            <div className="ml-auto flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-600" aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-600" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          </div>

          {/* Content area — video */}
          <div className="min-h-0 flex-1 overflow-hidden">
            <video
              src="/video/discord_video.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Discord CTA ──────────────────────────────────────────────────────────────

function DiscordCTA() {
  return (
    <div className="flex flex-col justify-center">
      {/* Eyebrow */}
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#5865F2]/30 bg-[#5865F2]/10 px-4 py-1.5 text-sm font-semibold text-[#8b96ff]">
        <DiscordIcon size={14} />
        Community
      </div>

      <h2 className="mt-5 text-4xl font-extrabold tracking-tight text-neutral-100 sm:text-5xl">
        Where the{" "}
        <span className="text-[#00e482]">community</span>{" "}
        lives.
      </h2>

      <p className="mt-4 max-w-md text-lg leading-relaxed text-neutral-400">
        Ask questions, share projects, get feedback on your AWS journey, and meet members across every year level — all in one place.
      </p>

      {/* Perks list */}
      <ul className="mt-6 flex flex-col gap-3">
        {[
          { icon: "💬", text: "Channels for AWS services, study sessions, and job sharing" },
          { icon: "📣", text: "First to hear about upcoming events and workshops" },
          { icon: "🤝", text: "Connect directly with officers, mentors, and alumni" },
          { icon: "🛠️", text: "Project feedback, career tips, and certification support" },
        ].map(({ icon, text }) => (
          <li key={text} className="flex items-start gap-3 text-sm text-neutral-300">
            <span className="mt-0.5 shrink-0 text-base leading-none" aria-hidden="true">{icon}</span>
            {text}
          </li>
        ))}
      </ul>

      {/* CTA button */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <a
          href={SOCIALS.discord}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#5865F2] px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-[#5865F2]/25 transition-all hover:bg-[#4752c4] hover:shadow-[#5865F2]/40 active:scale-[0.98]"
        >
          <DiscordIcon size={18} />
          Join the Discord
        </a>

        <span className="text-xs text-neutral-500">Free, open to all AWSSBG-UC members</span>
      </div>

      {/* Server URL callout */}
      <div className="mt-5 flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5">
        <span className="font-mono text-xs text-neutral-500">discord.gg/</span>
        <span className="font-mono text-xs font-semibold text-[#8b96ff]">JxACGrMAMK</span>
        <a
          href={SOCIALS.discord}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open Discord invite"
          className="ml-auto flex items-center gap-1 rounded-md border border-neutral-700 px-2 py-1 text-[11px] font-medium text-neutral-400 transition-colors hover:border-[#5865F2]/50 hover:text-[#8b96ff]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Open
        </a>
      </div>
    </div>
  );
}

// ─── Member card ─────────────────────────────────────────────────────────────

function MemberCard({ member }: { member: PublicMemberProfile }) {
  const handle = member.username ?? member.display_name ?? "Member";
  const isMemberId = /^SBG-UC-\d{6}$/.test(member.member_id);

  return (
    <div className="group flex h-full w-full flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 transition-colors hover:border-neutral-700 hover:bg-neutral-800/60">
      {/* Top row — avatar + identity */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        {/* Avatar */}
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-neutral-700 transition-all group-hover:ring-[#00e482]/40">
          {member.avatar_url ? (
            <Image
              src={member.avatar_url}
              alt={`${handle}'s avatar`}
              fill
              sizes="44px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-bold text-neutral-400 bg-neutral-800">
              {handle.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
        {/* Identity */}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-neutral-100">
            {member.username ? `@${member.username}` : (member.display_name ?? "—")}
          </p>
          {isMemberId && (
            <p className="font-mono text-[10px] text-neutral-500 truncate">{member.member_id}</p>
          )}
        </div>
      </div>

      {/* Bio */}
      {member.bio && (
        <p className="px-4 pb-2 text-xs leading-relaxed text-neutral-400 line-clamp-2">
          {member.bio}
        </p>
      )}

      {/* Skills */}
      {member.skills && member.skills.length > 0 && (
        <div className="flex flex-wrap gap-1 px-4 pb-2" aria-label="Skills">
          {member.skills.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-neutral-400"
            >
              {skill}
            </span>
          ))}
          {member.skills.length > 5 && (
            <span className="rounded-full border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
              +{member.skills.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Social link buttons — at least one is guaranteed by the view filter */}
      <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-neutral-800 px-4 py-3">
        {member.github_username && (
          <a
            href={`https://github.com/${member.github_username}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${handle} on GitHub`}
            className="inline-flex items-center gap-1.5 rounded-md border border-neutral-700 bg-neutral-800 px-2.5 py-1 text-[11px] font-medium text-neutral-300 transition-colors hover:border-neutral-500 hover:bg-neutral-700 hover:text-neutral-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
            GitHub
          </a>
        )}
        {member.discord_id && (
          <span
            title={`Discord: ${member.discord_id}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#5865F2]/30 bg-[#5865F2]/10 px-2.5 py-1 text-[11px] font-medium text-[#8b96ff] cursor-default select-none"
          >
            <DiscordIcon size={12} />
            Discord
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Pagination controls ──────────────────────────────────────────────────────

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

  const btnBase =
    "flex h-9 min-w-[2.25rem] items-center justify-center rounded-md px-2.5 text-sm font-medium transition-colors";

  return (
    <nav className="mt-10 flex items-center justify-center gap-1" aria-label="Pagination">
      {prevHref ? (
        <Link href={prevHref} aria-label="Previous page" className={`${btnBase} border border-neutral-700 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800 hover:text-neutral-100`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        </Link>
      ) : (
        <span className={`${btnBase} border border-neutral-800 text-neutral-700 cursor-not-allowed`} aria-disabled="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        </span>
      )}

      {start > 1 && (
        <>
          <Link href="/members?page=1" className={`${btnBase} border border-neutral-700 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800`}>1</Link>
          {start > 2 && <span className={`${btnBase} text-neutral-600`}>…</span>}
        </>
      )}

      {pageNumbers.map((n) =>
        n === page ? (
          <span key={n} aria-current="page" className={`${btnBase} border border-[#00e482]/50 bg-[#00e482]/10 text-[#00e482]`}>{n}</span>
        ) : (
          <Link key={n} href={`/members?page=${n}`} className={`${btnBase} border border-neutral-700 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800`}>{n}</Link>
        )
      )}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className={`${btnBase} text-neutral-600`}>…</span>}
          <Link href={`/members?page=${totalPages}`} className={`${btnBase} border border-neutral-700 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800`}>{totalPages}</Link>
        </>
      )}

      {nextHref ? (
        <Link href={nextHref} aria-label="Next page" className={`${btnBase} border border-neutral-700 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800 hover:text-neutral-100`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
        </Link>
      ) : (
        <span className={`${btnBase} border border-neutral-800 text-neutral-700 cursor-not-allowed`} aria-disabled="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
        </span>
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
      {/* ── Community hero: CTA left, IDE mock right ── */}
      <section className="border-b border-neutral-800 bg-[#0d1117]">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <DiscordCTA />
            <IDEChatMock />
          </div>
        </div>
      </section>

      {/* ── Facebook section ── */}
      <section className="border-b border-neutral-800 bg-[#0a0f1a]">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">

            {/* Image — phone/post mockup */}
            <div className="relative order-2 lg:order-1">
              {/* Subtle glow behind the image */}
              <div
                className="pointer-events-none absolute inset-0 -z-10 blur-3xl opacity-20"
                aria-hidden="true"
                style={{ background: "radial-gradient(ellipse at 50% 60%, #1877F2 0%, transparent 70%)" }}
              />
              <div className="overflow-hidden rounded-2xl border border-neutral-800 shadow-2xl shadow-black/50">
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

            {/* CTA */}
            <div className="order-1 flex flex-col justify-center lg:order-2">
              {/* Eyebrow */}
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#1877F2]/30 bg-[#1877F2]/10 px-4 py-1.5 text-sm font-semibold text-[#5b9bff]">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </div>

              <h2 className="mt-5 text-4xl font-extrabold tracking-tight text-neutral-100 sm:text-5xl">
                Events, updates,{" "}
                <span className="text-[#5b9bff]">announcements.</span>
              </h2>

              <p className="mt-4 max-w-md text-lg leading-relaxed text-neutral-400">
                Our Facebook page is the primary channel for official announcements, event postings, and recaps. Follow to stay in the loop.
              </p>

              {/* Feature list */}
              <ul className="mt-6 flex flex-col gap-3">
                {[
                  { icon: "📅", text: "Upcoming workshops, hackathons, and org events posted first" },
                  { icon: "📸", text: "Event photos and recaps from every activity" },
                  { icon: "📣", text: "Official org announcements and important updates" },
                  { icon: "🔗", text: "Registration links and partner event listings" },
                ].map(({ icon, text }) => (
                  <li key={text} className="flex items-start gap-3 text-sm text-neutral-300">
                    <span className="mt-0.5 shrink-0 text-base leading-none" aria-hidden="true">{icon}</span>
                    {text}
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href={SOCIALS.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#1877F2] px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-[#1877F2]/25 transition-all hover:bg-[#1565d8] hover:shadow-[#1877F2]/40 active:scale-[0.98]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Follow on Facebook
                </a>
                <span className="text-xs text-neutral-500">facebook.com/awsccpnc</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Members section ── */}
      <section>
        <div className="border-b border-neutral-800 bg-neutral-900/60 px-6 py-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-2xl font-bold tracking-tight text-neutral-100">
              Members
            </h2>
            <p className="mt-1.5 text-sm text-neutral-400">
              Members who have opted into the public directory.{" "}
              {(totalCount ?? 0) > 0 && (
                <span className="text-neutral-300">
                  {totalCount} {totalCount !== 1 ? "profiles" : "profile"} shared.
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-6 py-12">
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 py-20 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-neutral-600" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
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
                <p className="mt-4 text-center text-xs text-neutral-600">
                  Page {page} of {totalPages}
                </p>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
