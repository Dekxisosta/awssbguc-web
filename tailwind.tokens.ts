/**
 * Single source of truth for the design tokens.
 * tailwind.config.ts turns these into utilities (bg-pix-butter, shadow-pixel-rust-4, max-w-page, ...).
 * Canvas / SVG code can't use class names, so it imports the same values from here.
 * Kept as plain data (no tailwind imports) so it is safe to bundle on the client.
 */

export const PAGE_MAX = "1300px";

export const colors = {
  brand: {
    green: "#00e482",
    dark: "#161d27",
    ink: "#0f1923", // text on a brand-green button
  },
  // Palette sampled from the pixel-art reference: black ground, butter-yellow type, four stripe colours.
  pix: {
    ink: "#000000",
    butter: "#fff7a1",
    green: "#3aaa6e",
    sage: "#5f9e80", // muted green, used in the stripe motif in place of mustard
    mustard: "#b89a0a",
    rust: "#b32a0e",
    teal: "#2c8f8f",
    shore: "#1f5c5c", // tint for the pixelated world map
    coral: "#e26a56", // "Discover" menu accent
    blush: "#ff9b85", // error text on dark
    amber: "#f9a825", // "AWS" menu accent
    crimson: "#cc0000", // member-card title
  },
  pine: {
    950: "#0b1613",
    900: "#12211c",
    800: "#193029",
    700: "#214238",
  },
  // Page and card backgrounds on the home page.
  surface: {
    page: "#050708",
    raised: "#0b0f10",
    well: "#0a1110",
    cta: "#0a0f0e",
  },
  // Moving side pixels (green-teal palette from the Operations poster).
  rain: {
    mint: "#2cf57f",
    jade: "#1fb877",
    deep: "#0d5c55",
    teal: "#1b9c94",
    frost: "#d9ffe9",
  },
  // Fake Discord window on the members page.
  discord: {
    rail: "#1e1f22",
    side: "#2b2d31",
    chat: "#313338",
    bar: "#232428",
    input: "#383a40",
    hover: "#404249",
    divider: "#4e5058",
    text: "#f2f3f5",
    muted: "#949ba4",
    icon: "#b5bac1",
    placeholder: "#6c6f78",
    blurple: "#5865f2",
    online: "#23a559",
  },
  // Watcher mascot (SVG).
  watcher: {
    body: "#1e2a35",
    rim: "#2e3f50",
    ear: "#152030",
    mouth: "#0f1e2c",
    whisker: "#8ca0b0",
    blush: "#ff6b6b",
  },
  // Dashboard side grid.
  neon: {
    purple: "#a855f7",
    indigo: "#6366f1",
  },
  lilac: "#b497cf", // default PixelBlast colour
  gridline: "rgb(255 255 255 / 0.05)",
  scrollbar: {
    DEFAULT: "rgb(200 200 200 / 0.15)",
    hover: "rgb(200 200 200 / 0.3)",
  },
  // Translucent white fills for glass cards and pills.
  glass: {
    DEFAULT: "rgb(255 255 255 / 0.03)",
    soft: "rgb(255 255 255 / 0.04)",
    strong: "rgb(255 255 255 / 0.06)",
  },
};

export const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** "#rrggbb" + alpha -> "rgb(r g b / a)" */
export const withAlpha = (hex: string, alpha: number) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${r} ${g} ${b} / ${alpha})`;
};

const { pix } = colors;

// Stripe "tunnel" motif: [colour, width in %]. Widths add up to 100.
export const STRIPES: readonly (readonly [string, number])[] = [
  [pix.rust, 8], [pix.teal, 10], [pix.ink, 3], [pix.green, 14], [pix.rust, 9], [pix.ink, 3],
  [pix.sage, 8], [pix.teal, 12], [pix.green, 9], [pix.ink, 3], [pix.rust, 11], [pix.teal, 10],
];

export const stripeGradient = (() => {
  let at = 0;
  const stops = STRIPES.map(([c, w]) => {
    const s = `${c} ${at}% ${at + w}%`;
    at += w;
    return s;
  });
  return `linear-gradient(90deg, ${stops.join(", ")})`;
})();

export const gradients = {
  stripes: stripeGradient,
  hairline: `linear-gradient(90deg, transparent, ${withAlpha("#ffffff", 0.14)}, transparent)`,
  photoFade: `linear-gradient(to top, ${withAlpha(pix.ink, 0.65)}, transparent)`,
  heroGlow: [
    `radial-gradient(60% 60% at 75% 0%, ${withAlpha(pix.teal, 0.2)}, transparent 70%)`,
    `radial-gradient(40% 50% at 8% 10%, ${withAlpha(pix.green, 0.1)}, transparent 70%)`,
  ].join(", "),
};

// Hard offset "pixel" shadows: shadow-pixel-<colour>-<px>, e.g. shadow-pixel-rust-4.
const pixelShadowColors = {
  rust: pix.rust,
  teal: pix.teal,
  green: pix.green,
  mustard: pix.mustard,
  ink: pix.ink,
  butter: pix.butter,
};
const pixelShadowSizes = [1, 2, 3, 4, 6, 8];

export const shadows: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(pixelShadowColors).flatMap(([name, hex]) =>
      pixelShadowSizes.map((n) => [`pixel-${name}-${n}`, `${n}px ${n}px 0 ${hex}`]),
    ),
  ),
  "glow-butter": `0 8px 30px -8px ${withAlpha(pix.butter, 0.5)}`,
  "glow-teal": `0 14px 34px -12px ${withAlpha(pix.teal, 0.7)}`,
};
