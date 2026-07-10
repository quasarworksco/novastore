import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        glass: {
          DEFAULT: "rgba(255,255,255,0.08)",
          strong: "rgba(255,255,255,0.14)",
          border: "rgba(255,255,255,0.16)",
        },
      },
      boxShadow: {
        glass: "0 8px 32px rgba(2, 6, 23, 0.35)",
        glow: "0 0 40px rgba(139, 92, 246, 0.35)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "blob-slow": "blob 18s ease-in-out infinite",
        "blob-slower": "blob 26s ease-in-out infinite reverse",
      },
      keyframes: {
        blob: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(60px, -40px) scale(1.1)" },
          "66%": { transform: "translate(-40px, 30px) scale(0.95)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
