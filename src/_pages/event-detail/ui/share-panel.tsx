"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Mail, Share2 } from "lucide-react";

/**
 * Share panel for an event: icon buttons plus an editable post text.
 *
 * What each network lets a link pre-fill:
 *   - X, LinkedIn (composer link) and email accept the message in the URL.
 *   - Facebook's share_channel endpoint only accepts a URL, so the post text is copied to the clipboard
 *     and the person pastes it into the post.
 * The page link is always appended to the text, so editing the text can never drop it.
 */

const focus =
  "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-teal";

// lucide-react v1 ships no brand logos, so these three are inline SVGs (24×24, currentColor).
function FacebookLogo() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function LinkedInLogo() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const iconBtn = `flex h-11 w-11 items-center justify-center border-4 border-pix-butter/60 transition-colors hover:bg-pix-butter hover:text-black ${focus}`;

export function SharePanel({
  title,
  body,
  pageUrl,
  color,
  headingClass,
}: {
  title: string;
  /** Default post text, without the link (the link is added on send). */
  body: string;
  pageUrl: string;
  color: string;
  headingClass: string;
}) {
  const [text, setText] = useState(body);
  const [notice, setNotice] = useState("");
  const [canNativeShare, setCanNativeShare] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    return () => clearTimeout(timer.current);
  }, []);

  const post = text.trim();
  const full = `${post}\n${pageUrl}`;
  // X counts a link as 23 characters; keep the text itself comfortably under the 280 limit.
  const xText = post.length > 250 ? `${post.slice(0, 249).trimEnd()}…` : post;

  function say(message: string) {
    setNotice(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNotice(""), 8000);
  }

  async function copy(message: string) {
    try {
      await navigator.clipboard.writeText(full);
      say(message);
    } catch {
      say("Couldn't copy automatically. Open “Edit post text” and copy it from there.");
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, text: post, url: pageUrl });
    } catch {
      /* dismissed by the person: nothing to do */
    }
  }

  const enc = encodeURIComponent;
  const targets: {
    label: string;
    icon: React.ReactNode;
    href: string;
    external: boolean;
    onClick?: () => void;
  }[] = [
    {
      label: "Facebook",
      icon: <FacebookLogo />,
      href: `https://www.facebook.com/share_channel/?type=reshare&link=${enc(pageUrl)}&app_id=2309869772&source_surface=external_reshare&display=popup&hashtag=${enc("#AWSSBGUC")}&quote=${enc(post)}`,
      external: true,
      onClick: () => void copy("Post text copied. Paste it into your Facebook post."),
    },
    {
      label: "LinkedIn",
      icon: <LinkedInLogo />,
      href: `https://www.linkedin.com/feed/?shareActive=true&text=${enc(full)}`,
      external: true,
      onClick: () => void copy("Opening LinkedIn with your post. If it's empty, paste: the text is copied."),
    },
    {
      label: "X",
      icon: <XLogo />,
      href: `https://x.com/intent/post?text=${enc(xText)}&url=${enc(pageUrl)}`,
      external: true,
    },
    {
      label: "Email",
      icon: <Mail size={20} aria-hidden="true" />,
      href: `mailto:?subject=${enc(title)}&body=${enc(full)}`,
      external: false,
    },
  ];

  return (
    <section
      aria-labelledby="share-heading"
      className="border-4 bg-black p-5"
      style={{ borderColor: color, boxShadow: `6px 6px 0 ${color}` }}
    >
      <h2 id="share-heading" className={`${headingClass} flex items-center gap-2 text-3xl`}>
        <Share2 size={22} aria-hidden="true" />
        Share
      </h2>

      <div className="mt-4 flex flex-wrap gap-3">
        {targets.map(({ label, icon, href, external, onClick }) => (
          <a
            key={label}
            href={href}
            title={label}
            onClick={onClick}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            aria-label={external ? `Share on ${label} (opens in a new tab)` : "Share by email"}
            className={iconBtn}
          >
            {icon}
          </a>
        ))}
        {canNativeShare && (
          <button type="button" onClick={nativeShare} title="More apps" aria-label="Share with another app" className={iconBtn}>
            <Share2 size={20} aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={() => void copy("Post text and link copied.")}
          title="Copy post text"
          aria-label="Copy post text and link"
          className={iconBtn}
        >
          <Copy size={20} aria-hidden="true" />
        </button>
      </div>

      <details className="mt-4 text-base">
        <summary className={`cursor-pointer text-pix-butter/80 ${focus}`}>Edit post text</summary>
        <label htmlFor="share-text" className="sr-only">
          Post text
        </label>
        <textarea
          id="share-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          maxLength={1000}
          className="mt-2 w-full resize-y border-4 border-pix-butter/60 bg-black p-2 text-sm leading-snug text-pix-butter"
        />
        <p className="mt-1 text-sm text-pix-butter/60">The event link is added automatically.</p>
      </details>

      <p role="status" aria-live="polite" className="mt-3 min-h-[1.25rem] text-sm text-pix-butter/80">
        {notice}
      </p>
    </section>
  );
}
