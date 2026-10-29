"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import type { ShowcaseRepo } from "@/src/entities/showcase";
import type { MembershipRow } from "@/src/entities/member";
import { fullName as formatFullName, type StudentExtras } from "@/src/entities/student-data";
import { MAX_SHOWCASE_REPOS } from "@/src/entities/showcase";
import { GithubContributions } from "@/src/features/github-graph";
import { RepoCard, useRepoShowcase } from "@/src/features/repo-showcase";
import { useProfile, type ProfileApi } from "../model/useProfile";
import { AboutEdit, DetailsEdit, ShowcaseEdit } from "./ProfileEditTiles";
import { Modal } from "./Modal";
import { PixelAvatar } from "./PixelAvatar";
import { Tabs, type TabDef } from "./Tabs";
import { Tile } from "./Tile";
import {
  ExternalLinkIcon,
  NOTCH,
  PencilIcon,
  Stripes,
  btnDark,
  btnOutline,
  btnSmGhost,
  btnSmSolid,
  focus,
  linkCls,
  pillOnButter,
  wrap,
} from "./pixel";

export interface ProfileCardProps {
  initialUsername: string | null;
  /** Not displayed (there is no Discord field in the UI yet); accepted so the page can pass its full prop set. */
  discordId?: string | null;
  githubUsername: string | null;
  memberId: string | null;
  fullName: string;
  email: string;
  initialAvatarUrl: string | null;
  qrToken: string | null;
  displayName: string | null;
  participantId: string | null;
  /** ISO timestamp, set when the user has requested account deletion */
  deletionScheduledAt: string | null;
  /** Whether the profile is opted into the public directory */
  directoryVisible: boolean;
  /** Short public bio (max 280 chars) */
  bio: string | null;
  /** Self-reported skill tags */
  skills: string[] | null;
  /** ISO timestamp of the one-time username change; null means it hasn't been used */
  usernameChangedAt: string | null;
  /** The member's showcased GitHub repos (up to 3), each with its picture */
  initialRepos?: ShowcaseRepo[];
  /** Linked membership record (student data); null when none */
  membership?: MembershipRow | null;
  /** Read-only extras historical student rows may carry */
  extras?: StudentExtras | null;
  /** True when the membership record could not be loaded */
  membershipUnavailable?: boolean;
  /** next/font class of the page wrapper (modals portal out of it, so they need it passed in) */
  bodyClass: string;
  /** Headline font class (Jersey 10) */
  headingClass: string;
}

type TabId = "showcase" | "details";
const TABS: TabDef<TabId>[] = [
  { id: "showcase", label: "Showcase" },
  { id: "details", label: "Details" },
];

/** Small Edit / Done switch used by the About me tile and the tab bar. */
function EditToggle({ editing, onClick, label }: { editing: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={editing}
      aria-label={editing ? "Done editing" : label}
      className={editing ? btnSmSolid : btnSmGhost}
    >
      {editing ? (
        "Done"
      ) : (
        <>
          Edit <PencilIcon size={13} />
        </>
      )}
    </button>
  );
}

