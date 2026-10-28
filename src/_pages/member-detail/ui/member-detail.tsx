import Link from "next/link";
import { bodyFont, hd } from "@/src/shared/config/fonts";
import { Stripes, SidePixels, PixelClouds, PixelPhoto } from "@/src/widgets/home-client";
import { STATUS_COLORS, STATUS_LABELS, fmtShortDate, fmtTime, safeTimeZone } from "@/src/entities/event";
import type { MemberEventSummary, PublicMemberDetail } from "@/src/entities/member";

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
}

function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

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

export function MemberDetailPage({ member, upcoming, past }: MemberDetailPageProps) {
  const name = member.display_name ?? member.username ?? "Member";
  const isMemberId = /^SBG-UC-\d{6}$/.test(member.member_id);
  const skills = member.skills ?? [];
  const hasEvents = upcoming.length + past.length > 0;

  return (
    <div className={`${bodyFont.className} relative isolate bg-black tracking-normal text-pix-butter`}>
      <PixelClouds />
      <SidePixels side="left" />
      <SidePixels side="right" />

      <div className="relative z-10">
        {/* ── Profile header ── */}
        <header className={`${wrap} pb-12 pt-8 sm:pb-16 sm:pt-10`}>
          <Link href="/members" className={`inline-block text-lg underline underline-offset-4 ${focus}`}>
            ← Community
          </Link>

          <div className="mt-10 grid gap-10 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start sm:gap-12">
            {member.avatar_url ? (
              <div className="h-44 w-44 border-4 border-pix-butter shadow-pixel-teal-8 sm:h-52 sm:w-52">
                <PixelPhoto src={member.avatar_url} width={48} height={48} />
              </div>
            ) : (
              <span
                className={`${hd} flex h-44 w-44 items-center justify-center border-4 border-pix-butter bg-pix-butter text-8xl text-black shadow-pixel-teal-8 sm:h-52 sm:w-52`}
                aria-hidden="true"
              >
                {name.slice(0, 1).toUpperCase()}
              </span>
            )}

            <div className="min-w-0">
              <h1 className={`${hd} break-words text-[clamp(3.5rem,9vw,7.5rem)]`}>{name}</h1>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {member.username && <p className="text-xl text-pix-butter/80">@{member.username}</p>}
                {isMemberId && <span className="border-2 border-pix-butter/60 px-2 py-0.5 text-sm">{member.member_id}</span>}
              </div>

              {member.bio ? (
                <p className="mt-6 max-w-xl whitespace-pre-line text-xl leading-snug">{member.bio}</p>
              ) : (
                <p className="mt-6 text-lg italic text-pix-butter/50">No bio added.</p>
              )}

              {member.github_username && (
                <a
                  href={`https://github.com/${encodeURIComponent(member.github_username)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-6 inline-flex items-center gap-2 border-4 border-pix-butter px-4 py-2 text-lg transition-colors hover:bg-pix-butter hover:text-black ${focus}`}
                >
                  <GitHubIcon />
                  {member.github_username} on GitHub
                </a>
              )}
            </div>
          </div>
        </header>

        <Stripes className="h-4" />

        {/* ── Skills ── */}
        {skills.length > 0 && (
          <>
            <section aria-labelledby="skills-heading" className={`${wrap} py-12 sm:py-16`}>
              <h2 id="skills-heading" className={`${hd} text-5xl sm:text-6xl`}>
                Skills
              </h2>
              <ul className="mt-6 flex flex-wrap gap-3">
                {skills.map((skill) => (
                  <li key={skill} className="border-4 border-pix-mustard px-3 py-1 text-lg">
                    {skill}
                  </li>
                ))}
              </ul>
            </section>
            <Stripes className="h-4" />
          </>
        )}

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
