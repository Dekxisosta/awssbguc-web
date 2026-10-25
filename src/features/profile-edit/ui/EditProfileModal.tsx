"use client";

import { useState } from "react";
import { AvatarUpload } from "@/src/features/avatar-upload";
import { SOCIALS } from "@/src/shared/config/socials";
import type { ProfileApi } from "../model/useProfile";
import { EditableField } from "./EditableField";
import { Modal } from "./Modal";
import { btnSmDanger, btnSmDangerGhost, btnSmGhost, focus, linkCls } from "./pixel";

interface EditProfileModalProps {
  api: ProfileApi;
  memberId: string | null;
  participantId: string | null;
  /** ISO timestamp of the one-time username change; null means it hasn't been used */
  usernameChangedAt: string | null;
  onClose: () => void;
  bodyClass: string;
  headingClass: string;
}

function formatDeletionDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function daysUntilDeletion(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const SUPPORT_EMAIL = SOCIALS.email;
const mutedText = "text-sm text-[#fff7a1]/60";

export function EditProfileModal({
  api,
  memberId,
  participantId,
  usernameChangedAt,
  onClose,
  bodyClass,
  headingClass,
}: EditProfileModalProps) {
  const { profile, save, setAvatarUrl, requestDeletion, cancelDeletion } = api;

  // Directory switch
  const [dirBusy, setDirBusy] = useState(false);
  const [dirError, setDirError] = useState<string | null>(null);

  // Account deletion
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function toggleDirectory() {
    setDirBusy(true);
    setDirError(null);
    const err = await save.directoryVisible(!profile.directoryVisible);
    if (err) setDirError(err);
    setDirBusy(false);
  }

  async function handleRequestDeletion() {
    setDeleteBusy(true);
    setDeleteError(null);
    const err = await requestDeletion();
    if (err) setDeleteError(err);
    else setConfirmDelete(false);
    setDeleteBusy(false);
  }

  async function handleCancelDeletion() {
    setDeleteBusy(true);
    setDeleteError(null);
    const err = await cancelDeletion();
    if (err) setDeleteError(err);
    setDeleteBusy(false);
  }

  const groupTitle = `${headingClass} text-3xl text-[#2c8f8f]`;
  const group = "border-t-4 border-dashed border-[#fff7a1]/25 pt-6 first:border-t-0 first:pt-0";

  return (
    <Modal title="Edit profile" onClose={onClose} bodyClass={bodyClass} headingClass={headingClass} wide>
      <div className="flex flex-col gap-8">
        {/* ── Photo ─────────────────────────────────────────────────────── */}
        <section className={group} aria-labelledby="edit-photo">
          <h3 id="edit-photo" className={groupTitle}>Photo</h3>
          <div className="mt-4 flex justify-center">
            <AvatarUpload
              variant="pixel"
              avatarUrl={profile.avatarUrl}
              username={profile.username}
              onAvatarChange={setAvatarUrl}
            />
          </div>
        </section>

        {/* ── Identity ──────────────────────────────────────────────────── */}
        <section className={group} aria-labelledby="edit-identity">
          <h3 id="edit-identity" className={groupTitle}>Identity</h3>
          <dl className="mt-4 flex flex-col gap-5">
            {!usernameChangedAt ? (
              <EditableField
                id="username"
                label="Username"
                badge={<span className="border-2 border-[#3aaa6e] px-1.5 text-xs text-[#3aaa6e]">one-time</span>}
                value={profile.username}
                placeholder="e.g. cloudbuilder"
                hint="6–24 characters. Start with a letter; letters, numbers, and _ only. You can only set this once."
                onSave={save.username}
              />
            ) : (
              <div>
                <dt className="text-sm uppercase tracking-wide text-[#fff7a1]/70">Username</dt>
                {profile.username ? (
                  <>
                    <dd className="mt-1 break-words text-lg">{profile.username}</dd>
                    <p className={`mt-1.5 ${mutedText}`}>
                      Username cannot be changed again. To request a change, email{" "}
                      <a
                        href={`mailto:${SUPPORT_EMAIL}?subject=Username%20Change%20Request&body=Current%20username%3A%20${encodeURIComponent(profile.username)}%0ARequested%20username%3A%20`}
                        className={linkCls}
                      >
                        {SUPPORT_EMAIL}
                      </a>
                      .
                    </p>
                  </>
                ) : (
                  <dd className="mt-1 text-lg text-[#fff7a1]/50">No username set.</dd>
                )}
              </div>
            )}

            <EditableField
              id="display_name"
              label="Display name"
              value={profile.displayName}
              placeholder="e.g. BraveEagle4291"
              hint="6–24 characters. Start with a letter; letters, numbers, and _ only."
              onSave={save.displayName}
            />
            <EditableField
              id="supplied_name"
              label="Full name"
              value={profile.fullName === "—" ? null : profile.fullName}
              placeholder="e.g. Juan dela Cruz"
              hint="Your real name as submitted during registration."
              onSave={save.fullName}
            />
          </dl>
        </section>

        {/* ── Contact ───────────────────────────────────────────────────── */}
        <section className={group} aria-labelledby="edit-contact">
          <h3 id="edit-contact" className={groupTitle}>Contact</h3>
          <dl className="mt-4 flex flex-col gap-5">
            <EditableField
              id="email"
              label="Email"
              value={profile.email === "—" ? null : profile.email}
              inputType="email"
              placeholder="e.g. juan@example.com"
              hint="Changing your email will update your login credentials."
              onSave={save.email}
            />
            <EditableField
              id="github_username"
              label="GitHub username"
              value={profile.githubUsername}
              placeholder="e.g. octocat"
              hint="Your GitHub username. Leave blank to remove."
              onSave={save.githubUsername}
            />
          </dl>
        </section>

        {/* ── Public profile ────────────────────────────────────────────── */}
        <section className={group} aria-labelledby="edit-public">
          <h3 id="edit-public" className={groupTitle}>Public profile</h3>
          <dl className="mt-4 flex flex-col gap-5">
            <div>
              <dt className="text-sm uppercase tracking-wide text-[#fff7a1]/70">Public directory</dt>
              <dd className="mt-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={profile.directoryVisible}
                    aria-label="Show profile in public member directory"
                    onClick={toggleDirectory}
                    disabled={dirBusy}
                    className={`relative inline-block h-9 w-[4.5rem] shrink-0 border-4 border-[#fff7a1] transition-colors disabled:opacity-50 ${focus} ${
                      profile.directoryVisible ? "bg-[#3aaa6e]" : "bg-black"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute top-1 h-5 w-5 bg-[#fff7a1] transition-[left] ${
                        profile.directoryVisible ? "left-[calc(100%-1.5rem)]" : "left-1"
                      }`}
                    />
                  </button>
                  <span aria-hidden="true" className="text-lg">{profile.directoryVisible ? "On" : "Off"}</span>
                </div>
                <p className={`mt-2 ${mutedText}`}>
                  {profile.directoryVisible
                    ? "Your profile is visible in the public directory."
                    : "Enable to appear in the public member directory."}
                </p>
                {dirError && (
                  <p role="alert" className="mt-2 text-sm text-[#e26a56]">{dirError}</p>
                )}
                {profile.directoryVisible && (
                  <p className={`mt-2 ${mutedText}`}>
                    By making your profile public, you agree to our{" "}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className={linkCls}>Terms of Service</a>{" "}
                    and{" "}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className={linkCls}>Privacy Policy</a>.
                  </p>
                )}
              </dd>
            </div>

            <EditableField
              id="bio"
              label="Bio"
              value={profile.bio}
              placeholder="e.g. AWS enthusiast, studying cloud security."
              hint="Up to 280 characters. Shown publicly in the member directory."
              onSave={save.bio}
            />
            <EditableField
              id="skills"
              label="Skills"
              value={profile.skills ? profile.skills.join(", ") : null}
              placeholder="e.g. Python, AWS, React"
              hint="Comma-separated tags, up to 20 entries. Shown publicly in the member directory."
              onSave={save.skills}
            />
          </dl>
        </section>

        {/* ── Read-only IDs ─────────────────────────────────────────────── */}
        <section className={group} aria-labelledby="edit-ids">
          <h3 id="edit-ids" className={groupTitle}>IDs</h3>
          <dl className="mt-4 flex flex-col gap-5">
            <div>
              <dt className="text-sm uppercase tracking-wide text-[#fff7a1]/70">Member ID</dt>
              {memberId ? (
                <>
                  <dd className="mt-1 text-lg">{memberId}</dd>
                  <p className={`mt-1.5 ${mutedText}`}>
                    To request a Member ID change, email{" "}
                    <a
                      href={`mailto:${SUPPORT_EMAIL}?subject=Member%20ID%20Change%20Request&body=Member%20ID%3A%20${encodeURIComponent(memberId)}%0ARequested%20change%3A%20`}
                      className={linkCls}
                    >
                      {SUPPORT_EMAIL}
                    </a>{" "}
                    with your student number and reason.
                  </p>
                </>
              ) : (
                <dd className="mt-1 text-lg text-[#fff7a1]/50">No member ID assigned.</dd>
              )}
            </div>

            {participantId && (
              <div>
                <dt className="text-sm uppercase tracking-wide text-[#fff7a1]/70">Participant ID</dt>
                <dd className="mt-1 break-all text-sm text-[#fff7a1]/60">{participantId}</dd>
              </div>
            )}
          </dl>
        </section>

        {/* ── Danger zone ───────────────────────────────────────────────── */}
        <section className={group} aria-labelledby="edit-danger">
          <h3 id="edit-danger" className={`${headingClass} text-3xl text-[#e26a56]`}>Danger zone</h3>

          <div className="mt-4 border-4 border-[#b32a0e] p-4">
            {profile.deletionScheduledAt ? (
              <>
                <p className="text-lg text-[#e26a56]">Account deletion scheduled</p>
                <p className={`mt-1 ${mutedText}`}>
                  Your account will be permanently deleted on{" "}
                  <span className="text-[#fff7a1]">{formatDeletionDate(profile.deletionScheduledAt)}</span>{" "}
                  ({daysUntilDeletion(profile.deletionScheduledAt)} days remaining).
                </p>
                {deleteError && <p role="alert" className="mt-2 text-sm text-[#e26a56]">{deleteError}</p>}
                <button type="button" onClick={handleCancelDeletion} disabled={deleteBusy} className={`${btnSmGhost} mt-3`}>
                  {deleteBusy ? "Cancelling…" : "Cancel deletion"}
                </button>
              </>
            ) : confirmDelete ? (
              <>
                <p className="text-lg text-[#e26a56]">Are you sure?</p>
                <p className={`mt-1 ${mutedText}`}>
                  Your account will be scheduled for permanent deletion in{" "}
                  <span className="text-[#fff7a1]">30 days</span>. You can cancel at any time before then.
                </p>
                {deleteError && <p role="alert" className="mt-2 text-sm text-[#e26a56]">{deleteError}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={handleRequestDeletion} disabled={deleteBusy} className={btnSmDanger}>
                    {deleteBusy ? "Scheduling…" : "Yes, delete my account"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDelete(false);
                      setDeleteError(null);
                    }}
                    disabled={deleteBusy}
                    className={btnSmGhost}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-lg">Delete account</p>
                <p className={`mt-1 ${mutedText}`}>
                  Permanently remove your account and all associated data. A 30-day grace period applies; you can
                  cancel during this time.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDelete(true);
                    setDeleteError(null);
                  }}
                  className={`${btnSmDangerGhost} mt-3`}
                >
                  Delete my account…
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </Modal>
  );
}
