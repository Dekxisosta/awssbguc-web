// Shared look for the admin screens — same pixel-art language as the Events page and the nav.
// Black ground, butter (#fff7a1) type, 4px square borders, hard offset shadows.

export const focus =
  "focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-pix-teal";

export const BOX = "border-4 border-pix-teal";

export const BTN_PRIMARY =
  `inline-flex items-center justify-center gap-2 border-4 border-pix-butter bg-pix-butter px-3 py-1 text-base text-black shadow-pixel-rust-3 transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pixel-rust-1 disabled:pointer-events-none disabled:opacity-40 ${focus}`;
export const BTN_SECONDARY =
  `inline-flex items-center justify-center gap-2 border-4 border-pix-teal px-3 py-1 text-base text-pix-butter transition-colors hover:bg-pix-teal hover:text-black disabled:pointer-events-none disabled:opacity-40 ${focus}`;
export const BTN_SUBMIT =
  `flex items-center justify-center gap-2 border-4 border-pix-butter bg-pix-butter px-3 py-1 text-base text-black shadow-pixel-rust-3 transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-pixel-rust-1 disabled:pointer-events-none disabled:opacity-50 ${focus}`;

export const TH = "px-3 py-1 text-left text-base font-normal text-pix-butter/60";

export function inputCls(hasError?: boolean) {
  const base =
    "w-full border-4 bg-black px-2.5 py-1 text-base text-pix-butter placeholder:text-pix-butter/35 " +
    "transition-colors focus:outline-none disabled:opacity-50";
  return hasError
    ? `${base} border-pix-rust focus:border-pix-coral`
    : `${base} border-pix-butter/50 focus:border-pix-teal`;
}

// Only lists that can grow without bound (members, events, roles search, requests history,
// provisioning rows, the registrations sheet) get their own scroll area. Everything else flows
// with the page.
export const SCROLL_AREA =
  "max-h-[min(36rem,65dvh)] overflow-auto overscroll-contain [scrollbar-color:#fff7a1_#000] [scrollbar-width:thin]";
// Sticky header so column titles stay visible inside a scroll area.
export const THEAD_STICKY = "sticky top-0 z-10 bg-black";
