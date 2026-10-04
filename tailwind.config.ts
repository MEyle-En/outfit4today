import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        surface: "#18181b",
        accent: { DEFAULT: "#a855f7", soft: "#c084fc" },
      },
      fontFamily: {
        display: ["var(--font-clash)", "var(--font-inter)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(168,85,247,0.55)",
      },
      keyframes: {
        "sheet-in": { from: { transform: "translateY(100%)" }, to: { transform: "translateY(0)" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-from-top": {
          from: { opacity: "0", transform: "translateY(-24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-out-to-top": {
          from: { opacity: "1", transform: "translateY(0)" },
          to: { opacity: "0", transform: "translateY(-24px)" },
        },
        // Einmaliger Hüpfer beim Wechsel des Tabs
        "icon-pop": {
          "0%": { transform: "translateY(0) scale(1)" },
          "30%": { transform: "translateY(-6px) scale(1.15)" },
          "60%": { transform: "translateY(0) scale(0.95)" },
          "100%": { transform: "translateY(0) scale(1)" },
        },
        "heart-pop": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.4)" },
          "100%": { transform: "scale(1)" },
        },
        "check-pop": {
          "0%": { transform: "scale(0)" },
          "70%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "sheet-in": "sheet-in 0.28s cubic-bezier(0.32, 0.72, 0, 1)",
        "fade-in": "fade-in 0.2s ease-out",
        // "backwards": Startzustand während der Verzögerung (Stagger), danach greifen wieder Hover-Transforms
        "fade-in-up": "fade-in-up 0.4s ease-out backwards",
        "slide-in-from-top": "slide-in-from-top 0.3s ease-out",
        "slide-out-to-top": "slide-out-to-top 0.25s ease-in forwards",
        "icon-pop": "icon-pop 0.5s ease-out",
        "heart-pop": "heart-pop 0.35s ease-out",
        "check-pop": "check-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
