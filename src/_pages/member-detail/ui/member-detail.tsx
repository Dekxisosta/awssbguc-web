import Image from "next/image";
import Link from "next/link";
import { bodyFont, hd } from "@/src/shared/config/fonts";
import { Stripes, SidePixels, PixelClouds } from "@/src/widgets/home-client";
import { PixelAvatar } from "@/src/features/profile-edit/ui/PixelAvatar";
import { ExternalLinkIcon, NOTCH, linkCls, pillOnButter } from "@/src/features/profile-edit/ui/pixel";
import { STATUS_COLORS, STATUS_LABELS, fmtShortDate, fmtTime, safeTimeZone } from "@/src/entities/event";
import type { MemberEventSummary, PublicMemberDetail } from "@/src/entities/member";
import type { ShowcaseRepo } from "@/src/entities/showcase";
import { RepoCard } from "@/src/features/repo-showcase/ui/RepoCard";
import { GithubContributions } from "@/src/features/github-graph";
import { Tile } from "@/src/features/profile-edit/ui/Tile";
import { MemberTabs } from "./member-tabs";

/**
 * Public member profile at /members/[username], in the pixel-art direction of the site.
 * Only fields from the `public_member_profiles` view are ever shown, plus the events the member
 * appears in through `event_public_attendees`. Both are opt-in via the directory setting.
 */

const wrap = "mx-auto w-full max-w-page px-5 sm:px-8";
const focus = "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-teal";

export interface MemberDetailPageProps {
  member: PublicMemberDetail;
  /** Events that have not finished yet (upcoming or ongoing), soonest first. */
  upcoming: MemberEventSummary[];
  /** Finished or cancelled events, most recent first. */
  past: MemberEventSummary[];
  /** Showcased GitHub repos (up to 3) with their pictures. Empty when none. */
  repos?: ShowcaseRepo[];
}

/** SBG-UC-YYXXXX → the four-digit-plus-year badge number, and the year the member joined. */
function memberSinceYear(memberId: string): string | null {
  const m = memberId.match(/^SBG-UC-(\d{2})\d{4}$/);
  if (!m) return null;
  const yy = parseInt(m[1], 10);
  return String(yy < 50 ? 2000 + yy : 1900 + yy);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-pix-butter/60">{label}</dt>
      <dd className="break-words text-lg leading-tight">{children}</dd>
    </div>
  );
}

const notSet = <span className="text-pix-butter/50">Not set</span>;

// ─── Event row ────────────────────────────────────────────────────────────────

function EventRowCard({ event }: { event: MemberEventSummary }) {
  const color = STATUS_COLORS[event.status];
  const tz = safeTimeZone(event.timezone);
  const start = new Date(event.starts_at);
  const day = start.toLocaleDateString("en-PH", { day: "numeric", timeZone: tz });
  const month = start.toLocaleDateString("en-PH", { month: "short", timeZone: tz });

  return (
    <li
      className="relative flex gap-4 border-4 bg-black p-4 transition-transform focus-within:translate-x-[2px] focus-within:translate-y-[2px] hover:translate-x-[2px] hover:translate-y-[2px]"
      style={{ borderColor: color, boxShadow: `5px 5px 0 ${color}` }}
    >
      <div
        aria-hidden="true"
        className="flex h-16 w-16 shrink-0 flex-col items-center justify-center text-black"
        style={{ background: color }}
      >
        <span className={`${hd} text-4xl`}>{day}</span>
        <span className="text-sm uppercase leading-none">{month}</span>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className={`${hd} break-words text-3xl`}>
          {/* Stretched link: the whole row is the click target. */}
          <Link href={`/events/${event.slug}`} className={`after:absolute after:inset-0 ${focus}`}>
            {event.name}
          </Link>
        </h3>
        <p className="mt-1 text-base text-pix-butter/70">
          {fmtShortDate(event.starts_at, tz)} · {fmtTime(event.starts_at, tz)}
          {event.location ? ` · ${event.location}` : ""}
        </p>
      </div>

      <span className="h-fit shrink-0 px-2 py-0.5 text-sm text-black" style={{ background: color }}>
        {STATUS_LABELS[event.status]}
      </span>
    </li>
  );
}

