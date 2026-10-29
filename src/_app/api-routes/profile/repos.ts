import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/src/shared/supabase/server";
import { createAdminClient } from "@/src/shared/supabase/admin";
import { getPublicRepo, isValidRepoName, listPublicRepos, type GitHubFailure } from "@/src/shared/lib/github";
import { REPO_IMAGE_BUCKET, removeRepoImageFiles } from "@/src/shared/lib/showcase/service";
import {
  MAX_IMAGES_PER_REPO,
  MAX_NOTE_LENGTH,
  MAX_SHOWCASE_REPOS,
  type ShowcaseImage,
  type ShowcaseRepo,
} from "@/src/entities/showcase";

/**
 * Repo showcase API (migration 20260018). Every handler:
 *   - requires a signed-in user,
 *   - works on the caller's own rows only (all queries filter by profile_id = user.id),
 *   - uses the service-role client, since the tables have RLS enabled and no policies.
 */

const IMAGE_LIMIT_MESSAGE =
  MAX_IMAGES_PER_REPO === 1
    ? "Each repo can have one picture. Remove the current one to add another."
    : `Each repo can have at most ${MAX_IMAGES_PER_REPO} pictures.`;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // matches the bucket's file_size_limit
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function json(body: object, status: number) {
  return NextResponse.json(body, { status });
}

const githubError = (reason: GitHubFailure) =>
  reason === "not_found"
    ? json({ success: false, error: "That repo wasn't found, or it isn't a public repo of your linked GitHub account." }, 404)
    : reason === "rate_limited"
      ? json({ success: false, error: "GitHub is rate limiting us right now. Please try again in a few minutes." }, 429)
      : json({ success: false, error: "Couldn't reach GitHub. Please try again." }, 502);

/** Identify the file from its first bytes instead of trusting the client-supplied type. */
function sniffImageMime(b: Uint8Array): string | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length >= 4 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return "image/gif";
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  )
    return "image/webp";
  return null;
}

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function linkedGithub(admin: ReturnType<typeof createAdminClient>, userId: string): Promise<string | null> {
  const { data } = await admin.from("profiles").select("github_username").eq("profile_id", userId).maybeSingle();
  return (data?.github_username as string | null | undefined) ?? null;
}

const NEEDS_GITHUB = "Link your GitHub username first (Edit profile → Contact).";

// ── GET /api/profile/github-repos ───────────────────────────────────────────

export async function handleGithubRepoList() {
  const user = await requireUser();
  if (!user) return json({ success: false, error: "You must be signed in." }, 401);

  const github = await linkedGithub(createAdminClient(), user.id);
  if (!github) return json({ success: false, error: NEEDS_GITHUB }, 400);

  const result = await listPublicRepos(github);
  if (!result.ok) return githubError(result.reason);
  return json({ success: true, username: github, repos: result.data }, 200);
}

// ── POST /api/profile/repos ──────────────────────────────────────────────────

