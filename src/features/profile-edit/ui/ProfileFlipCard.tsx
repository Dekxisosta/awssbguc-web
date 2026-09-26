"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AvatarUpload } from "@/src/features/avatar-upload";
import { EditableField } from "./EditableField";
import { QRCodeSVG } from "qrcode.react";
import { SOCIALS } from "@/src/shared/config/socials";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProfileFlipCardProps {
  initialUsername: string | null;
  discordId: string | null;
  githubUsername: string | null;
  memberId: string | null;
  fullName: string;
  email: string;
  initialAvatarUrl: string | null;
  qrToken: string | null;
  displayName: string | null;
  participantId: string | null;
  deletionScheduledAt: string | null;
  /** DOM id of the div to portal card content into */
  cardSlotId: string;
  /** DOM id of the div to portal pill content into */
  pillSlotId: string;
  /** DOM id of the div to portal QR code into */
  qrSlotId: string;
}

type PatchResponse =
  | { success: true }
  | { success: false; error: string; field?: string };

type DeleteResponse =
  | { success: true; scheduledAt?: string }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function memberSinceYear(memberId: string | null): string | null {
  if (!memberId) return null;
  const m = memberId.match(/^SBG-UC-(\d{2})\d{4}$/);
  if (!m) return null;
  const yy = parseInt(m[1], 10);
  return String(yy < 50 ? 2000 + yy : 1900 + yy);
}

function formatDeletionDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function daysUntilDeletion(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ProfileCard({
  initialUsername,
  discordId: initialDiscordId,
  githubUsername: initialGithubUsername,
  memberId,
  fullName: initialFullName,
  email: initialEmail,
  initialAvatarUrl,
  qrToken,
  displayName: initialDisplayName,
  participantId,
  deletionScheduledAt: initialDeletionScheduledAt,
  cardSlotId,
  pillSlotId,
  qrSlotId,
}: ProfileFlipCardProps) {
  // ── Local mutable state for all editable fields ──────────────────────────
  const [username, setUsername] = useState(initialUsername);
  const [discordId, setDiscordId] = useState(initialDiscordId);
  const [githubUsername, setGithubUsername] = useState(initialGithubUsername);
  const [fullName, setFullName] = useState(initialFullName);
  const [email, setEmail] = useState(initialEmail);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);

  // ── Deletion state ────────────────────────────────────────────────────────
  const [deletionScheduledAt, setDeletionScheduledAt] = useState(
    initialDeletionScheduledAt
  );

  // ── Modal state ───────────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Portal targets ────────────────────────────────────────────────────────
  const [cardEl, setCardEl] = useState<Element | null>(null);
  const [pillEl, setPillEl] = useState<Element | null>(null);
  const [qrEl, setQrEl] = useState<Element | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCardEl(document.getElementById(cardSlotId));
    setPillEl(document.getElementById(pillSlotId));
    setQrEl(document.getElementById(qrSlotId));
    setMounted(true);
  }, [cardSlotId, pillSlotId, qrSlotId]);

  // ── Field save helpers ────────────────────────────────────────────────────
  async function patchProfile(payload: Record<string, unknown>): Promise<string | null> {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data: PatchResponse = await res.json();
    return data.success ? null : data.error;
  }

  async function saveDiscordId(value: string): Promise<string | null> {
    const err = await patchProfile({ discord_id: value || null });
    if (!err) setDiscordId(value || null);
    return err;
  }

  async function saveGithubUsername(value: string): Promise<string | null> {
    const err = await patchProfile({ github_username: value || null });
    if (!err) setGithubUsername(value || null);
    return err;
  }

  async function saveFullName(value: string): Promise<string | null> {
    const err = await patchProfile({ supplied_name: value });
    if (!err) setFullName(value);
    return err;
  }

  async function saveDisplayName(value: string): Promise<string | null> {
    const err = await patchProfile({ display_name: value });
    if (!err) setDisplayName(value);
    return err;
  }

  async function saveEmail(value: string): Promise<string | null> {
    const err = await patchProfile({ email: value });
    if (!err) setEmail(value);
    return err;
  }

  // ── Account deletion helpers ──────────────────────────────────────────────
  async function handleRequestDeletion() {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const data: DeleteResponse = await res.json();
      if (!data.success) {
        setDeleteError(data.error);
      } else {
        setDeletionScheduledAt(data.scheduledAt ?? null);
        setShowDeleteConfirm(false);
      }
    } catch {
      setDeleteError("Something went wrong. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleCancelDeletion() {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/account/cancel-deletion", { method: "POST" });
      const data: DeleteResponse = await res.json();
      if (!data.success) {
        setDeleteError(data.error);
      } else {
        setDeletionScheduledAt(null);
      }
    } catch {
      setDeleteError("Something went wrong. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  }

  // ── Derived display values ────────────────────────────────────────────────
  const qrValue =
    qrToken && typeof window !== "undefined"
      ? `${window.location.origin}/check-in/p/${qrToken}`
      : qrToken
      ? `/check-in/p/${qrToken}`
      : "";

  const sinceYear = memberSinceYear(memberId);
  const memberIdDisplay = memberId
    ? memberId.replace(/^SBG-UC-(\d{2})(\d{4})$/, "$1$2")
    : null;

  const SUPPORT_EMAIL = SOCIALS.email;

  if (!mounted || !cardEl || !pillEl || !qrEl) return null;

  // ── Card content ──────────────────────────────────────────────────────────
  const cardContent = (
    <div className="flex h-full flex-col p-4">

      {/* Top row: avatar + username/role */}
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          aria-label="Change avatar"
          className="group relative shrink-0"
        >
          {/* Border decoration underneath avatar */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/profile/profile_border.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-contain pointer-events-none"
          />
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-neutral-300 bg-neutral-200 shadow transition-opacity group-hover:opacity-80">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-neutral-400">
                {(username ?? displayName ?? "?")[0].toUpperCase()}
              </span>
            )}
            <span
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <CameraIcon />
            </span>
          </div>
        </button>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5 pt-1">
          <div className="rounded-lg border border-neutral-300/70 bg-white/80 px-4 py-2 shadow-sm">
            <p className="truncate font-mono text-xl font-bold text-neutral-800">
              {username ?? displayName ?? "—"}
            </p>
          </div>
          <div className="mx-1 border-t border-dashed border-neutral-400/50" />
          <p className="px-1 text-sm font-semibold text-neutral-600">
            {memberId ? "SBG Member" : "Participant"}
          </p>
          {sinceYear && (
            <p className="px-1 text-sm text-neutral-500">Member since {sinceYear}</p>
          )}
        </div>
      </div>

      {/* Description — hidden on mobile (via More modal), shown sm+ */}
      <div className="hidden sm:block px-1 py-3 sm:py-1.5 pl-8">
        <div className="flex flex-col gap-2.5 sm:gap-1.5">
          <DescRow label="Name"    value={fullName} />
          {discordId && <DescRow label="Discord" value={discordId} mono />}
        </div>
      </div>

      {/* Bottom row: ID badge + socials + mobile More button */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-1 mb-4">
        {memberIdDisplay ? (
          <div className="relative flex items-center px-6 py-2.5 min-w-[7rem] sm:px-8 sm:py-3 sm:min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/profile/id_background.png"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-fill pointer-events-none"
            />
            <span
              className="relative font-mono text-lg font-black tracking-wide sm:text-2xl"
              style={{
                color: "#cc0000",
                WebkitTextStroke: "2px white",
                paintOrder: "stroke fill",
              }}
            >
              ID: {memberIdDisplay}
            </span>
          </div>
        ) : (
          <div className="relative flex items-center px-6 py-2.5 min-w-[7rem] sm:px-8 sm:py-3 sm:min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/profile/id_background.png"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-fill pointer-events-none"
            />
            <span
              className="relative font-mono text-base font-black sm:text-lg"
              style={{
                color: "#cc0000",
                WebkitTextStroke: "2px white",
                paintOrder: "stroke fill",
              }}
            >
              No ID yet
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {githubUsername && (
            <a
              href={`https://github.com/${githubUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-full border-2 border-neutral-800 bg-white/80 px-4 py-1.5 text-sm font-bold text-neutral-800 transition-colors hover:bg-neutral-100 sm:px-5 sm:py-2 sm:text-base"
            >
              Github <ExternalLinkIcon />
            </a>
          )}
          {email && email !== "—" && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-1.5 rounded-full border-2 border-neutral-800 bg-white/80 px-4 py-1.5 text-sm font-bold text-neutral-800 transition-colors hover:bg-neutral-100 sm:px-5 sm:py-2 sm:text-base"
            >
              Email <ExternalLinkIcon />
            </a>
          )}
        </div>
      </div>
    </div>
  );

  // ── Pill content ──────────────────────────────────────────────────────────
  const pillContent = (
    <div className="flex h-full items-center gap-3 px-5">
      <button
        type="button"
        onClick={() => setEditOpen(true)}
        className="flex items-center gap-2 rounded-full border-2 border-neutral-600 bg-white/80 px-6 py-2 text-base font-bold text-neutral-800 transition-colors hover:bg-neutral-100"
      >
        Edit <PencilSquareIcon />
      </button>
    </div>
  );

  // ── QR content ────────────────────────────────────────────────────────────
  const qrContent = (
    <div className="flex h-full w-full items-center justify-center">
      {qrToken ? (
        <button
          type="button"
          onClick={() => setShowQR(true)}
          aria-label="View my QR code"
          className="flex items-center justify-center rounded-xl border-4 border-[#00e482] bg-white p-1.5 shadow-lg transition-opacity hover:opacity-90"
        >
          <QRCodeSVG value={qrValue} size={60} level="M" />
        </button>
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-neutral-300 bg-neutral-100 text-xs text-neutral-400">
          No QR
        </div>
      )}
    </div>
  );

  return (
    <>
      {createPortal(cardContent, cardEl)}
      {createPortal(pillContent, pillEl)}
      {createPortal(qrContent, qrEl)}

      {/* ── More modal — mobile bottom sheet ──────────────────────────────── */}
      {showMore && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Profile details"
          onClick={() => setShowMore(false)}
        >
          <div
            className="w-full rounded-t-3xl border-t border-neutral-700 bg-neutral-900 p-6 pb-10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-neutral-600" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-100">Profile Details</h2>
              <button
                type="button"
                onClick={() => setShowMore(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="mb-5 flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-neutral-700 bg-neutral-800">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xl font-bold text-neutral-400">
                    {(username ?? displayName ?? "?")[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="font-mono text-lg font-bold text-neutral-100">
                  {username ?? displayName ?? "—"}
                </p>
                <p className="text-sm text-neutral-400">
                  {memberId ? "SBG Member" : "Participant"}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <ModalRow label="Name"       value={fullName} />
              {email && email !== "—"   && <ModalRow label="Email"      value={email} />}
              {discordId                && <ModalRow label="Discord"    value={discordId}  mono />}
              {githubUsername           && <ModalRow label="GitHub"     value={githubUsername} mono />}
              {memberId                 && <ModalRow label="Member ID"  value={memberId}   mono />}
              {sinceYear                && <ModalRow label="Since"      value={sinceYear} />}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit modal ────────────────────────────────────────────────────── */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Edit profile"
        >
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-900 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
              <h2 className="text-base font-semibold text-neutral-100">Edit Profile</h2>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <dl className="flex flex-col gap-6">

                {/* Avatar */}
                <div>
                  <dt className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Avatar
                  </dt>
                  <dd className="flex justify-center">
                    <AvatarUpload
                      avatarUrl={avatarUrl}
                      username={username}
                      onAvatarChange={setAvatarUrl}
                    />
                  </dd>
                </div>

                {/* Username — read-only; changes must be requested */}
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Username
                  </dt>
                  {username ? (
                    <>
                      <dd className="mt-1 font-mono text-sm text-neutral-300">{username}</dd>
                      <p className="mt-1.5 text-xs text-neutral-500">
                        Username cannot be changed directly. To request a change, email{" "}
                        <a
                          href={`mailto:${SUPPORT_EMAIL}?subject=Username%20Change%20Request&body=Current%20username%3A%20${encodeURIComponent(username ?? "")}%0ARequested%20username%3A%20`}
                          className="text-[#00e482] underline-offset-2 hover:underline"
                        >
                          {SUPPORT_EMAIL}
                        </a>{" "}
                        with your reason.
                      </p>
                    </>
                  ) : (
                    <dd className="mt-1 text-sm text-neutral-500">No username set.</dd>
                  )}
                </div>

                {/* Display name */}
                <EditableField
                  id="display_name"
                  label="Display name"
                  value={displayName}
                  placeholder="e.g. BraveEagle4291"
                  hint="6–24 characters. Start with a letter; letters, numbers, and _ only. This is your public identity at events."
                  onSave={saveDisplayName}
                />

                {/* Full name */}
                <EditableField
                  id="supplied_name"
                  label="Full name"
                  value={fullName}
                  placeholder="e.g. Juan dela Cruz"
                  hint="Your real name as submitted during registration."
                  onSave={saveFullName}
                />

                {/* Email */}
                <EditableField
                  id="email"
                  label="Email"
                  value={email}
                  inputType="email"
                  placeholder="e.g. juan@example.com"
                  hint="Changing your email will update your login credentials."
                  onSave={saveEmail}
                />

                {/* Discord ID */}
                <EditableField
                  id="discord_id"
                  label="Discord ID"
                  value={discordId}
                  placeholder="e.g. 123456789012345678"
                  hint="Your Discord snowflake ID (17–19 digits) or username#0000."
                  onSave={saveDiscordId}
                />

                {/* GitHub username */}
                <EditableField
                  id="github_username"
                  label="GitHub username"
                  value={githubUsername}
                  placeholder="e.g. octocat"
                  hint="Your GitHub username. Leave blank to remove."
                  onSave={saveGithubUsername}
                />

                {/* Member ID — read-only with change-by-email notice */}
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Member ID
                  </dt>
                  {memberId ? (
                    <>
                      <dd className="mt-1 font-mono text-sm text-neutral-300">{memberId}</dd>
                      <p className="mt-1.5 text-xs text-neutral-500">
                        To request a Member ID change, email{" "}
                        <a
                          href={`mailto:${SUPPORT_EMAIL}?subject=Member%20ID%20Change%20Request&body=Member%20ID%3A%20${encodeURIComponent(memberId)}%0ARequested%20change%3A%20`}
                          className="text-[#00e482] underline-offset-2 hover:underline"
                        >
                          {SUPPORT_EMAIL}
                        </a>{" "}
                        with your student number and reason.
                      </p>
                    </>
                  ) : (
                    <dd className="mt-1 text-sm text-neutral-500">No member ID assigned.</dd>
                  )}
                </div>

                {/* Participant ID — always read-only */}
                {participantId && (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                      Participant ID
                    </dt>
                    <dd className="mt-1 font-mono text-xs text-neutral-500 break-all">
                      {participantId}
                    </dd>
                  </div>
                )}

                {/* ── Danger zone ─────────────────────────────────────────── */}
                <div className="border-t border-neutral-800 pt-6">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-red-500">
                    Danger zone
                  </p>

                  {deletionScheduledAt ? (
                    /* Deletion already scheduled */
                    <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-4">
                      <p className="text-sm font-semibold text-red-300">
                        Account deletion scheduled
                      </p>
                      <p className="mt-1 text-xs text-neutral-400">
                        Your account will be permanently deleted on{" "}
                        <span className="font-semibold text-neutral-200">
                          {formatDeletionDate(deletionScheduledAt)}
                        </span>{" "}
                        ({daysUntilDeletion(deletionScheduledAt)} days remaining). All your
                        data will be removed and cannot be recovered.
                      </p>
                      {deleteError && (
                        <p className="mt-2 text-xs text-red-400" role="alert">
                          {deleteError}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={handleCancelDeletion}
                        disabled={deleteLoading}
                        className="mt-3 rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-1.5 text-sm font-semibold text-neutral-200 transition-colors hover:border-neutral-400 hover:text-white disabled:opacity-50"
                      >
                        {deleteLoading ? "Cancelling…" : "Cancel deletion"}
                      </button>
                    </div>
                  ) : showDeleteConfirm ? (
                    /* Confirmation step */
                    <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-4">
                      <p className="text-sm font-semibold text-red-300">
                        Are you sure?
                      </p>
                      <p className="mt-1 text-xs text-neutral-400">
                        Your account will be scheduled for permanent deletion in{" "}
                        <span className="font-semibold text-neutral-200">30 days</span>.
                        You can cancel at any time before then. After 30 days, all your
                        data will be removed and cannot be recovered.
                      </p>
                      {deleteError && (
                        <p className="mt-2 text-xs text-red-400" role="alert">
                          {deleteError}
                        </p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={handleRequestDeletion}
                          disabled={deleteLoading}
                          className="rounded-lg bg-red-700 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                        >
                          {deleteLoading ? "Scheduling…" : "Yes, delete my account"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
                          disabled={deleteLoading}
                          className="rounded-lg border border-neutral-600 bg-neutral-800 px-4 py-1.5 text-sm font-semibold text-neutral-300 transition-colors hover:border-neutral-400 hover:text-white disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Initial delete button */
                    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
                      <p className="text-sm text-neutral-300">Delete account</p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        Permanently remove your account and all associated data. A 30-day
                        grace period applies — you can cancel during this time.
                      </p>
                      <button
                        type="button"
                        onClick={() => { setShowDeleteConfirm(true); setDeleteError(null); }}
                        className="mt-3 rounded-lg border border-red-900 bg-transparent px-4 py-1.5 text-sm font-semibold text-red-400 transition-colors hover:border-red-500 hover:bg-red-950/60 hover:text-red-300"
                      >
                        Delete my account…
                      </button>
                    </div>
                  )}
                </div>

              </dl>
            </div>
          </div>
        </div>
      )}

      {/* ── QR modal ─────────────────────────────────────────────────────── */}
      {showQR && qrToken && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="My QR code"
        >
          <div className="w-full max-w-xs rounded-2xl border border-neutral-700 bg-neutral-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-100">My QR Code</span>
              <button
                type="button"
                onClick={() => setShowQR(false)}
                aria-label="Close"
                className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-xl border border-neutral-700 bg-white p-3">
                <QRCodeSVG value={qrValue} size={200} level="M" />
              </div>
              {displayName && (
                <p className="text-sm font-medium text-neutral-200">{displayName}</p>
              )}
              {participantId && (
                <p className="font-mono text-xs text-neutral-500">
                  {participantId.slice(0, 8)}…{participantId.slice(-8)}
                </p>
              )}
              <p className="text-center text-xs text-neutral-600">
                Do not share this QR code. It uniquely identifies you at events.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Keep ProfileFlipCard as an alias so the barrel export still works
export { ProfileCard as ProfileFlipCard };

// ---------------------------------------------------------------------------
// Row helpers
// ---------------------------------------------------------------------------

function DescRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-16 shrink-0 text-xs font-bold uppercase tracking-widest text-neutral-400">
        {label}
      </span>
      <span
        className={`truncate text-lg leading-tight sm:leading-snug text-neutral-700 ${mono ? "font-mono" : "font-semibold"}`}
      >
        {value}
      </span>
    </div>
  );
}

function ModalRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">
        {label}
      </span>
      <span className={`text-base text-neutral-200 ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function CameraIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

export function PencilSquareIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
