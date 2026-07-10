import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Sistema de vidrio en tema claro (blanco translúcido).
        glass: {
          DEFAULT: "rgba(255,255,255,0.70)",
          strong: "rgba(255,255,255,0.88)",
          border: "rgba(15,23,42,0.08)",
        },
        ink: "#0f172a",
        accent: {
          DEFAULT: "#4f46e5",
          soft: "#eef2ff",
        },
      },
      boxShadow: {
        glass: "0 10px 34px rgba(15, 23, 42, 0.08)",
        soft: "0 2px 14px rgba(15, 23, 42, 0.06)",
        glow: "0 12px 40px rgba(79, 70, 229, 0.20)",
      },
      animation: {
        "blob-slow": "blob 24s ease-in-out infinite",
        "blob-slower": "blob 32s ease-in-out infinite reverse",
        twinkle: "twinkle 4s ease-in-out infinite",
        float: "float 7s ease-in-out infinite",
      },
      keyframes: {
        blob: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(40px, -30px) scale(1.08)" },
          "66%": { transform: "translate(-30px, 20px) scale(0.96)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.12" },
          "50%": { opacity: "0.7" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
