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
        background: "#f4f4f0",
        surface: "#ffffff",
        surfaceHover: "#f8f8f6",
        border: "#000000",
        // Gumroad Neo-Brutalist Palette
        brutal: {
          bg: "#f4f4f0",
          card: "#ffffff",
          black: "#000000",
          pink: "#ff90e8",
          "pink-light": "#ffb8f1",
          yellow: "#ffc900",
          "yellow-light": "#ffea79",
          purple: "#90a8ed",
          "purple-light": "#b9caff",
          lavender: "#b2a8fd",
          mint: "#23a094",
          green: "#7fe382",
          gray: "#f0f0eb",
          muted: "#666666",
        },
        gold: {
          DEFAULT: "#ffc900",
          light: "#ffea79",
          dark: "#e0b000",
          glow: "rgba(255, 201, 0, 0.25)"
        },
        charcoal: {
          900: "#000000",
          800: "#1a1a1a",
          700: "#333333",
          600: "#555555",
          400: "#777777",
          200: "#222222"
        }
      },
      boxShadow: {
        brutal: "4px 4px 0px 0px #000000",
        "brutal-sm": "2px 2px 0px 0px #000000",
        "brutal-lg": "6px 6px 0px 0px #000000",
        "brutal-xl": "8px 8px 0px 0px #000000",
        "brutal-pink": "4px 4px 0px 0px #ff90e8",
        "brutal-yellow": "4px 4px 0px 0px #ffc900",
        "brutal-purple": "4px 4px 0px 0px #90a8ed",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-space-grotesk)", "Impact", "Cabinet Grotesk", "Arial Black", "sans-serif"],
        mono: ["JetBrains Mono", "Courier New", "monospace"]
      }
    },
  },
  plugins: [],
};

export default config;
