import type { Config } from "tailwindcss";

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
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["var(--font-bricolage)", "Bricolage Grotesque", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tighter: "-0.04em",
        tight: "-0.02em",
      },
      colors: {
        brand: {
          green: "#00e482",
          dark: "#161d27",
        },
      },
    },
  },
  plugins: [],
};

export default config;
