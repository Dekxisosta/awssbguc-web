/**
 * src/shared/lib/github/index.ts
 *
 * Server-only. Tiny GitHub REST client for the repo showcase: list a user's public repos (for the
 * picker) and fetch one repo (to verify it exists, is public and belongs to the linked account).
 *
 * Unauthenticated GitHub calls are limited to 60/hour per IP, which a shared host burns quickly.
 * Set GITHUB_TOKEN (any token with no scopes works for public data) to raise that to 5,000/hour.
 */

import type { GitHubRepoOption } from "@/src/entities/showcase";

export type GitHubFailure = "not_found" | "rate_limited" | "unavailable";
export type GitHubResult<T> = { ok: true; data: T } | { ok: false; reason: GitHubFailure };

export interface GitHubRepoDetail {
  owner: string;
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stars: number;
}

/** Valid GitHub repo name: letters, digits, `.`, `_`, `-` (and not "." / ".."). */
export function isValidRepoName(value: string): boolean {
  return /^[A-Za-z0-9._-]{1,100}$/.test(value) && value !== "." && value !== "..";
}

async function githubGet(path: string, revalidateSeconds: number): Promise<GitHubResult<unknown>> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "awssbguc-web",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  try {
    const res = await fetch(`https://api.github.com${path}`, {
      headers,
      ...(revalidateSeconds > 0 ? { next: { revalidate: revalidateSeconds } } : { cache: "no-store" as const }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 404) return { ok: false, reason: "not_found" };
    if (res.status === 403 || res.status === 429) return { ok: false, reason: "rate_limited" };
    if (!res.ok) return { ok: false, reason: "unavailable" };
    return { ok: true, data: await res.json() };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

interface RawRepo {
  name?: unknown;
  owner?: { login?: unknown };
  description?: unknown;
  language?: unknown;
  stargazers_count?: unknown;
  fork?: unknown;
  private?: unknown;
}

const str = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null);

/** The linked user's public repos, most recently pushed first (max 100). Cached for a few minutes. */
export async function listPublicRepos(username: string): Promise<GitHubResult<GitHubRepoOption[]>> {
  const res = await githubGet(
    `/users/${encodeURIComponent(username)}/repos?type=owner&sort=pushed&direction=desc&per_page=100`,
    300,
  );
  if (!res.ok) return res;
  if (!Array.isArray(res.data)) return { ok: false, reason: "unavailable" };

  const repos: GitHubRepoOption[] = [];
  for (const raw of res.data as RawRepo[]) {
    const name = str(raw.name);
    if (!name || raw.private === true) continue;
    repos.push({
      name,
      description: str(raw.description),
      language: str(raw.language),
      stars: typeof raw.stargazers_count === "number" ? raw.stargazers_count : 0,
      fork: raw.fork === true,
    });
  }
  return { ok: true, data: repos };
}

/** One public repo, fresh (not cached): used to verify and snapshot a repo at the moment it is added. */
export async function getPublicRepo(owner: string, name: string): Promise<GitHubResult<GitHubRepoDetail>> {
  const res = await githubGet(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`, 0);
  if (!res.ok) return res;

  const raw = res.data as RawRepo;
  const login = str(raw.owner?.login);
  const repoName = str(raw.name);
  if (!login || !repoName || raw.private === true) return { ok: false, reason: "not_found" };

  return {
    ok: true,
    data: {
      owner: login,
      name: repoName,
      // Built here instead of trusting a URL from the response.
      html_url: `https://github.com/${login}/${repoName}`,
      description: str(raw.description),
      language: str(raw.language),
      stars: typeof raw.stargazers_count === "number" ? raw.stargazers_count : 0,
    },
  };
}
