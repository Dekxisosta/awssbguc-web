/**
 * Class strings for forms that sit directly on the site's black ground (profile setup, membership, ...),
 * in the same pixel-art direction as the rest of the site: butter type, thick square borders, hard offset
 * shadows, no blur, no rounded corners.
 *
 * Forms on a butter card (sign-in, sign-up, password setup) use features/auth/ui/pixel-form.ts instead.
 * Plain strings only (no "use client"), so these work from server and client modules alike.
 */

export const darkFocus =
  "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-teal";

export const darkLabel = "text-base text-pix-butter";

export const darkHint = "text-sm text-pix-butter/70";

export const darkErr = "flex items-center gap-1.5 text-sm text-pix-coral";

export const darkBanner =
  "flex items-start gap-2.5 border-4 border-pix-rust bg-pix-rust px-4 py-3 text-base text-pix-butter";

/** Solid butter button with a rust hard shadow. */
export const darkSubmit =
  `inline-flex items-center justify-center gap-2 border-4 border-pix-butter bg-pix-butter px-6 py-3 text-lg text-black ` +
  `shadow-pixel-rust-4 transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pixel-rust-2 ` +
  `disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${darkFocus}`;

/** Outlined butter button; fills on hover. */
export const darkOutline =
  `inline-flex items-center justify-center gap-2 border-4 border-pix-butter px-6 py-3 text-lg text-pix-butter ` +
  `transition-colors hover:bg-pix-butter hover:text-black ${darkFocus}`;

export function darkInput(hasError: boolean): string {
  return [
    "w-full border-4 bg-black px-3 py-2.5 text-base text-pix-butter",
    "placeholder:text-pix-butter/40 disabled:opacity-50",
    darkFocus,
    hasError ? "border-pix-rust" : "border-pix-butter",
  ].join(" ");
}
