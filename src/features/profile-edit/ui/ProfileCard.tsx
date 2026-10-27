"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useProfile } from "../model/useProfile";
import { EditProfileModal } from "./EditProfileModal";
import { Modal } from "./Modal";
import { PixelAvatar } from "./PixelAvatar";
import {
  ExternalLinkIcon,
  NOTCH,
  PencilIcon,
  Stripes,
  btnDark,
  btnOutline,
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
  /** next/font class of the page wrapper (modals portal out of it, so they need it passed in) */
  bodyClass: string;
  /** Headline font class (Jersey 10) */
  headingClass: string;
}

function memberSinceYear(memberId: string | null): string | null {
  if (!memberId) return null;
  const m = memberId.match(/^SBG-UC-(\d{2})\d{4}$/);
  if (!m) return null;
  const yy = parseInt(m[1], 10);
  return String(yy < 50 ? 2000 + yy : 1900 + yy);
}

// ─── Small building blocks ───────────────────────────────────────────────────

/** Bordered block with a headline, like the "Why join?" pillars on the home page. */
function Tile({
  id,
  title,
  border,
  headingClass,
  children,
}: {
  id: string;
  title: string;
  border: string;
  headingClass: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={`border-4 ${border} p-5 sm:p-6`}>
      <h2 id={id} className={`${headingClass} text-4xl sm:text-5xl`}>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm uppercase tracking-wide text-pix-butter/60">{label}</dt>
      <dd className="mt-1 break-words text-xl">{children}</dd>
    </div>
  );
}

const notSet = <span className="text-pix-butter/50">Not set</span>;

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

  const [editOpen, setEditOpen] = useState(false);
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

  const openEdit = () => setEditOpen(true);

  return (
    <>
      <Stripes className="h-4" />

      <section className={`${wrap} pb-16 sm:pb-24`}>
        <div className="grid items-start gap-12 lg:grid-cols-[400px_1fr] lg:gap-14">
          {/* ── The pass ─────────────────────────────────────────────── */}
          <div className="mx-auto flex w-full max-w-[400px] flex-col items-center">
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
                    onClick={openEdit}
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
                    <p className={`${hd} break-words text-4xl sm:text-5xl`}>{handle ?? "—"}</p>
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

                <div className="mt-6 flex items-end justify-between gap-4 border-t-4 border-dashed border-black/30 pt-5">
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

                <button type="button" onClick={openEdit} className={`${btnDark} mt-6 w-full`}>
                  Edit profile <PencilIcon />
                </button>
              </div>
            </article>
          </div>

          {/* ── Detail tiles ─────────────────────────────────────────── */}
          <div className="flex min-w-0 flex-col gap-8 lg:pt-12">
            <Tile id="tile-about" title="About me" border="border-pix-teal" headingClass={hd}>
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
                  <button type="button" onClick={openEdit} className={`${btnOutline} mt-5`}>
                    Add yours
                  </button>
                </>
              )}
            </Tile>

            <Tile id="tile-details" title="Details" border="border-pix-mustard" headingClass={hd}>
              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
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
                      <Link href="/member" className={`text-base ${linkCls}`}>
                        Link membership
                      </Link>
                    </>
                  )}
                </Field>
              </dl>
            </Tile>

            <Tile id="tile-community" title="Community" border="border-pix-green" headingClass={hd}>
              <div className="flex flex-wrap items-center gap-4">
                <span
                  className={`border-4 px-3 py-1 text-lg ${
                    profile.directoryVisible ? "border-pix-green bg-pix-green text-black" : "border-pix-butter/60"
                  }`}
                >
                  {profile.directoryVisible ? "Public" : "Private"}
                </span>
                <p className="min-w-0 flex-1 basis-64 text-lg leading-snug">
                  {profile.directoryVisible
                    ? "Your photo, name, GitHub, bio and skills show in the public member directory."
                    : "Your profile is private. Turn on the public directory to appear on the community page."}
                </p>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={openEdit} className={btnOutline}>
                  Change visibility
                </button>
                <Link href="/members" className={btnOutline}>
                  See the community
                </Link>
              </div>
            </Tile>
          </div>
        </div>
      </section>

      {editOpen && (
        <EditProfileModal
          api={api}
          memberId={memberId}
          participantId={participantId}
          usernameChangedAt={usernameChangedAt}
          onClose={() => setEditOpen(false)}
          bodyClass={bodyClass}
          headingClass={hd}
        />
      )}

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
