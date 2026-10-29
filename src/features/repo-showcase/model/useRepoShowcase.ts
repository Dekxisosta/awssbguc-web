"use client";

import { useCallback, useMemo, useState } from "react";
import type { GitHubRepoOption, ShowcaseImage, ShowcaseRepo } from "@/src/entities/showcase";
import { compressPicture } from "./compressImage";

const GENERIC_ERROR = "Something went wrong. Please try again.";

type Ok<T> = { success: true } & T;
type Fail = { success: false; error: string };

async function call<T extends object>(url: string, init?: RequestInit): Promise<Ok<T> | Fail> {
  try {
    const res = await fetch(url, init);
    return (await res.json()) as Ok<T> | Fail;
  } catch {
    return { success: false, error: GENERIC_ERROR };
  }
}

export type OptionsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; repos: GitHubRepoOption[] }
  | { status: "error"; message: string };

/**
 * Owns the showcased repos and the calls that persist them. Every action resolves to an error message
 * (or null on success), and local state changes only after the server accepted the change.
 *
 * `githubUsername` is the currently linked account: repos owned by anyone else are hidden at once, because
 * the server removes them when the link changes (and the public view ignores them in the meantime).
 */
export function useRepoShowcase(initial: ShowcaseRepo[], githubUsername: string | null) {
  const [stored, setStored] = useState<ShowcaseRepo[]>(initial);
  const [options, setOptions] = useState<{ for: string; state: OptionsState } | null>(null);

  const repos = useMemo(
    () =>
      githubUsername ? stored.filter((r) => r.owner.toLowerCase() === githubUsername.toLowerCase()) : [],
    [stored, githubUsername],
  );

  const patchRepo = (repoId: string, fn: (r: ShowcaseRepo) => ShowcaseRepo) =>
    setStored((list) => list.map((r) => (r.repo_id === repoId ? fn(r) : r)));

  // The picker list belongs to one GitHub account; ignore it once the link changes.
  const optionsState: OptionsState =
    options && githubUsername && options.for === githubUsername ? options.state : { status: "idle" };

  const loadOptions = useCallback(async () => {
    if (!githubUsername) return;
    const forUser = githubUsername;
    setOptions({ for: forUser, state: { status: "loading" } });
    const data = await call<{ repos: GitHubRepoOption[] }>("/api/profile/github-repos");
    setOptions({
      for: forUser,
      state: data.success
        ? { status: "ready", repos: data.repos }
        : { status: "error", message: data.error },
    });
  }, [githubUsername]);

  async function addRepo(name: string): Promise<string | null> {
    const data = await call<{ repo: ShowcaseRepo }>("/api/profile/repos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!data.success) return data.error;
    setStored((list) => [...list, data.repo]);
    return null;
  }

  async function removeRepo(repoId: string): Promise<string | null> {
    const data = await call<object>(`/api/profile/repos/${repoId}`, { method: "DELETE" });
    if (!data.success) return data.error;
    setStored((list) => list.filter((r) => r.repo_id !== repoId));
    return null;
  }

  async function saveNote(repoId: string, note: string): Promise<string | null> {
    const data = await call<object>(`/api/profile/repos/${repoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: note || null }),
    });
    if (!data.success) return data.error;
    patchRepo(repoId, (r) => ({ ...r, note: note || null }));
    return null;
  }

  async function addImage(repoId: string, file: File): Promise<string | null> {
    let blob: Blob;
    try {
      blob = await compressPicture(file);
    } catch (err) {
      return err instanceof Error ? err.message : GENERIC_ERROR;
    }
    const form = new FormData();
    form.append("file", blob, "picture.webp");
    const data = await call<{ image: ShowcaseImage }>(`/api/profile/repos/${repoId}/images`, {
      method: "POST",
      body: form,
    });
    if (!data.success) return data.error;
    patchRepo(repoId, (r) => ({ ...r, images: [...r.images, data.image] }));
    return null;
  }

  async function removeImage(repoId: string, imageId: string): Promise<string | null> {
    const data = await call<object>(`/api/profile/repos/${repoId}/images/${imageId}`, { method: "DELETE" });
    if (!data.success) return data.error;
    patchRepo(repoId, (r) => ({ ...r, images: r.images.filter((i) => i.image_id !== imageId) }));
    return null;
  }

  return { repos, optionsState, loadOptions, addRepo, removeRepo, saveNote, addImage, removeImage };
}

export type RepoShowcaseApi = ReturnType<typeof useRepoShowcase>;
