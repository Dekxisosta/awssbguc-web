import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import { PAGE_MAX, colors, gradients, shadows } from "./tailwind.tokens";

// Narrow column that widens into a stepped base, like the reference.
const FLARE =
  "polygon(12% 0, 88% 0, 88% 58%, 92% 58%, 92% 70%, 96% 70%, 96% 82%, 100% 82%, 100% 100%, 0 100%, 0 82%, 4% 82%, 4% 70%, 8% 70%, 8% 58%, 12% 58%)";

// Soft vignette so the pixel grid fades out toward the edges of a card.
const fade = (at: string, stop: number) => {
  const mask = `radial-gradient(ellipse at ${at}, black, transparent ${stop}%)`;
  return { maskImage: mask, WebkitMaskImage: mask };
};

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx,jsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "JetBrains Mono", "ui-monospace", "monospace"],
        mono: ["var(--font-body)", "JetBrains Mono", "ui-monospace", "monospace"],
        heading: ["var(--font-body)", "JetBrains Mono", "ui-monospace", "monospace"],
        display: ["var(--font-display)", "Jersey 10", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tighter: "-0.04em",
        tight: "-0.02em",
        eyebrow: "0.2em",
      },
      colors,
      fontSize: {
        micro: "11px",
        hero: ["clamp(2.75rem, 6.5vw, 5.25rem)", { lineHeight: "1.02" }],
        cta: ["clamp(2.5rem, 6vw, 4.75rem)", { lineHeight: "1.03" }],
      },
      lineHeight: {
        display: "0.9",
        heading: "1.08",
      },
      maxWidth: {
        page: PAGE_MAX,
        tunnel: "420px",
        globe: "560px",
      },
      width: {
        photo: "66%",
        card: "90%",
        // Side-pixel gutter: whatever is left either side of the page column, between 16px and 320px.
        gutter: `clamp(16px, calc((100% - ${PAGE_MAX}) / 2), 320px)`,
      },
      height: {
        "duck-strip": "240px",
        "hero-glow": "680px",
      },
      borderRadius: {
        panel: "28px",
        nub: "2px",
      },
      zIndex: {
        "modal-backdrop": "99990",
        modal: "99991",
      },
      gridTemplateColumns: {
        hero: "1.1fr 0.9fr",
        split: "1fr auto",
      },
      boxShadow: shadows,
      backgroundImage: {
        stripes: gradients.stripes,
        hairline: gradients.hairline,
        "photo-fade": gradients.photoFade,
        "hero-glow": gradients.heroGlow,
      },
    },
  },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        ".img-pixelated": { imageRendering: "pixelated" },
        ".clip-flare": { clipPath: FLARE },
        ".pixel-fade-mascot": fade("50% 45%", 75),
        ".pixel-fade-globe": fade("50% 50%", 80),
        ".pixel-fade-cta": fade("85% 50%", 65),
      });
    }),
  ],
};

export default config;
