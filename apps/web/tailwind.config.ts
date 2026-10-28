import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0d0e12",
        surface: "#16181f",
        surfaceHover: "#1f222c",
        border: "#272a38",
        gold: {
          DEFAULT: "#E5B842",
          light: "#FDF6E2",
          dark: "#B88E28",
          glow: "rgba(229, 184, 66, 0.15)"
        },
        charcoal: {
          900: "#0d0e12",
          800: "#16181f",
          700: "#222530",
          600: "#313545",
          400: "#7A819B",
          200: "#C3C7D9"
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Courier New", "monospace"]
      }
    },
  },
  plugins: [],
};

export default config;
