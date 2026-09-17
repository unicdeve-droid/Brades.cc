import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        crimson: {
          start: "#EC0F45",
          end: "#960A2E",
        },
        ink: "#17171B",
        glass: "rgba(18,18,22,0.55)",
        okgreen: "#1FA463",
        okgreendark: "#168049",
      },
      fontFamily: {
        display: ["var(--font-sora)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(150, 10, 46, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