function EventGroup({ title, id, events }: { title: string; id: string; events: MemberEventSummary[] }) {
  if (events.length === 0) return null;
  return (
    <div>
      <h3 id={id} className="text-xl">
        {title} <span className="text-pix-butter/60">({events.length})</span>
      </h3>
      <ul aria-labelledby={id} className="mt-4 space-y-5">
        {events.map((e) => (
          <EventRowCard key={e.event_id} event={e} />
        ))}
      </ul>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function MemberDetailPage({ member, upcoming, past, repos = [] }: MemberDetailPageProps) {
  const name = member.display_name ?? member.username ?? "Member";
  const isMemberId = /^SBG-UC-\d{6}$/.test(member.member_id);
  const skills = member.skills ?? [];
  const role = isMemberId ? "SBG Member" : "Participant";
  const sinceYear = isMemberId ? memberSinceYear(member.member_id) : null;
  const memberIdDisplay = isMemberId ? member.member_id.replace(/^SBG-UC-(\d{2})(\d{4})$/, "$1$2") : null;
  const hasEvents = upcoming.length + past.length > 0;

  return (
    <div className={`${bodyFont.className} relative isolate bg-black tracking-normal text-pix-butter`}>
      <PixelClouds />
      <SidePixels side="left" />
      <SidePixels side="right" />

      <div className="relative z-10">
        <div className={`${wrap} pt-8 sm:pt-10`}>
          <Link href="/members" className={`inline-block pb-6 text-lg underline underline-offset-4 ${focus}`}>
            ← Members
          </Link>
        </div>

        <Stripes className="h-4" />

        {/* ── Member pass + details (same layout as /profile) ── */}
        <section className={`${wrap} pb-16 sm:pb-24`}>
          <h1 className="sr-only">{name}</h1>

          <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-12 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-14">
            {/* The pass */}
            <div className="mx-auto flex w-full min-w-0 max-w-[400px] flex-col items-center">
              {/* Lanyard strap hanging from the stripe divider, and the clip that holds the badge. */}
              <div aria-hidden="true" className="h-12 w-16 bg-stripes sm:h-16" />
              <div
                aria-hidden="true"
                className="relative z-10 -mb-3 h-6 w-24 border-4 border-black bg-pix-mustard shadow-pixel-ink-3"
              />

              <article
                aria-label="Member pass"
                className="relative w-full border-4 border-black bg-pix-butter text-black shadow-pixel-teal-8"
              >
                <Stripes className="h-4" />

                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Image src="/icons/logo.webp" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
                    <span>AWSSBG-UC member pass</span>
                  </div>

                  <div className="mt-5 flex items-center gap-4">
                    <div className="relative block h-28 w-28 shrink-0 border-4 border-black bg-black sm:h-32 sm:w-32">
                      {member.avatar_url ? (
                        <PixelAvatar src={member.avatar_url} size={32} />
                      ) : (
                        <span className={`${hd} flex h-full w-full items-center justify-center text-6xl text-pix-butter`} aria-hidden="true">
                          {name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className={`${hd} break-words text-4xl sm:text-5xl`}>{name}</p>
                      {member.username && <p className="mt-2 break-all text-lg leading-tight">@{member.username}</p>}
                      <p className="text-sm text-black/70">
                        {role}
                        {sinceYear ? ` · since ${sinceYear}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    {memberIdDisplay ? (
                      <span
                        className={`${hd} inline-block bg-pix-rust px-6 py-2 text-3xl text-pix-butter sm:text-4xl`}
                        style={{ clipPath: NOTCH }}
                      >
                        ID: {memberIdDisplay}
                      </span>
                    ) : (
                      <span className="inline-block bg-pix-mustard px-6 py-2 text-lg text-black" style={{ clipPath: NOTCH }}>
                        No member ID yet
                      </span>
                    )}
                  </div>

                  {member.github_username && (
                    <div className="mt-6 flex flex-wrap items-center gap-2 border-t-4 border-dashed border-black/30 pt-5">
                      <a
                        href={`https://github.com/${encodeURIComponent(member.github_username)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={pillOnButter}
                      >
                        GitHub <ExternalLinkIcon />
                      </a>
                    </div>
                  )}
                </div>
              </article>
            </div>

            {/* Detail tiles: About stays on top, then Showcase / Details tabs (same as /profile) */}
            <div className="flex min-w-0 flex-col gap-5 lg:pt-12">
              <Tile id="tile-about" title="About" border="border-pix-teal" headingClass={hd}>
                {member.bio ? (
                  <p className="whitespace-pre-line break-words text-xl leading-snug">{member.bio}</p>
                ) : (
                  <p className="text-xl italic leading-snug text-pix-butter/50">No bio added.</p>
                )}
                {skills.length > 0 && (
                  <ul aria-label="Skills" className={`flex flex-wrap gap-2 ${member.bio ? "mt-4" : "mt-3"}`}>
                    {skills.map((skill) => (
                      <li key={skill} className="border-2 border-pix-butter/60 px-2 py-0.5 text-sm">
                        {skill}
                      </li>
                    ))}
                  </ul>
                )}
              </Tile>

              <MemberTabs
                headingClass={hd}
                defaultTab={repos.length > 0 || member.github_username ? "showcase" : "details"}
                showcase={
                  <div className="flex flex-col gap-5">
                    {member.github_username && (
                      <GithubContributions username={member.github_username} headingClass={hd} />
                    )}
                    <Tile id="tile-showcase" title="Showcase" border="border-pix-rust" headingClass={hd}>
                      {repos.length > 0 ? (
                        <ul className="grid gap-3">
                          {repos.map((repo) => (
                            <RepoCard key={repo.repo_id} repo={repo} headingClass={hd} />
                          ))}
                        </ul>
                      ) : (
                        <p className="text-lg leading-snug text-pix-butter/60">No repos showcased yet.</p>
                      )}
                    </Tile>
                  </div>
                }
                details={
                  <Tile id="tile-details" title="Details" border="border-pix-mustard" headingClass={hd}>
                    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                      <Field label="Display name">{member.display_name ?? notSet}</Field>
                      <Field label="Username">{member.username ? `@${member.username}` : notSet}</Field>
                      <Field label="GitHub">
                        {member.github_username ? (
                          <a
                            href={`https://github.com/${encodeURIComponent(member.github_username)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={linkCls}
                          >
                            {member.github_username}
                          </a>
                        ) : (
                          notSet
                        )}
                      </Field>
                      <Field label="Member ID">{isMemberId ? member.member_id : notSet}</Field>
                    </dl>
                  </Tile>
                }
              />
            </div>
          </div>
        </section>

        <Stripes className="h-4" />

        {/* ── Events ── */}
        <section aria-labelledby="events-heading" className={`${wrap} py-12 sm:py-16`}>
          <h2 id="events-heading" className={`${hd} text-5xl sm:text-6xl`}>
            Events
          </h2>

          {hasEvents ? (
            <div className="mt-8 max-w-3xl space-y-12">
              <EventGroup id="coming-up" title="Coming up" events={upcoming} />
              <EventGroup id="past-events" title="Past events" events={past} />
            </div>
          ) : (
            <div className="mt-8 max-w-xl border-4 border-dashed border-pix-teal/60 px-6 py-10">
              <p className={`${hd} text-4xl`}>No events yet</p>
              <p className="mt-3 text-lg leading-snug text-pix-butter/70">
                Events {name} registers for will show up here.
              </p>
              <Link
                href="/events"
                className={`mt-6 inline-block border-4 border-pix-butter px-5 py-2 text-lg transition-colors hover:bg-pix-butter hover:text-black ${focus}`}
              >
                Browse events
              </Link>
            </div>
          )}
        </section>

        <Stripes className="h-4" />
      </div>
    </div>
  );
}
