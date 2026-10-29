"use client";

import Link from "next/link";
import { bodyFont, hd } from "@/src/shared/config/fonts";
import { SidePixels, PixelClouds } from "@/src/widgets/home-client";
import type { PublicMemberProfile } from "@/src/entities/member";
import { SOCIALS } from "@/src/shared/config/socials";

export const membersMetadata = { title: "Members — AWSSBG-UC" };

/**
 * Member directory in the pixel-art direction of the home page:
 * black ground, butter-yellow type, Jersey 10 headlines, square corners, hard offset shadows.
 * Discord and Facebook live on /socials.
 */

const focus = "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-teal";

const CARD_BORDERS = ["border-pix-teal", "border-pix-mustard", "border-pix-rust", "border-pix-green"];

// ─── Avatar ───────────────────────────────────────────────────────────────────

function PixelPhoto({ src, width = 24, height = 24 }: { src: string; width?: number; height?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      style={{ aspectRatio: `${width} / ${height}` }}
      className="block w-full object-cover"
    />
  );
}

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

function GitHubIcon({ size = 14 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

// ─── Quick links ──────────────────────────────────────────────────────────────

const quickLink = `inline-flex items-center gap-2 border-2 border-pix-butter/60 px-3 py-1.5 text-sm transition-colors hover:bg-pix-butter hover:text-black ${focus}`;

function QuickLinks() {
  return (
    <nav aria-label="Quick links" className="mt-6 flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm text-pix-butter/60">Quick links</span>
      <Link href="/socials" className={quickLink}>
        All socials
      </Link>
      <a href={SOCIALS.discord} target="_blank" rel="noopener noreferrer" className={quickLink}>
        <DiscordIcon size={14} />
        Discord ↗
      </a>
      <a href={SOCIALS.facebook} target="_blank" rel="noopener noreferrer" className={quickLink}>
        <FacebookIcon size={14} />
        Facebook ↗
      </a>
    </nav>
  );
}

// ─── Member card ──────────────────────────────────────────────────────────────

const MAX_SKILLS = 4;

function MemberCard({ member, border }: { member: PublicMemberProfile; border: string }) {
  const handle = member.username ?? member.display_name ?? "Member";
  const isMemberId = /^SBG-UC-\d{6}$/.test(member.member_id);
  const skills = member.skills ?? [];

  return (
    <div className={`relative flex h-full w-full flex-col border-2 ${border} transition-colors focus-within:bg-pix-butter/5 hover:bg-pix-butter/5`}>
      <div className="flex items-center gap-3 p-3">
        {member.avatar_url ? (
          <div className="h-12 w-12 shrink-0 border-2 border-pix-butter">
            <PixelPhoto src={member.avatar_url} width={24} height={24} />
          </div>
        ) : (
          <span className={`${hd} flex h-12 w-12 shrink-0 items-center justify-center border-2 border-pix-butter bg-pix-butter text-3xl text-black`}>
            {handle.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <h3 className={`${hd} truncate text-2xl leading-none`}>
            {member.username ? (
              // Stretched link: the whole card opens the profile.
              <Link href={`/members/${encodeURIComponent(member.username)}`} className={`after:absolute after:inset-0 ${focus}`}>
                {member.display_name ?? member.username}
              </Link>
            ) : (
              member.display_name ?? "—"
            )}
          </h3>
          {member.username && <p className="truncate text-xs text-pix-butter/70">@{member.username}</p>}
          {isMemberId && <p className="truncate text-[11px] text-pix-butter/50">{member.member_id}</p>}
        </div>
      </div>
      {member.bio && (
        <p className="line-clamp-3 break-words px-3 pb-3 text-xs leading-snug text-pix-butter/80">{member.bio}</p>
      )}
      {skills.length > 0 && (
        <ul className="flex flex-wrap gap-1 px-3 pb-3" aria-label="Skills">
          {skills.slice(0, MAX_SKILLS).map((skill) => (
            <li key={skill} className="max-w-full truncate border border-pix-butter/50 px-1.5 text-[11px] leading-5">
              {skill}
            </li>
          ))}
          {skills.length > MAX_SKILLS && (
            <li className="px-1 text-[11px] leading-5 text-pix-butter/60">+{skills.length - MAX_SKILLS}</li>
          )}
        </ul>
      )}
      {member.github_username && (
        // z-10 lifts the link above the card's stretched profile link.
        <div className="mt-auto flex flex-wrap gap-2 border-t-2 border-pix-butter/15 px-3 py-2">
          <a
            href={`https://github.com/${encodeURIComponent(member.github_username)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${handle} on GitHub`}
            className={`relative z-10 inline-flex items-center gap-1.5 border-2 border-pix-butter/50 px-2 py-0.5 text-xs transition-colors hover:bg-pix-butter hover:text-black ${focus}`}
          >
            <GitHubIcon />
            GitHub ↗
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Search ───────────────────────────────────────────────────────────────────

function MemberSearch({ query }: { query: string }) {
  return (
    <form action="/members" method="get" role="search" className="mt-8 max-w-xl">
      <label htmlFor="member-search" className="sr-only">Search members</label>
      <div className="flex border-4 border-pix-teal focus-within:border-pix-butter">
        <input
          id="member-search"
          type="search"
          name="q"
          defaultValue={query}
          maxLength={40}
          placeholder="Search name or @username"
          autoComplete="off"
          className="min-w-0 flex-1 bg-black px-3 py-2 text-base text-pix-butter placeholder:text-pix-butter/50 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Search"
          className={`shrink-0 border-l-4 border-pix-teal bg-pix-teal px-3 text-black transition-colors hover:bg-pix-butter ${focus}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
        </button>
      </div>
      {query && (
        <Link href="/members" className={`mt-2 inline-block text-sm underline underline-offset-4 ${focus}`}>
          Clear search
        </Link>
      )}
    </form>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, query }: { page: number; totalPages: number; query: string }) {
  if (totalPages <= 1) return null;

  const href = (n: number) => `/members?${new URLSearchParams({ ...(query ? { q: query } : {}), page: String(n) }).toString()}`;

  const prevHref = page > 1 ? href(page - 1) : null;
  const nextHref = page < totalPages ? href(page + 1) : null;

  const windowSize = 5;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, page - half);
  const end = Math.min(totalPages, start + windowSize - 1);
  if (end - start < windowSize - 1) start = Math.max(1, end - windowSize + 1);
  const pageNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const btn = `flex h-10 min-w-[2.5rem] items-center justify-center px-2.5 text-lg transition-colors ${focus}`;
  const btnLink = `${btn} border-4 border-pix-teal hover:bg-pix-teal hover:text-black`;
  const btnOff = `${btn} border-4 border-pix-butter/20 text-pix-butter/30`;

  return (
    <nav className="mt-12 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      {prevHref ? (
        <Link href={prevHref} aria-label="Previous page" className={btnLink}>&lt;</Link>
      ) : (
        <span className={btnOff} aria-disabled="true">&lt;</span>
      )}

      {start > 1 && (
        <>
          <Link href={href(1)} className={btnLink}>1</Link>
          {start > 2 && <span className={`${btn} text-pix-butter/50`}>…</span>}
        </>
      )}

      {pageNumbers.map((n) =>
        n === page ? (
          <span key={n} aria-current="page" className={`${btn} border-4 border-pix-butter bg-pix-butter text-black shadow-pixel-rust-3`}>{n}</span>
        ) : (
          <Link key={n} href={href(n)} className={btnLink}>{n}</Link>
        )
      )}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className={`${btn} text-pix-butter/50`}>…</span>}
          <Link href={href(totalPages)} className={btnLink}>{totalPages}</Link>
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
  /** Active search text (empty when not searching). */
  query?: string;
  /** Number of members matching the search (equals totalCount when not searching). */
  matchCount?: number;
}

export function MembersPage({ members, page, totalPages, totalCount, query = "", matchCount }: MembersPageProps) {
  const shared = totalCount ?? 0;
  const matches = matchCount ?? shared;
  return (
    <div className={`${bodyFont.className} relative isolate bg-black tracking-normal text-pix-butter`}>
      <PixelClouds />
      <SidePixels side="left" />
      <SidePixels side="right" />

      <section className="relative z-10 mx-auto w-full max-w-[1300px] px-5 py-14 sm:px-8 sm:py-20">
        <p className="text-xl">Members</p>
        <h1 className={`${hd} mt-3 text-[clamp(3.5rem,8vw,6.5rem)] leading-[0.9]`}>
          Meet the <span className="text-pix-green">community</span>.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-snug">
          Members who have opted into the public directory.
          {shared > 0 && (
            <span className="ml-1 text-pix-butter/70">
              {query
                ? `${matches} of ${shared} ${shared !== 1 ? "profiles" : "profile"} match.`
                : `${shared} ${shared !== 1 ? "profiles" : "profile"} shared.`}
            </span>
          )}
        </p>

        <QuickLinks />

        <MemberSearch query={query} />

        <div className="mt-10">
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center border-4 border-dashed border-pix-teal/60 px-6 py-20 text-center">
              <p className={`${hd} text-4xl`}>{query ? "No matches" : "No public profiles yet"}</p>
              <p className="mt-3 text-pix-butter/70">
                {query ? "Try a different name or username." : "Members who opt into the directory will appear here."}
              </p>
            </div>
          ) : (
            <>
              <ul
                className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                aria-label={`Members, page ${page} of ${totalPages}`}
              >
                {members.map((member, i) => (
                  <li key={member.member_id} className="flex">
                    <MemberCard member={member} border={CARD_BORDERS[i % CARD_BORDERS.length]} />
                  </li>
                ))}
              </ul>
              <Pagination page={page} totalPages={totalPages} query={query} />
              {totalPages > 1 && (
                <p className="mt-4 text-center text-sm text-pix-butter/60">Page {page} of {totalPages}</p>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
