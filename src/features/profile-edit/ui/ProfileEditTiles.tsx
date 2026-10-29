"use client";

import { useState } from "react";
import { AvatarUpload } from "@/src/features/avatar-upload";
import { SOCIALS } from "@/src/shared/config/socials";
import { RepoShowcaseEditor, type RepoShowcaseApi } from "@/src/features/repo-showcase";
import type { ProfileApi } from "../model/useProfile";
import { EditableField } from "./EditableField";
import { btnSmDanger, btnSmDangerGhost, btnSmGhost, linkCls } from "./pixel";

/**
 * Edit-mode bodies for the /profile sections. Each one renders inside the matching tile (or tab) and
 * saves field by field (pencil → Enter), so there is no form-level submit.
 */

function formatDeletionDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function daysUntilDeletion(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const SUPPORT_EMAIL = SOCIALS.email;
const mutedText = "text-sm text-pix-butter/60";

// ─── About me (always visible, edited on its own) ────────────────────────────

export function AboutEdit({ api }: { api: ProfileApi }) {
  const { profile, save } = api;
  return (
    <dl className="flex flex-col gap-4">
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
  );
}

// ─── Showcase tab ────────────────────────────────────────────────────────────

export function ShowcaseEdit({ api, showcase }: { api: ProfileApi; showcase: RepoShowcaseApi }) {
  return <RepoShowcaseEditor showcase={showcase} githubUsername={api.profile.githubUsername} />;
}

// ─── Details tab ─────────────────────────────────────────────────────────────

interface DetailsEditProps {
  api: ProfileApi;
  memberId: string | null;
  participantId: string | null;
  /** ISO timestamp of the one-time username change; null means it hasn't been used */
  usernameChangedAt: string | null;
  /** Leaves edit mode for this tab */
  onDone: () => void;
  headingClass: string;
}

export function DetailsEdit({
  api,
  memberId,
  participantId,
  usernameChangedAt,
  onDone,
  headingClass,
}: DetailsEditProps) {
  const { profile, save, setAvatarUrl, requestDeletion, cancelDeletion } = api;

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const groupTitle = `${headingClass} text-2xl text-pix-teal`;
  const group = "scroll-mt-6 border-t-4 border-dashed border-pix-butter/25 pt-4";

  return (
    <div className="grid gap-x-8 gap-y-5 xl:grid-cols-2">
      <section id="edit-photo" aria-labelledby="edit-photo-title" className={group}>
        <h3 id="edit-photo-title" className={groupTitle}>Photo</h3>
        <div className="mt-3 flex justify-center">
          <AvatarUpload
            variant="pixel"
            avatarUrl={profile.avatarUrl}
            username={profile.username}
            onAvatarChange={setAvatarUrl}
          />
        </div>
      </section>

      <section id="edit-identity" aria-labelledby="edit-identity-title" className={group}>
        <h3 id="edit-identity-title" className={groupTitle}>Identity</h3>
        <dl className="mt-3 flex flex-col gap-4">
          {!usernameChangedAt ? (
            <EditableField
              id="username"
              label="Username"
              badge={<span className="border-2 border-pix-green px-1.5 text-xs text-pix-green">one-time</span>}
              value={profile.username}
              placeholder="e.g. cloudbuilder"
              hint="6–24 characters. Start with a letter; letters, numbers, and _ only. You can only set this once."
              onSave={save.username}
            />
          ) : (
            <div>
              <dt className="text-sm uppercase tracking-wide text-pix-butter/70">Username</dt>
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
                <dd className="mt-1 text-lg text-pix-butter/50">No username set.</dd>
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

      <section id="edit-contact" aria-labelledby="edit-contact-title" className={group}>
        <h3 id="edit-contact-title" className={groupTitle}>Contact</h3>
        <dl className="mt-3 flex flex-col gap-4">
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

      <section id="edit-ids" aria-labelledby="edit-ids-title" className={group}>
        <h3 id="edit-ids-title" className={groupTitle}>IDs</h3>
        <dl className="mt-3 flex flex-col gap-4">
          <div>
            <dt className="text-sm uppercase tracking-wide text-pix-butter/70">Member ID</dt>
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
              <dd className="mt-1 text-lg text-pix-butter/50">No member ID assigned.</dd>
            )}
          </div>

          {participantId && (
            <div>
              <dt className="text-sm uppercase tracking-wide text-pix-butter/70">Participant ID</dt>
              <dd className="mt-1 break-all text-sm text-pix-butter/60">{participantId}</dd>
            </div>
          )}
        </dl>
      </section>

      <section id="edit-danger" aria-labelledby="edit-danger-title" className={`${group} xl:col-span-2`}>
        <h3 id="edit-danger-title" className={`${headingClass} text-2xl text-pix-coral`}>Danger zone</h3>
        <div className="mt-3 border-4 border-pix-rust p-4">
          {profile.deletionScheduledAt ? (
            <>
              <p className="text-lg text-pix-coral">Account deletion scheduled</p>
              <p className={`mt-1 ${mutedText}`}>
                Your account will be permanently deleted on{" "}
                <span className="text-pix-butter">{formatDeletionDate(profile.deletionScheduledAt)}</span>{" "}
                ({daysUntilDeletion(profile.deletionScheduledAt)} days remaining).
              </p>
              {deleteError && <p role="alert" className="mt-2 text-sm text-pix-coral">{deleteError}</p>}
              <button type="button" onClick={handleCancelDeletion} disabled={deleteBusy} className={`${btnSmGhost} mt-3`}>
                {deleteBusy ? "Cancelling…" : "Cancel deletion"}
              </button>
            </>
          ) : confirmDelete ? (
            <>
              <p className="text-lg text-pix-coral">Are you sure?</p>
              <p className={`mt-1 ${mutedText}`}>
                Your account will be scheduled for permanent deletion in{" "}
                <span className="text-pix-butter">30 days</span>. You can cancel at any time before then.
              </p>
              {deleteError && <p role="alert" className="mt-2 text-sm text-pix-coral">{deleteError}</p>}
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

      <div className="flex justify-end xl:col-span-2">
        <button type="button" onClick={onDone} className={btnSmGhost}>
          Done editing
        </button>
      </div>
    </div>
  );
}
