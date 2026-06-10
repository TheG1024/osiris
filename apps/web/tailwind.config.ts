import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        osiris: {
          bg: "var(--osiris-bg)",
          "bg-deep": "var(--osiris-bg-deep)",
          surface: "var(--osiris-surface)",
          "surface-elevated": "var(--osiris-surface-elevated)",
          panel: "var(--osiris-panel)",
          border: "var(--osiris-border)",
          "border-active": "var(--osiris-border-active)",
          "border-glow": "var(--osiris-border-glow)",
          accent: "var(--osiris-accent)",
          "accent-dim": "var(--osiris-accent-dim)",
          "accent-bright": "var(--osiris-accent-bright)",
          "accent-glow": "var(--osiris-accent-glow)",
          "accent-glow-strong": "var(--osiris-accent-glow-strong)",
          amber: "var(--osiris-amber)",
          "amber-dim": "var(--osiris-amber-dim)",
          "amber-glow": "var(--osiris-amber-glow)",
          success: "var(--osiris-success)",
          warning: "var(--osiris-warning)",
          danger: "var(--osiris-danger)",
          critical: "var(--osiris-critical)",
          aircraft: "var(--osiris-aircraft)",
          ship: "var(--osiris-ship)",
          satellite: "var(--osiris-satellite)",
          weather: "var(--osiris-weather)",
          camera: "var(--osiris-camera)",
          fire: "var(--osiris-fire)",
          earthquake: "var(--osiris-earthquake)",
          text: "var(--osiris-text)",
          "text-dim": "var(--osiris-text-dim)",
          "text-muted": "var(--osiris-text-muted)",
          "text-faint": "var(--osiris-text-faint)",
          grid: "var(--osiris-grid)",
          "grid-line": "var(--osiris-grid-line)",
        },
      },
      fontFamily: {
        display: ["Orbitron", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "glass-gradient": "linear-gradient(135deg, rgba(12, 15, 26, 0.9) 0%, rgba(3, 7, 18, 0.95) 100%)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "radar-scan": "radar-scan 4s linear infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "radar-scan": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;