import { JetBrains_Mono, Jersey_10 } from "next/font/google";

/**
 * Single source of truth for the site's fonts. Import from here; never call a next/font loader in a page.
 *
 *  - bodyFont:    JetBrains Mono, every piece of running text, labels, buttons, forms and code-ish values.
 *  - displayFont: Jersey 10 (pixel), headlines and short display lines only.
 *
 * Both expose a CSS variable (set on <html> in app/layout.tsx) so Tailwind's `font-sans` / `font-mono` /
 * `font-heading` and the base styles in globals.css resolve to the same faces.
 * To change the site's font, change it here and nowhere else.
 */
export const bodyFont = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-body" });
export const displayFont = Jersey_10({ subsets: ["latin"], weight: "400", display: "swap", variable: "--font-display" });

/** Classes for the <html> element: defines --font-body and --font-display. */
export const fontVariables = `${bodyFont.variable} ${displayFont.variable}`;

/** Headline class. Set it directly: the element-level heading font in globals.css would otherwise win. */
export const hd = `${displayFont.className} font-normal leading-[0.9] tracking-normal`;
