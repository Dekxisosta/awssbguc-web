/**
 * Pixel-art tokens for the profile feature, matching HomeClient:
 * black ground, butter-yellow type, thick square borders, hard offset shadows, no blur.
 *
 * No "use client" here on purpose: these are plain strings and a stateless component,
 * so they work from both server and client modules.
 */

/** Rectangle with one-pixel-step cut corners (echoes the stepped edges of the home page's stripe tunnel). */
export const NOTCH =
  "polygon(0 6px, 6px 6px, 6px 0, calc(100% - 6px) 0, calc(100% - 6px) 6px, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 6px calc(100% - 6px), 0 calc(100% - 6px))";

export function Stripes({ className = "h-4" }: { className?: string }) {
  return <div aria-hidden="true" className={`bg-stripes ${className}`} />;
}

export const wrap = "mx-auto w-full max-w-page px-5 sm:px-8";

export const focus =
  "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-teal";

// ── Buttons ──────────────────────────────────────────────────────────────────

/** Black button with a rust shadow: for use on the butter badge. */
export const btnDark =
  `inline-flex items-center justify-center gap-2 border-4 border-black bg-black px-6 py-3 text-lg text-pix-butter ` +
  `shadow-pixel-rust-4 transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pixel-rust-2 ${focus}`;

/** Outlined butter button: for use on the black ground. */
export const btnOutline =
  `inline-flex items-center justify-center gap-2 border-4 border-pix-butter px-6 py-3 text-lg ` +
  `transition-colors hover:bg-pix-butter hover:text-black ${focus}`;

/** Small outlined button on the butter badge. */
export const pillOnButter =
  `inline-flex items-center gap-1.5 border-4 border-black px-3 py-1 text-base transition-colors hover:bg-black hover:text-pix-butter ${focus}`;

// Compact buttons used inside the edit modal (black ground).
const btnSm = `inline-flex items-center justify-center border-4 px-4 py-1.5 text-base transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${focus}`;
export const btnSmSolid = `${btnSm} border-pix-butter bg-pix-butter text-black hover:bg-transparent hover:text-pix-butter`;
export const btnSmGhost = `${btnSm} border-pix-butter text-pix-butter hover:bg-pix-butter hover:text-black`;
export const btnSmDanger = `${btnSm} border-pix-rust bg-pix-rust text-pix-butter hover:bg-transparent`;
export const btnSmDangerGhost = `${btnSm} border-pix-rust text-pix-coral hover:bg-pix-rust hover:text-pix-butter`;

/** Inline text link: underline, inverts on hover. */
export const linkCls = `underline underline-offset-4 hover:bg-pix-butter hover:text-black ${focus}`;

// ── Icons ────────────────────────────────────────────────────────────────────

export function PencilIcon({ size = 16 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5 20.5 7.5 8 20l-5 1 1-5z" />
    </svg>
  );
}

export function ExternalLinkIcon({ size = 12 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6H5V6h6" />
    </svg>
  );
}

export function CloseIcon({ size = 18 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square" aria-hidden="true">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
