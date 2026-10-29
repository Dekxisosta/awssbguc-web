import type { ShowcaseRepo } from "@/src/entities/showcase";
import { ExternalLinkIcon, focus } from "@/src/features/profile-edit/ui/pixel";

/**
 * Read-only repo card, shared by /profile and the public member page: repo link, GitHub description,
 * language and stars, the member's own "what I built" note, and its picture.
 * Compact: the picture sits beside the text from `sm` up.
 * No "use client": it is plain markup, so it works from server and client modules alike.
 */
export function RepoCard({ repo, headingClass }: { repo: ShowcaseRepo; headingClass: string }) {
  const hasImages = repo.images.length > 0;

  return (
    <li className="min-w-0 border-4 border-pix-butter/60 p-3">
      <div className={`grid gap-3 ${hasImages ? "sm:grid-cols-[10rem_minmax(0,1fr)]" : ""}`}>
        <div className="min-w-0">
          <h3 className={`${headingClass} break-words text-2xl leading-none`}>
            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-baseline gap-2 underline-offset-4 hover:underline ${focus}`}
            >
              <span className="min-w-0 [overflow-wrap:anywhere]">{repo.name}</span>
              <ExternalLinkIcon size={12} />
            </a>
          </h3>

          {(repo.language || repo.stars > 0) && (
            <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-pix-butter/70">
              {repo.language && <span>{repo.language}</span>}
              {repo.stars > 0 && <span>★ {repo.stars}</span>}
            </p>
          )}

          {repo.description && (
            <p className="mt-1.5 line-clamp-2 break-words text-sm leading-snug text-pix-butter/80">{repo.description}</p>
          )}

          {repo.note && (
            <p className="mt-2 whitespace-pre-line break-words text-base leading-snug">
              <span className="mr-2 text-xs uppercase tracking-wide text-pix-butter/60">What I built</span>
              {repo.note}
            </p>
          )}
        </div>

        {hasImages && (
          <ul aria-label={`Pictures of ${repo.name}`} className="grid grid-cols-1 content-start gap-2 sm:order-first">
            {repo.images.map((img, i) => (
              <li key={img.image_id} className="min-w-0">
                <a
                  href={img.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block aspect-video overflow-hidden border-4 border-pix-butter/60 bg-black hover:border-pix-butter ${focus}`}
                >
                  {/* Plain <img>: a public Supabase Storage URL, shown as-is. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={`${repo.name}, picture ${i + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}