export async function handleRepoAdd(request: NextRequest) {
  const user = await requireUser();
  if (!user) return json({ success: false, error: "You must be signed in." }, 401);

  let body: { name?: unknown };
  try {
    body = (await request.json()) as { name?: unknown };
  } catch {
    return json({ success: false, error: "Invalid JSON body." }, 400);
  }

  const admin = createAdminClient();
  const github = await linkedGithub(admin, user.id);
  if (!github) return json({ success: false, error: NEEDS_GITHUB }, 400);

  // Accept "repo" or "owner/repo"; the owner must be the linked account.
  if (typeof body.name !== "string") return json({ success: false, error: "Repo name is required." }, 400);
  let name = body.name.trim();
  if (name.includes("/")) {
    const [owner, rest, ...extra] = name.split("/");
    if (extra.length > 0 || owner.toLowerCase() !== github.toLowerCase())
      return json({ success: false, error: `Only repos owned by ${github} can be showcased.` }, 400);
    name = rest;
  }
  if (!isValidRepoName(name)) return json({ success: false, error: "That isn't a valid repo name." }, 400);

  const { data: existing, error: existingErr } = await admin
    .from("profile_repos")
    .select("repo_id, owner, name, position")
    .eq("profile_id", user.id);
  if (existingErr) {
    console.error("[POST /api/profile/repos] lookup failed:", existingErr.message);
    return json({ success: false, error: "Failed to add repo." }, 500);
  }
  const current = existing ?? [];
  if (current.length >= MAX_SHOWCASE_REPOS)
    return json({ success: false, error: `You can showcase at most ${MAX_SHOWCASE_REPOS} repos. Remove one first.` }, 409);
  if (current.some((r) => (r.name as string).toLowerCase() === name.toLowerCase() && (r.owner as string).toLowerCase() === github.toLowerCase()))
    return json({ success: false, error: "That repo is already in your showcase." }, 409);

  const repo = await getPublicRepo(github, name);
  if (!repo.ok) return githubError(repo.reason);
  // GitHub resolves renamed/transferred repos; only accept ones that still belong to the linked account.
  if (repo.data.owner.toLowerCase() !== github.toLowerCase())
    return json({ success: false, error: `Only repos owned by ${github} can be showcased.` }, 400);

  const position = current.reduce((max, r) => Math.max(max, (r.position as number) ?? 0), -1) + 1;
  const { data: inserted, error } = await admin
    .from("profile_repos")
    .insert({
      profile_id: user.id,
      owner: repo.data.owner,
      name: repo.data.name,
      html_url: repo.data.html_url,
      description: repo.data.description,
      language: repo.data.language,
      stars: repo.data.stars,
      position,
    })
    .select("repo_id, owner, name, html_url, description, language, stars, note")
    .single();

  if (error || !inserted) {
    const msg = error?.message ?? "";
    if (msg.includes("showcase_repo_limit"))
      return json({ success: false, error: `You can showcase at most ${MAX_SHOWCASE_REPOS} repos. Remove one first.` }, 409);
    if (error?.code === "23505") return json({ success: false, error: "That repo is already in your showcase." }, 409);
    console.error("[POST /api/profile/repos] insert failed:", msg);
    return json({ success: false, error: "Failed to add repo." }, 500);
  }

  const result: ShowcaseRepo = {
    repo_id: inserted.repo_id as string,
    owner: inserted.owner as string,
    name: inserted.name as string,
    html_url: inserted.html_url as string,
    description: inserted.description as string | null,
    language: inserted.language as string | null,
    stars: (inserted.stars as number | null) ?? 0,
    note: inserted.note as string | null,
    images: [],
  };
  return json({ success: true, repo: result }, 200);
}

// ── PATCH /api/profile/repos/[repoId]  (the member's own note) ───────────────

export async function handleRepoUpdate(request: NextRequest, repoId: string) {
  const user = await requireUser();
  if (!user) return json({ success: false, error: "You must be signed in." }, 401);
  if (!UUID_RE.test(repoId)) return json({ success: false, error: "Repo not found." }, 404);

  let body: { note?: unknown };
  try {
    body = (await request.json()) as { note?: unknown };
  } catch {
    return json({ success: false, error: "Invalid JSON body." }, 400);
  }

  let note: string | null;
  if (body.note === null || body.note === undefined || (typeof body.note === "string" && body.note.trim() === "")) {
    note = null;
  } else if (typeof body.note === "string") {
    note = body.note.trim();
    if (note.length > MAX_NOTE_LENGTH)
      return json({ success: false, error: `Keep it to ${MAX_NOTE_LENGTH} characters or fewer.`, field: "note" }, 400);
  } else {
    return json({ success: false, error: "Note must be a string.", field: "note" }, 400);
  }

  const { data, error } = await createAdminClient()
    .from("profile_repos")
    .update({ note })
    .eq("repo_id", repoId)
    .eq("profile_id", user.id)
    .select("repo_id");

  if (error) {
    console.error("[PATCH /api/profile/repos/:id] update failed:", error.message);
    return json({ success: false, error: "Failed to save." }, 500);
  }
  if (!data || data.length === 0) return json({ success: false, error: "Repo not found." }, 404);
  return json({ success: true }, 200);
}

// ── DELETE /api/profile/repos/[repoId] ───────────────────────────────────────

export async function handleRepoDelete(repoId: string) {
  const user = await requireUser();
  if (!user) return json({ success: false, error: "You must be signed in." }, 401);
  if (!UUID_RE.test(repoId)) return json({ success: false, error: "Repo not found." }, 404);

  const admin = createAdminClient();
  const { data: repo } = await admin
    .from("profile_repos")
    .select("repo_id, profile_repo_images(storage_path)")
    .eq("repo_id", repoId)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!repo) return json({ success: false, error: "Repo not found." }, 404);

  const paths = ((repo as unknown as { profile_repo_images?: { storage_path: string }[] | null }).profile_repo_images ?? []).map(
    (i) => i.storage_path,
  );
  const removeErr = await removeRepoImageFiles(admin, paths);
  if (removeErr) {
    console.error("[DELETE /api/profile/repos/:id] file removal failed:", removeErr);
    return json({ success: false, error: "Failed to remove the repo's pictures." }, 500);
  }

  const { error } = await admin.from("profile_repos").delete().eq("repo_id", repoId).eq("profile_id", user.id);
  if (error) {
    console.error("[DELETE /api/profile/repos/:id] delete failed:", error.message);
    return json({ success: false, error: "Failed to remove repo." }, 500);
  }
  return json({ success: true }, 200);
}