/** Compact public-directory switch for the member pass (dark-on-butter). Saves immediately. */
function DirectoryRow({ api }: { api: ProfileApi }) {
  const { profile, save } = api;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    const err = await save.directoryVisible(!profile.directoryVisible);
    if (err) setError(err);
    setBusy(false);
  }

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={profile.directoryVisible}
            aria-label="Show profile in public member directory"
            onClick={toggle}
            disabled={busy}
            className={`relative inline-block h-7 w-14 shrink-0 border-4 border-black transition-colors disabled:opacity-50 ${focus} ${
              profile.directoryVisible ? "bg-pix-green" : "bg-white"
            }`}
          >
            <span
              aria-hidden="true"
              className={`absolute top-0.5 h-3 w-3 bg-black transition-[left] ${
                profile.directoryVisible ? "left-[calc(100%-1rem)]" : "left-0.5"
              }`}
            />
          </button>
          <span className="text-sm uppercase tracking-wide">
            Directory: {profile.directoryVisible ? "Public" : "Private"}
          </span>
        </div>
        {/* Public with a username: link to the member's own public page; otherwise the directory. */}
        {profile.directoryVisible && profile.username ? (
          <Link
            href={`/members/${profile.username}`}
            className="text-sm underline decoration-2 underline-offset-2 hover:bg-black hover:text-pix-butter"
          >
            View my public profile
          </Link>
        ) : (
          <Link href="/members" className="text-sm underline decoration-2 underline-offset-2 hover:bg-black hover:text-pix-butter">
            See the community
          </Link>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-pix-rust">
          {error}
        </p>
      )}
      <p className="mt-1.5 text-xs leading-snug text-black/60">
        {profile.directoryVisible ? (
          <>
            Your photo, name, GitHub, bio and skills show in the member directory. By staying public you agree to our{" "}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline">Terms</a> and{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a>.
          </>
        ) : (
          "Turn on to appear on the community page."
        )}
      </p>
    </div>
  );
}

function memberSinceYear(memberId: string | null): string | null {
  if (!memberId) return null;
  const m = memberId.match(/^SBG-UC-(\d{2})\d{4}$/);
  if (!m) return null;
  const yy = parseInt(m[1], 10);
  return String(yy < 50 ? 2000 + yy : 1900 + yy);
}

// ─── Small building blocks ───────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-pix-butter/60">{label}</dt>
      <dd className="break-words text-lg leading-tight">{children}</dd>
    </div>
  );
}

const notSet = <span className="text-pix-butter/50">Not set</span>;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

// ─── Main component ──────────────────────────────────────────────────────────

/**
 * The profile body: a lanyard "member pass" on the left and detail tiles on the right.
 * Reads like the home page (stripe motif, butter card, hard shadows) while keeping the ID-badge idea of the
 * old container artwork: lanyard strap, clip, ribbon, ID tag, QR at the bottom of the badge.
 */
