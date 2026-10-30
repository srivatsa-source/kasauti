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
        background: "#000000",
        surface: "#09090b",
        surfaceHover: "#121215",
        surfaceActive: "#18181b",
        border: "#27272a",
        borderSubtle: "#18181b",
        borderStrong: "#3f3f46",
        // Minimalist monochrome mappings
        mono: {
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b",
          700: "#3f3f46",
          800: "#27272a",
          900: "#18181b",
          950: "#09090b",
        },
        // Backward-compatible aliases mapped cleanly to monochrome
        gold: {
          DEFAULT: "#ffffff",
          light: "#fafafa",
          dark: "#a1a1aa",
          glow: "rgba(255, 255, 255, 0.12)"
        },
        charcoal: {
          900: "#09090b",
          800: "#121215",
          700: "#1c1c20",
          600: "#27272a",
          500: "#52525b",
          400: "#a1a1aa",
          200: "#e4e4e7",
          100: "#f4f4f5"
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Menlo", "Consolas", "Courier New", "monospace"]
      }
    },
  },
  plugins: [],
};

export default config;
