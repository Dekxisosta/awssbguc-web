/**
 * src/shared/lib/showcase/service.ts
 *
 * Server-only. Reads and cleans up the repo showcase (migration 20260018).
 * Every function takes the service-role client: the tables have RLS enabled and no policies.
 */

import type { createAdminClient } from "@/src/shared/supabase/admin";
import { MAX_IMAGES_PER_REPO, type ShowcaseImage, type ShowcaseRepo } from "@/src/entities/showcase";

export const REPO_IMAGE_BUCKET = "repo-images";

type AdminClient = ReturnType<typeof createAdminClient>;

interface RepoRow {
  repo_id: string;
  owner: string;
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stars: number | null;
  note: string | null;
  position: number | null;
  profile_repo_images?: { image_id: string; public_url: string; position: number | null; created_at: string }[] | null;
}

/** The signed-in member's own showcase (shown on /profile and used by the editor). */
export async function loadOwnShowcase(admin: AdminClient, userId: string): Promise<ShowcaseRepo[]> {
  const { data, error } = await admin
    .from("profile_repos")
    .select(
      "repo_id, owner, name, html_url, description, language, stars, note, position, " +
        "profile_repo_images(image_id, public_url, position, created_at)",
    )
    .eq("profile_id", userId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Showcase fetch failed: ${error.message}`);

  return ((data ?? []) as unknown as RepoRow[]).map((r) => ({
    repo_id: r.repo_id,
    owner: r.owner,
    name: r.name,
    html_url: r.html_url,
    description: r.description,
    language: r.language,
    stars: r.stars ?? 0,
    note: r.note,
    images: (r.profile_repo_images ?? [])
      .slice()
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.created_at.localeCompare(b.created_at))
      .slice(0, MAX_IMAGES_PER_REPO)
      .map((i): ShowcaseImage => ({ image_id: i.image_id, url: i.public_url })),
  }));
}

/** A member's public showcase, from the `public_member_repos` view (opted-in members only). */
export async function loadPublicShowcase(admin: AdminClient, username: string): Promise<ShowcaseRepo[]> {
  const { data, error } = await admin
    .from("public_member_repos")
    .select("repo_id, owner, name, html_url, description, language, stars, note, images")
    .eq("username", username);

  if (error) throw new Error(`Public showcase fetch failed: ${error.message}`);

  type Row = Omit<ShowcaseRepo, "images" | "stars"> & { stars: number | null; images: ShowcaseImage[] | null };
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    ...r,
    stars: r.stars ?? 0,
    images: Array.isArray(r.images) ? r.images.slice(0, MAX_IMAGES_PER_REPO) : [],
  }));
}

/** Delete files from the repo-images bucket. Resolves to an error message, or null. */
export async function removeRepoImageFiles(admin: AdminClient, paths: string[]): Promise<string | null> {
  if (paths.length === 0) return null;
  const { error } = await admin.storage.from(REPO_IMAGE_BUCKET).remove(paths);
  return error ? error.message : null;
}

/**
 * Remove the showcased repos (and their picture files) whose owner is not `keepOwner`.
 * Called when the linked GitHub username changes or is removed: pass null to remove everything.
 */
export async function purgeShowcaseExcept(
  admin: AdminClient,
  userId: string,
  keepOwner: string | null,
): Promise<void> {
  const { data, error } = await admin
    .from("profile_repos")
    .select("repo_id, owner, profile_repo_images(storage_path)")
    .eq("profile_id", userId);
  if (error) throw new Error(`Showcase fetch failed: ${error.message}`);

  const stale = ((data ?? []) as unknown as {
    repo_id: string;
    owner: string;
    profile_repo_images?: { storage_path: string }[] | null;
  }[]).filter((r) => keepOwner === null || r.owner.toLowerCase() !== keepOwner.toLowerCase());
  if (stale.length === 0) return;

  const paths = stale.flatMap((r) => (r.profile_repo_images ?? []).map((i) => i.storage_path));
  const removeErr = await removeRepoImageFiles(admin, paths);
  if (removeErr) throw new Error(`Showcase image removal failed: ${removeErr}`);

  const { error: deleteErr } = await admin
    .from("profile_repos")
    .delete()
    .in("repo_id", stale.map((r) => r.repo_id));
  if (deleteErr) throw new Error(`Showcase delete failed: ${deleteErr.message}`);
}
