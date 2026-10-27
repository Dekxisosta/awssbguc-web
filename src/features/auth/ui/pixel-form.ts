/**
 * Class strings for the sign-in / register forms, in the pixel-art direction of the home page.
 * The forms sit on a butter (#fff7a1) card with black text: black inputs, thick square borders,
 * hard offset shadows, no blur, no rounded corners.
 */

export const focusRing =
  "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-teal";

export const labelCls = "text-base text-black";

export const errTxt = "flex items-center gap-1.5 text-sm text-pix-rust";

export const hintTxt = "text-sm text-black/70";

export const bannerCls =
  "flex items-start gap-2.5 border-4 border-pix-rust bg-pix-rust px-4 py-3 text-base text-pix-butter";

export const submitCls =
  `mt-1 flex items-center justify-center border-4 border-black bg-black px-4 py-3 text-lg text-pix-butter ` +
  `shadow-pixel-rust-4 transition-transform hover:translate-x-[2px] hover:translate-y-[2px] ` +
  `hover:shadow-pixel-rust-2 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

export const eyeBtnCls =
  `absolute inset-y-0 right-0 flex items-center px-3 text-pix-butter/70 transition-colors hover:text-pix-butter ${focusRing}`;

export const linkBtn = `underline underline-offset-4 hover:bg-black hover:text-pix-butter ${focusRing}`;

export function inputClass(hasError: boolean): string {
  return [
    "w-full border-4 bg-black px-3 py-2.5 text-base text-pix-butter",
    "placeholder:text-pix-butter/40 disabled:opacity-50",
    "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-teal",
    hasError ? "border-pix-rust" : "border-black",
  ].join(" ");
}
