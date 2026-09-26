import Image from "next/image";
import Link from "next/link";
import type { PublicMemberProfile } from "@/src/entities/member";

export const membersMetadata = { title: "Members — AWSSBG-UC" };

interface MembersPageProps {
  members: PublicMemberProfile[];
  page: number;
  totalPages: number;
  totalCount?: number;
}

// ─── Member card ─────────────────────────────────────────────────────────────

function MemberCard({ member }: { member: PublicMemberProfile }) {
  const handle = member.username ?? member.display_name ?? "Member";
  const isMemberId = /^SBG-UC-\d{6}$/.test(member.member_id);

  return (
    // h-full makes this card stretch to fill the grid cell, so all cards in a
    // row share the same height (CSS grid aligns them automatically).
    <div className="group flex h-full w-full flex-row items-stretch gap-0 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 transition-colors hover:border-neutral-700 hover:bg-neutral-800/60">

      {/* Left — avatar */}
      <div className="flex w-20 shrink-0 items-center justify-center bg-neutral-800/40 p-3">
        <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-neutral-700 transition-all group-hover:ring-[#00e482]/40">
          {member.avatar_url ? (
            <Image
              src={member.avatar_url}
              alt={`${handle}'s avatar`}
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-base font-bold text-neutral-400">
              {handle.slice(0, 1).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Right — details */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 px-3 py-3">
        {/* Handle */}
        <p className="truncate text-sm font-semibold text-neutral-100">
          {member.username ? `@${member.username}` : (member.display_name ?? "—")}
        </p>

        {/* Member ID badge */}
        {isMemberId && (
          <p className="font-mono text-[10px] text-neutral-500">{member.member_id}</p>
        )}

        {/* Social links */}
        <div className="flex flex-wrap items-center gap-1.5">
          {member.github_username && (
            <a
              href={`https://github.com/${member.github_username}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${handle} on GitHub`}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-neutral-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              {member.github_username}
            </a>
          )}

          {member.discord_id && (
            <span
              title={`Discord ID: ${member.discord_id}`}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-neutral-400 cursor-default select-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="#5865F2" aria-hidden="true">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span className="text-[#5865F2]">Discord</span>
            </span>
          )}

          {!member.github_username && !member.discord_id && (
            <span className="text-[11px] text-neutral-700">No socials linked</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Pagination controls ──────────────────────────────────────────────────────

function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null;

  const prevHref = page > 1 ? `/members?page=${page - 1}` : null;
  const nextHref = page < totalPages ? `/members?page=${page + 1}` : null;

  // Show a window of up to 5 page numbers centred around the current page.
  const windowSize = 5;
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, page - half);
  const end = Math.min(totalPages, start + windowSize - 1);
  if (end - start < windowSize - 1) start = Math.max(1, end - windowSize + 1);
  const pageNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  const btnBase =
    "flex h-9 min-w-[2.25rem] items-center justify-center rounded-md px-2.5 text-sm font-medium transition-colors";

  return (
    <nav
      className="mt-10 flex items-center justify-center gap-1"
      aria-label="Pagination"
    >
      {/* Previous */}
      {prevHref ? (
        <Link
          href={prevHref}
          aria-label="Previous page"
          className={`${btnBase} border border-neutral-700 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800 hover:text-neutral-100`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
      ) : (
        <span className={`${btnBase} border border-neutral-800 text-neutral-700 cursor-not-allowed`} aria-disabled="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </span>
      )}

      {/* Leading ellipsis */}
      {start > 1 && (
        <>
          <Link href="/members?page=1" className={`${btnBase} border border-neutral-700 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800`}>1</Link>
          {start > 2 && <span className={`${btnBase} text-neutral-600`}>…</span>}
        </>
      )}

      {/* Page numbers */}
      {pageNumbers.map((n) =>
        n === page ? (
          <span
            key={n}
            aria-current="page"
            className={`${btnBase} border border-[#00e482]/50 bg-[#00e482]/10 text-[#00e482]`}
          >
            {n}
          </span>
        ) : (
          <Link
            key={n}
            href={`/members?page=${n}`}
            className={`${btnBase} border border-neutral-700 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800`}
          >
            {n}
          </Link>
        )
      )}

      {/* Trailing ellipsis */}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className={`${btnBase} text-neutral-600`}>…</span>}
          <Link href={`/members?page=${totalPages}`} className={`${btnBase} border border-neutral-700 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800`}>
            {totalPages}
          </Link>
        </>
      )}

      {/* Next */}
      {nextHref ? (
        <Link
          href={nextHref}
          aria-label="Next page"
          className={`${btnBase} border border-neutral-700 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-800 hover:text-neutral-100`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Link>
      ) : (
        <span className={`${btnBase} border border-neutral-800 text-neutral-700 cursor-not-allowed`} aria-disabled="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </span>
      )}
    </nav>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function MembersPage({ members, page, totalPages, totalCount }: MembersPageProps) {
  return (
    <div>
      {/* Hero */}
      <section className="border-b border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-900">
        <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00e482]/30 bg-[#00e482]/10 px-4 py-1.5 text-sm font-semibold text-[#00e482]">
            <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
            </svg>
            Community
          </span>
          <h1 className="mt-4 text-5xl font-extrabold tracking-tight text-neutral-100 sm:text-6xl">
            Members
          </h1>
          <p className="mt-4 max-w-xl text-lg text-neutral-400">
            Meet the people of AWSSBG-UC.{" "}
            {(totalCount ?? 0) > 0 && (
              <span className="text-neutral-300">
                {totalCount} participant{totalCount !== 1 ? "s" : ""} and counting.
              </span>
            )}
          </p>
        </div>
      </section>

      {/* Grid + pagination */}
      <div className="mx-auto max-w-5xl px-6 py-12">
        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 py-20 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-neutral-600" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <p className="text-sm font-medium text-neutral-400">No members yet</p>
            <p className="mt-1 text-xs text-neutral-600">Active participants will appear here.</p>
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

            {/* Page indicator */}
            {totalPages > 1 && (
              <p className="mt-4 text-center text-xs text-neutral-600">
                Page {page} of {totalPages}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
