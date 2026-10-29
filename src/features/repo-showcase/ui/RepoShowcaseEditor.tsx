"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  MAX_IMAGES_PER_REPO,
  MAX_NOTE_LENGTH,
  MAX_SHOWCASE_REPOS,
  type ShowcaseRepo,
} from "@/src/entities/showcase";
import { EditableField } from "@/src/features/profile-edit/ui/EditableField";
import {
  CloseIcon,
  ExternalLinkIcon,
  btnSmDanger,
  btnSmDangerGhost,
  btnSmGhost,
  btnSmSolid,
  focus,
} from "@/src/features/profile-edit/ui/pixel";
import { PICTURE_ACCEPT, checkPictureFile } from "../model/compressImage";
import type { RepoShowcaseApi } from "../model/useRepoShowcase";

const mutedText = "text-sm text-pix-butter/60";

const pictureNoun = MAX_IMAGES_PER_REPO === 1 ? "Picture" : "Pictures";

// ─── One showcased repo ──────────────────────────────────────────────────────

function EditorRepo({ repo, showcase }: { repo: ShowcaseRepo; showcase: RepoShowcaseApi }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"upload" | "remove-image" | "remove-repo" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const invalid = checkPictureFile(file);
    if (invalid) return setError(invalid);

    setError(null);
    setBusy("upload");
    const err = await showcase.addImage(repo.repo_id, file);
    if (err) setError(err);
    setBusy(null);
  }

  async function onRemoveImage(imageId: string) {
    setError(null);
    setBusy("remove-image");
    const err = await showcase.removeImage(repo.repo_id, imageId);
    if (err) setError(err);
    setBusy(null);
  }

  async function onRemoveRepo() {
    setError(null);
    setBusy("remove-repo");
    const err = await showcase.removeRepo(repo.repo_id);
    if (err) {
      setError(err);
      setBusy(null);
    }
    // On success this component unmounts with the repo.
  }

  const canAddImage = repo.images.length < MAX_IMAGES_PER_REPO;
  const working = busy !== null;

  return (
    <li className="min-w-0 border-4 border-pix-butter/40 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <a
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 break-all text-lg leading-tight underline underline-offset-4 ${focus}`}
          >
            {repo.owner}/{repo.name}
            <ExternalLinkIcon />
          </a>
          {repo.description && <p className={`mt-0.5 line-clamp-1 break-words ${mutedText}`}>{repo.description}</p>}
        </div>

        {confirmRemove ? (
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={onRemoveRepo} disabled={working} className={btnSmDanger}>
              {busy === "remove-repo" ? "Removing…" : "Confirm"}
            </button>
            <button type="button" onClick={() => setConfirmRemove(false)} disabled={working} className={btnSmGhost}>
              Keep
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            disabled={working}
            className={`${btnSmDangerGhost} shrink-0`}
          >
            Remove
          </button>
        )}
      </div>

      {confirmRemove && (
        <p className={`mt-2 ${mutedText}`}>This also deletes the {repo.images.length > 0 ? "picture and " : ""}note you added.</p>
      )}

      <div className="mt-3 grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-pix-butter/70">
            {pictureNoun}{" "}
            <span className="normal-case tracking-normal text-pix-butter/60">
              ({repo.images.length}/{MAX_IMAGES_PER_REPO})
            </span>
          </p>

          <ul className="mt-1.5 grid grid-cols-1 gap-2">
            {repo.images.map((img, i) => (
              <li key={img.image_id} className="relative aspect-video min-w-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={`${repo.name}, picture ${i + 1}`}
                  loading="lazy"
                  className="h-full w-full border-4 border-pix-butter/60 object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemoveImage(img.image_id)}
                  disabled={working}
                  aria-label={`Remove picture ${i + 1} of ${repo.name}`}
                  className={`absolute -right-2 -top-2 border-4 border-black bg-pix-rust p-0.5 text-pix-butter hover:bg-pix-coral disabled:opacity-50 ${focus}`}
                >
                  <CloseIcon size={14} />
                </button>
              </li>
            ))}

            {canAddImage && (
              <li className="aspect-video min-w-0">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={working}
                  className={`flex h-full w-full items-center justify-center border-4 border-dashed border-pix-butter/50 px-1 text-center text-sm leading-tight text-pix-butter/80 transition-colors hover:border-pix-butter hover:text-pix-butter disabled:cursor-not-allowed disabled:opacity-50 ${focus}`}
                >
                  {busy === "upload" ? "Uploading…" : "+ Add picture"}
                </button>
              </li>
            )}
          </ul>

          <input
            ref={fileRef}
            type="file"
            accept={PICTURE_ACCEPT}
            onChange={onPick}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />
          <p className="mt-1.5 text-xs leading-snug text-pix-butter/60">
            JPEG, PNG, GIF or WebP. Resized for you; GIFs become still images.
          </p>
        </div>

        <dl className="min-w-0">
          <EditableField
            id={`note-${repo.repo_id}`}
            label="What I built"
            value={repo.note}
            placeholder="e.g. A serverless RSVP app on Lambda + DynamoDB"
            hint={`Your own words about this project, up to ${MAX_NOTE_LENGTH} characters.`}
            onSave={(v) => showcase.saveNote(repo.repo_id, v)}
          />
        </dl>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-pix-coral">
          {error}
        </p>
      )}
    </li>
  );
}

// ─── Add-a-repo picker ───────────────────────────────────────────────────────

function AddRepo({ showcase, githubUsername }: { showcase: RepoShowcaseApi; githubUsername: string }) {
  const listId = useId();
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { optionsState, loadOptions, repos } = showcase;
  const taken = new Set(repos.map((r) => r.name.toLowerCase()));
  const available = optionsState.status === "ready" ? optionsState.repos.filter((r) => !taken.has(r.name.toLowerCase())) : [];
  const query = name.trim().toLowerCase();
  const matches = query ? available.filter((r) => r.name.toLowerCase().includes(query)) : available;
  const showList = open && optionsState.status !== "idle" && optionsState.status !== "error";
  const optionId = (i: number) => `${listId}-opt-${i}`;

  // Keep the highlighted option in view while arrowing through a long list.
  useEffect(() => {
    if (active >= 0) document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function pick(value: string) {
    setName(value);
    setError(null);
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (optionsState.status === "idle") loadOptions();
      setOpen(true);
      setActive((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && showList && active >= 0 && matches[active]) {
      e.preventDefault(); // pick the highlighted repo instead of submitting
      pick(matches[active].name);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = name.trim();
    if (!value) return setError("Pick or type a repo name.");
    setBusy(true);
    setError(null);
    setOpen(false);
    const err = await showcase.addRepo(value);
    if (err) setError(err);
    else setName("");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="border-4 border-dashed border-pix-butter/40 p-3">
      <label htmlFor={`${listId}-input`} className="text-xs uppercase tracking-wide text-pix-butter/70">
        Add a repo from {githubUsername}
      </label>

      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 sm:flex-1">
          <input
            id={`${listId}-input`}
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={showList && active >= 0 ? optionId(active) : undefined}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
              setActive(-1);
              setOpen(true);
              if (optionsState.status === "idle") loadOptions();
            }}
            onFocus={() => {
              setOpen(true);
              if (optionsState.status === "idle") loadOptions();
            }}
            onClick={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onKeyDown}
            disabled={busy}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Start typing a repo name"
            className={`w-full min-w-0 border-4 border-pix-teal bg-black px-3 py-1.5 text-lg text-pix-butter placeholder:text-pix-butter/40 disabled:opacity-50 ${focus}`}
          />

          {showList && (
            <ul
              id={listId}
              role="listbox"
              aria-label={`Public repos of ${githubUsername}`}
              // Keep focus in the input while clicking an option or dragging the scrollbar.
              onMouseDown={(e) => e.preventDefault()}
              className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto border-4 border-pix-teal bg-black"
            >
              {optionsState.status === "loading" && (
                <li role="presentation" className="px-3 py-2 text-sm text-pix-butter/60">
                  Loading your repos…
                </li>
              )}
              {optionsState.status === "ready" && matches.length === 0 && (
                <li role="presentation" className="px-3 py-2 text-sm text-pix-butter/60">
                  {available.length === 0
                    ? "No more public repos to suggest. You can still type a repo name."
                    : "No matching repos. You can still type the full name."}
                </li>
              )}
              {matches.map((r, i) => {
                const meta = [r.fork ? "fork" : null, r.language, r.stars > 0 ? `★ ${r.stars}` : null]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <li
                    key={r.name}
                    id={optionId(i)}
                    role="option"
                    aria-selected={i === active}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(r.name);
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={`flex cursor-pointer items-baseline justify-between gap-3 px-3 py-1.5 text-base ${
                      i === active ? "bg-pix-butter text-black" : "text-pix-butter"
                    }`}
                  >
                    <span className="min-w-0 truncate">{r.name}</span>
                    {meta && (
                      <span className={`shrink-0 text-xs ${i === active ? "text-black/70" : "text-pix-butter/60"}`}>
                        {meta}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <button type="submit" disabled={busy || !name.trim()} className={`${btnSmSolid} shrink-0`}>
          {busy ? "Adding…" : "Add"}
        </button>
      </div>

      {optionsState.status === "error" && (
        <p className="mt-2 text-sm text-pix-coral">
          {optionsState.message}{" "}
          <button type="button" onClick={loadOptions} className="underline underline-offset-4">
            Retry
          </button>
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-pix-coral">
          {error}
        </p>
      )}
      <p className="mt-1.5 text-xs text-pix-butter/60">
        Only public repos owned by your linked GitHub account can be showcased.
      </p>
    </form>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

/** The Showcase edit body on /profile (repo picker + per-repo note and picture). */
export function RepoShowcaseEditor({
  showcase,
  githubUsername,
}: {
  showcase: RepoShowcaseApi;
  githubUsername: string | null;
}) {
  if (!githubUsername) {
    return (
      <p className={mutedText}>
        Link your GitHub username under <span className="text-pix-butter">Contact</span> to showcase up to{" "}
        {MAX_SHOWCASE_REPOS} of your repos here.
      </p>
    );
  }

  const { repos } = showcase;

  return (
    <div className="flex flex-col gap-3">
      <p className={mutedText}>
        Choose up to {MAX_SHOWCASE_REPOS} public repos and add{" "}
        {MAX_IMAGES_PER_REPO === 1 ? "a picture" : `up to ${MAX_IMAGES_PER_REPO} pictures`} of what you built for each. They appear on your public profile when your directory listing is on.{" "}
        <span className="text-pix-butter">
          {repos.length}/{MAX_SHOWCASE_REPOS} repos
        </span>
      </p>

      {repos.length > 0 && (
        <ul className="flex flex-col gap-3">
          {repos.map((repo) => (
            <EditorRepo key={repo.repo_id} repo={repo} showcase={showcase} />
          ))}
        </ul>
      )}

      {repos.length < MAX_SHOWCASE_REPOS ? (
        <AddRepo showcase={showcase} githubUsername={githubUsername} />
      ) : (
        <p className={mutedText}>You&apos;ve used all {MAX_SHOWCASE_REPOS} slots. Remove a repo to pick a different one.</p>
      )}
    </div>
  );
}
