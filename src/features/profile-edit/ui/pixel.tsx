/**
 * Pixel-art tokens for the profile feature, matching HomeClient:
 * black ground, butter-yellow type, thick square borders, hard offset shadows, no blur.
 *
 * No "use client" here on purpose: these are plain strings and a stateless component,
 * so they work from both server and client modules.
 */

const STRIPES: [string, number][] = [
  ["#b32a0e", 8], ["#b89a0a", 10], ["#000000", 3], ["#3aaa6e", 14], ["#b32a0e", 9], ["#000000", 3],
  ["#b89a0a", 8], ["#2c8f8f", 12], ["#3aaa6e", 9], ["#000000", 3], ["#b32a0e", 11], ["#b89a0a", 10],
];

export const STRIPE_BG = (() => {
  let at = 0;
  const stops = STRIPES.map(([c, w]) => {
    const s = `${c} ${at}% ${at + w}%`;
    at += w;
    return s;
  });
  return `linear-gradient(90deg, ${stops.join(", ")})`;
})();

/** Rectangle with one-pixel-step cut corners (echoes the stepped edges of the home page's stripe tunnel). */
export const NOTCH =
  "polygon(0 6px, 6px 6px, 6px 0, calc(100% - 6px) 0, calc(100% - 6px) 6px, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 6px calc(100% - 6px), 0 calc(100% - 6px))";

export function Stripes({ className = "h-4" }: { className?: string }) {
  return <div aria-hidden="true" className={className} style={{ background: STRIPE_BG }} />;
}

export const wrap = "mx-auto w-full max-w-[1300px] px-5 sm:px-8";

export const focus =
  "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#2c8f8f]";

// ── Buttons ──────────────────────────────────────────────────────────────────

/** Black button with a rust shadow: for use on the butter badge. */
export const btnDark =
  `inline-flex items-center justify-center gap-2 border-4 border-black bg-black px-6 py-3 text-lg text-[#fff7a1] ` +
  `shadow-[4px_4px_0_#b32a0e] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#b32a0e] ${focus}`;

/** Outlined butter button: for use on the black ground. */
export const btnOutline =
  `inline-flex items-center justify-center gap-2 border-4 border-[#fff7a1] px-6 py-3 text-lg ` +
  `transition-colors hover:bg-[#fff7a1] hover:text-black ${focus}`;

/** Small outlined button on the butter badge. */
export const pillOnButter =
  `inline-flex items-center gap-1.5 border-4 border-black px-3 py-1 text-base transition-colors hover:bg-black hover:text-[#fff7a1] ${focus}`;

// Compact buttons used inside the edit modal (black ground).
const btnSm = `inline-flex items-center justify-center border-4 px-4 py-1.5 text-base transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${focus}`;
export const btnSmSolid = `${btnSm} border-[#fff7a1] bg-[#fff7a1] text-black hover:bg-transparent hover:text-[#fff7a1]`;
export const btnSmGhost = `${btnSm} border-[#fff7a1] text-[#fff7a1] hover:bg-[#fff7a1] hover:text-black`;
export const btnSmDanger = `${btnSm} border-[#b32a0e] bg-[#b32a0e] text-[#fff7a1] hover:bg-transparent`;
export const btnSmDangerGhost = `${btnSm} border-[#b32a0e] text-[#e26a56] hover:bg-[#b32a0e] hover:text-[#fff7a1]`;

/** Inline text link: underline, inverts on hover. */
export const linkCls = `underline underline-offset-4 hover:bg-[#fff7a1] hover:text-black ${focus}`;

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
