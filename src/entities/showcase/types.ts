/** Limits of the GitHub repo showcase. The database enforces the same numbers (migrations 20260018 and 20260019). */
export const MAX_SHOWCASE_REPOS = 3;
export const MAX_IMAGES_PER_REPO = 1;
export const MAX_NOTE_LENGTH = 280;

export interface ShowcaseImage {
  image_id: string;
  /** Public URL in the repo-images bucket. */
  url: string;
}

/** A repo a member chose to show on their profile, with their own note and pictures. */
export interface ShowcaseRepo {
  repo_id: string;
  owner: string;
  name: string;
  html_url: string;
  /** Snapshot of the GitHub description taken when the repo was added. */
  description: string | null;
  language: string | null;
  stars: number;
  /** The member's own "what I built" text. */
  note: string | null;
  images: ShowcaseImage[];
}

/** One entry of the repo picker (the member's public GitHub repos). */
export interface GitHubRepoOption {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  fork: boolean;
}
