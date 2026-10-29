import { ExternalLinkIcon, focus } from "@/src/features/profile-edit/ui/pixel";
import { Tile } from "@/src/features/profile-edit/ui/Tile";

/** Base color of the graph's cells (ghchart shades it for the lighter levels). */
const GRAPH_COLOR = "3dae6b";

/**
 * A member's GitHub contribution graph, drawn by ghchart.rshah.org (an SVG of their public activity).
 * Shared by /profile and the public member page. Plain markup with no "use client", so it works from server
 * and client modules alike. It is an <img> on purpose: the SVG comes from a third-party host, so it is shown
 * as-is and never inlined into the page.
 */
export function GithubContributions({ username, headingClass }: { username: string; headingClass: string }) {
  const user = encodeURIComponent(username);

  return (
    <Tile
      id="tile-contributions"
      title="Contributions"
      border="border-pix-green"
      headingClass={headingClass}
      action={
        <a
          href={`https://github.com/${user}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 text-sm underline underline-offset-4 hover:bg-pix-butter hover:text-black ${focus}`}
        >
          @{username} <ExternalLinkIcon />
        </a>
      }
    >
      {/* ghchart draws for a light ground; invert + hue-rotate(180°) flips its lightness but keeps the greens
          green, so empty cells go dark, labels go light, and busier days read brighter, like GitHub's dark theme. */}
      <div className="overflow-x-auto bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://ghchart.rshah.org/${GRAPH_COLOR}/${user}`}
          alt={`GitHub contribution graph for ${username}`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-auto w-full min-w-[640px] invert hue-rotate-180"
        />
      </div>
    </Tile>
  );
}