// ── POST /api/profile/repos/[repoId]/images ──────────────────────────────────

export async function handleRepoImageUpload(request: NextRequest, repoId: string) {
  const user = await requireUser();
  if (!user) return json({ success: false, error: "You must be signed in." }, 401);
  if (!UUID_RE.test(repoId)) return json({ success: false, error: "Repo not found." }, 404);

  const admin = createAdminClient();
  const { data: repo } = await admin
    .from("profile_repos")
    .select("repo_id")
    .eq("repo_id", repoId)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!repo) return json({ success: false, error: "Repo not found." }, 404);

  const { data: images, error: countErr } = await admin
    .from("profile_repo_images")
    .select("image_id, position")
    .eq("repo_id", repoId);
  if (countErr) {
    console.error("[POST /api/profile/repos/:id/images] lookup failed:", countErr.message);
    return json({ success: false, error: "Failed to upload image." }, 500);
  }
  if ((images ?? []).length >= MAX_IMAGES_PER_REPO)
    return json({ success: false, error: IMAGE_LIMIT_MESSAGE }, 409);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ success: false, error: "Invalid form data." }, 400);
  }
  const file = formData.get("file");
  if (!(file instanceof File)) return json({ success: false, error: "No file provided." }, 400);

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength > MAX_IMAGE_BYTES)
    return json({ success: false, error: "File too large. Maximum size is 3 MB." }, 413);

  const mime = sniffImageMime(bytes);
  if (!mime) return json({ success: false, error: "Unsupported file type. Upload a JPEG, PNG, GIF, or WebP image." }, 415);

  const imageId = crypto.randomUUID();
  const objectPath = `${user.id}/${imageId}.${MIME_TO_EXT[mime]}`;

  const { error: uploadError } = await admin.storage.from(REPO_IMAGE_BUCKET).upload(objectPath, bytes, {
    contentType: mime,
    upsert: false,
  });
  if (uploadError) {
    console.error("[POST /api/profile/repos/:id/images] upload failed:", uploadError.message);
    return json({ success: false, error: "Failed to upload image." }, 500);
  }

  const { data: { publicUrl } } = admin.storage.from(REPO_IMAGE_BUCKET).getPublicUrl(objectPath);
  const position = (images ?? []).reduce((max, i) => Math.max(max, (i.position as number) ?? 0), -1) + 1;

  const { error: insertError } = await admin.from("profile_repo_images").insert({
    image_id: imageId,
    repo_id: repoId,
    profile_id: user.id,
    storage_path: objectPath,
    public_url: publicUrl,
    position,
  });
  if (insertError) {
    // Don't leave an orphaned file behind.
    await removeRepoImageFiles(admin, [objectPath]);
    if (insertError.message.includes("showcase_image_limit"))
      return json({ success: false, error: IMAGE_LIMIT_MESSAGE }, 409);
    console.error("[POST /api/profile/repos/:id/images] insert failed:", insertError.message);
    return json({ success: false, error: "Failed to save image." }, 500);
  }

  const image: ShowcaseImage = { image_id: imageId, url: publicUrl };
  return json({ success: true, image }, 200);
}

// ── DELETE /api/profile/repos/[repoId]/images/[imageId] ──────────────────────

export async function handleRepoImageDelete(repoId: string, imageId: string) {
  const user = await requireUser();
  if (!user) return json({ success: false, error: "You must be signed in." }, 401);
  if (!UUID_RE.test(repoId) || !UUID_RE.test(imageId)) return json({ success: false, error: "Image not found." }, 404);

  const admin = createAdminClient();
  const { data: image } = await admin
    .from("profile_repo_images")
    .select("image_id, storage_path")
    .eq("image_id", imageId)
    .eq("repo_id", repoId)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!image) return json({ success: false, error: "Image not found." }, 404);

  const removeErr = await removeRepoImageFiles(admin, [image.storage_path as string]);
  if (removeErr) {
    console.error("[DELETE /api/profile/repos/:id/images/:id] file removal failed:", removeErr);
    return json({ success: false, error: "Failed to remove image." }, 500);
  }

  const { error } = await admin
    .from("profile_repo_images")
    .delete()
    .eq("image_id", imageId)
    .eq("profile_id", user.id);
  if (error) {
    console.error("[DELETE /api/profile/repos/:id/images/:id] delete failed:", error.message);
    return json({ success: false, error: "Failed to remove image." }, 500);
  }
  return json({ success: true }, 200);
}