export function ProfileCard({
  initialUsername,
  githubUsername,
  memberId,
  fullName,
  email,
  initialAvatarUrl,
  qrToken,
  displayName,
  participantId,
  deletionScheduledAt,
  directoryVisible,
  bio,
  skills,
  usernameChangedAt,
  initialRepos = [],
  membership = null,
  extras = null,
  membershipUnavailable = false,
  bodyClass,
  headingClass: hd,
}: ProfileCardProps) {
  const api = useProfile({
    username: initialUsername,
    displayName,
    fullName,
    email,
    githubUsername,
    avatarUrl: initialAvatarUrl,
    directoryVisible,
    bio,
    skills,
    deletionScheduledAt,
  });
  const { profile } = api;
  const showcase = useRepoShowcase(initialRepos, profile.githubUsername);

  const [tab, setTab] = useState<TabId>("showcase");
  // Edit mode is per section: About me, the Showcase tab and the Details tab each switch on their own.
  const [edit, setEdit] = useState({ about: false, showcase: false, details: false });
  const [scrollTo, setScrollTo] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  // The QR encodes an absolute URL, which needs window.location: resolve it after mount so the
  // server-rendered markup matches the first client render.
  const [origin, setOrigin] = useState<string | null>(null);
  useEffect(() => setOrigin(window.location.origin), []);
  const qrValue = qrToken && origin !== null ? `${origin}/check-in/p/${qrToken}` : null;

  const handle = profile.username ?? profile.displayName ?? null;
  const initial = (handle ?? "?")[0].toUpperCase();
  const role = memberId ? "SBG Member" : "Participant";
  const sinceYear = memberSinceYear(memberId);
  const memberIdDisplay = memberId ? memberId.replace(/^SBG-UC-(\d{2})(\d{4})$/, "$1$2") : null;
  const hasEmail = !!profile.email && profile.email !== "—";
  const hasName = !!profile.fullName && profile.fullName !== "—";
  const hasPublicInfo = !!profile.bio || (profile.skills?.length ?? 0) > 0;

  const setEditing = (section: keyof typeof edit, value: boolean) =>
    setEdit((prev) => ({ ...prev, [section]: value }));

  /** Turns on edit mode for a section (switching to its tab); `target` is an element id to scroll to. */
  const openEdit = (section: keyof typeof edit, target?: string) => {
    if (section !== "about") setTab(section);
    setEditing(section, true);
    if (target) setScrollTo(target);
  };

  // The edit fields only exist after the tab / edit state has rendered, so scroll in an effect.
  useEffect(() => {
    if (!scrollTo) return;
    document.getElementById(scrollTo)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setScrollTo(null);
  }, [scrollTo]);

  return (
    <>
      <Stripes className="h-4" />

      <section className={`${wrap} pb-16 sm:pb-24`}>
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-12 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-14">
          {/* ── The pass ─────────────────────────────────────────────── */}
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
                  <button
                    type="button"
                    onClick={() => openEdit("details", "edit-photo")}
                    aria-label="Change profile photo"
                    className={`group relative block h-28 w-28 shrink-0 border-4 border-black bg-black sm:h-32 sm:w-32 ${focus}`}
                  >
                    {profile.avatarUrl ? (
                      <PixelAvatar src={profile.avatarUrl} size={32} />
                    ) : (
                      <span className={`${hd} flex h-full w-full items-center justify-center text-6xl text-pix-butter`}>
                        {initial}
                      </span>
                    )}
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-3 -right-3 border-4 border-black bg-pix-teal p-1 text-black transition-colors group-hover:bg-pix-butter"
                    >
                      <PencilIcon size={14} />
                    </span>
                  </button>

                  <div className="min-w-0">
                    <p className={`${hd} text-4xl [overflow-wrap:anywhere] sm:text-5xl`}>{handle ?? "—"}</p>
                    <p className="mt-2 text-lg leading-tight">{role}</p>
                    {sinceYear && <p className="text-sm text-black/70">Member since {sinceYear}</p>}
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

                <DirectoryRow api={api} />

                <div className="mt-5 flex items-end justify-between gap-4 border-t-4 border-dashed border-black/30 pt-4">
                  <div className="flex min-w-0 flex-col items-start gap-2">
                    {profile.githubUsername && (
                      <a
                        href={`https://github.com/${profile.githubUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={pillOnButter}
                      >
                        GitHub <ExternalLinkIcon />
                      </a>
                    )}
                    {hasEmail && (
                      <a href={`mailto:${profile.email}`} className={pillOnButter}>
                        Email <ExternalLinkIcon />
                      </a>
                    )}
                  </div>

                  {qrToken ? (
                    <button
                      type="button"
                      onClick={() => qrValue && setQrOpen(true)}
                      disabled={!qrValue}
                      aria-label="View my check-in QR code"
                      className={`shrink-0 border-4 border-black bg-white p-1.5 shadow-pixel-teal-4 transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pixel-teal-2 ${focus}`}
                    >
                      {qrValue ? (
                        <QRCodeSVG value={qrValue} size={84} level="M" />
                      ) : (
                        <span className="block h-[84px] w-[84px]" />
                      )}
                    </button>
                  ) : (
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center border-4 border-dashed border-black/40 text-center text-sm leading-tight text-black/60">
                      No QR yet
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => (edit.details ? setEditing("details", false) : openEdit("details"))}
                  aria-pressed={edit.details}
                  className={`${btnDark} mt-6 w-full`}
                >
                  {edit.details ? (
                    "Done editing"
                  ) : (
                    <>
                      Edit profile <PencilIcon />
                    </>
                  )}
                </button>
              </div>
            </article>
          </div>

          {/* ── Detail tiles ─────────────────────────────────────────── */}
          <div className="flex min-w-0 flex-col gap-5 lg:pt-12">
            {/* About me stays put above the tabs and is edited on its own. */}
            <Tile
              id="tile-about"
              title="About me"
              border="border-pix-teal"
              headingClass={hd}
              action={<EditToggle editing={edit.about} onClick={() => setEditing("about", !edit.about)} label="Edit about me" />}
            >
              {edit.about ? (
                <AboutEdit api={api} />
              ) : (
                <>
                  {hasPublicInfo ? (
                    <>
                      {profile.bio && <p className="break-words text-xl leading-snug">{profile.bio}</p>}
                      {profile.skills && profile.skills.length > 0 && (
                        <ul aria-label="Skills" className={`flex flex-wrap gap-2 ${profile.bio ? "mt-5" : ""}`}>
                          {profile.skills.map((skill) => (
                            <li key={skill} className="border-2 border-pix-butter/60 px-2 py-0.5 text-sm">
                              {skill}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-xl leading-snug text-pix-butter/70">
                        Nothing here yet. Add a short bio and your skills so other members know what you&apos;re into.
                      </p>
                      <button type="button" onClick={() => openEdit("about")} className={`${btnOutline} mt-5`}>
                        Add yours
                      </button>
                    </>
                  )}
                </>
              )}
            </Tile>

            <div>
              <Tabs
                tabs={TABS}
                value={tab}
                onChange={setTab}
                label="Profile sections"
                headingClass={hd}
                actions={
                  <EditToggle
                    editing={edit[tab]}
                    onClick={() => setEditing(tab, !edit[tab])}
                    label={tab === "showcase" ? "Edit showcase" : "Edit details"}
                  />
                }
              />

              {tab === "showcase" ? (
                <div
                  role="tabpanel"
                  id="panel-showcase"
                  aria-labelledby="tab-showcase"
                  className="mt-5 flex flex-col gap-5"
                >
                  {profile.githubUsername && (
                    <GithubContributions username={profile.githubUsername} headingClass={hd} />
                  )}
                  <Tile id="tile-showcase" title="Showcase" border="border-pix-rust" headingClass={hd}>
                    {edit.showcase ? (
                      <ShowcaseEdit api={api} showcase={showcase} />
                    ) : (
                      <>
                        {!profile.githubUsername ? (
                          <>
                            <p className="text-xl leading-snug text-pix-butter/70">
                              Link your GitHub username to showcase up to {MAX_SHOWCASE_REPOS} of your repos, with a picture of what you built.
                            </p>
                            <button type="button" onClick={() => openEdit("details", "edit-contact")} className={`${btnOutline} mt-5`}>
                              Link GitHub
                            </button>
                          </>
                        ) : showcase.repos.length === 0 ? (
                          <>
                            <p className="text-xl leading-snug text-pix-butter/70">
                              Nothing showcased yet. Pick up to {MAX_SHOWCASE_REPOS} of your public repos and add a picture of what you built.
                            </p>
                            <button type="button" onClick={() => openEdit("showcase")} className={`${btnOutline} mt-5`}>
                              Pick your repos
                            </button>
                          </>
                        ) : (
                          <>
                            <ul className="grid gap-3">
                              {showcase.repos.map((repo) => (
                                <RepoCard key={repo.repo_id} repo={repo} headingClass={hd} />
                              ))}
                            </ul>
                            <button type="button" onClick={() => openEdit("showcase")} className={`${btnOutline} mt-5`}>
                              Manage showcase
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </Tile>

                </div>
              ) : (
                <div
                  role="tabpanel"
                  id="panel-details"
                  aria-labelledby="tab-details"
                  className="mt-5 grid gap-5 xl:grid-cols-2"
                >
                  <Tile
                    id="tile-details"
                    title="Details"
                    border="border-pix-mustard"
                    headingClass={hd}
                    className={edit.details ? "xl:col-span-2" : ""}
                  >
                    {edit.details ? (
                      <DetailsEdit
                        api={api}
                        memberId={memberId}
                        participantId={participantId}
                        usernameChangedAt={usernameChangedAt}
                        onDone={() => {
                          setEditing("details", false);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        headingClass={hd}
                      />
                    ) : (
                      <>
                        <dl className="grid gap-x-6 gap-y-3">
                          <Field label="Full name">{hasName ? profile.fullName : notSet}</Field>
                          <Field label="Display name">{profile.displayName ?? notSet}</Field>
                          <Field label="Username">{profile.username ? `@${profile.username}` : notSet}</Field>
                          <Field label="Email">
                            {hasEmail ? (
                              <a href={`mailto:${profile.email}`} className={`break-all ${linkCls}`}>
                                {profile.email}
                              </a>
                            ) : (
                              notSet
                            )}
                          </Field>
                          <Field label="GitHub">
                            {profile.githubUsername ? (
                              <a
                                href={`https://github.com/${profile.githubUsername}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={linkCls}
                              >
                                {profile.githubUsername}
                              </a>
                            ) : (
                              notSet
                            )}
                          </Field>
                          <Field label="Member ID">
                            {memberId ? (
                              memberId
                            ) : (
                              <>
                                <span className="text-pix-butter/50">Not linked yet</span>{" "}
                                <Link href="/membership" className={`text-base ${linkCls}`}>
                                  Link membership
                                </Link>
                              </>
                            )}
                          </Field>
                        </dl>
                      </>
                    )}
                  </Tile>

                  <Tile
                    id="tile-membership"
                    title="Membership"
                    border="border-pix-coral"
                    headingClass={hd}
                    className={edit.details ? "xl:col-span-2" : ""}
                  >
                      {membership ? (
                        <>
                          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                            <Field label="Member ID">{membership.member_id}</Field>
                            <Field label="Student number">{membership.student_number}</Field>
                            <Field label="Name">{formatFullName(membership.student_data) || notSet}</Field>
                            <Field label="Year level">{membership.student_data?.year_level || notSet}</Field>
                            <Field label="Program">
                              {membership.student_data?.program || notSet}
                              {membership.student_data?.section && (
                                <span className="ml-2 text-pix-butter/70">Section {membership.student_data.section}</span>
                              )}
                            </Field>
                            {extras?.email && <Field label="Email on file">{extras.email}</Field>}
                            {extras?.contact_number && <Field label="Contact number">{extras.contact_number}</Field>}
                            {extras?.date_of_birth && <Field label="Date of birth">{fmtDate(extras.date_of_birth)}</Field>}
                          </dl>
                          <Link href="/membership" className={`${btnOutline} mt-5`}>
                            History &amp; changes
                          </Link>
                        </>
                      ) : (
                        <>
                          <p className="text-xl leading-snug text-pix-butter/70">
                            {membershipUnavailable
                              ? "Your membership details couldn't be loaded right now. Try the membership page."
                              : "No membership linked yet. Enter your student details to register your SBG membership."}
                          </p>
                          <Link href="/membership" className={`${btnOutline} mt-5`}>
                            {membershipUnavailable ? "Open membership" : "Link membership"}
                          </Link>
                        </>
                      )}
                  </Tile>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {qrOpen && qrToken && qrValue && (
        <Modal
          title="My QR code"
          tone="butter"
          closeOnBackdrop
          onClose={() => setQrOpen(false)}
          bodyClass={bodyClass}
          headingClass={hd}
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="border-4 border-black bg-white p-3">
              <QRCodeSVG value={qrValue} size={208} level="M" />
            </div>
            {profile.displayName && <p className="text-xl">{profile.displayName}</p>}
            {participantId && (
              <p className="text-sm text-black/60">
                {participantId.slice(0, 8)}…{participantId.slice(-8)}
              </p>
            )}
            <p className="text-sm text-black/70">
              Do not share this QR code. It uniquely identifies you at events.
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}
