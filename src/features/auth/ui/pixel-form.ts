/**
 * Class strings for the sign-in / register forms, in the pixel-art direction of the home page.
 * The forms sit on a butter (#fff7a1) card with black text: black inputs, thick square borders,
 * hard offset shadows, no blur, no rounded corners.
 */

export const focusRing =
  "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#2c8f8f]";

export const labelCls = "text-base text-black";

export const errTxt = "flex items-center gap-1.5 text-sm text-[#b32a0e]";

export const hintTxt = "text-sm text-black/70";

export const bannerCls =
  "flex items-start gap-2.5 border-4 border-[#b32a0e] bg-[#b32a0e] px-4 py-3 text-base text-[#fff7a1]";

export const submitCls =
  `mt-1 flex items-center justify-center border-4 border-black bg-black px-4 py-3 text-lg text-[#fff7a1] ` +
  `shadow-[4px_4px_0_#b32a0e] transition-transform hover:translate-x-[2px] hover:translate-y-[2px] ` +
  `hover:shadow-[2px_2px_0_#b32a0e] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`;

export const eyeBtnCls =
  `absolute inset-y-0 right-0 flex items-center px-3 text-[#fff7a1]/70 transition-colors hover:text-[#fff7a1] ${focusRing}`;

export const linkBtn = `underline underline-offset-4 hover:bg-black hover:text-[#fff7a1] ${focusRing}`;

export function inputClass(hasError: boolean): string {
  return [
    "w-full border-4 bg-black px-3 py-2.5 text-base text-[#fff7a1]",
    "placeholder:text-[#fff7a1]/40 disabled:opacity-50",
    "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#2c8f8f]",
    hasError ? "border-[#b32a0e]" : "border-black",
  ].join(" ");
}
