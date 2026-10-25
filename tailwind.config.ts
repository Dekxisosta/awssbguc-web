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
        // Palette sampled from the pixel-art reference: black ground, butter-yellow type, four stripe colours.
        pix: {
          ink: "#000000",
          butter: "#fff7a1",
          green: "#3aaa6e",
          mustard: "#b89a0a",
          rust: "#b32a0e",
          teal: "#2c8f8f",
        },
        pine: {
          950: "#0b1613",
          900: "#12211c",
          800: "#193029",
          700: "#214238",
        },
      },
    },
  },
  plugins: [],
};

export default config;