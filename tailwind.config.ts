import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        teal: "#4A9A9A", // Phase 1 — Stability
        pink: "#E75480", // Phase 2 — Strength
        green: "#5D8A5E", // Phase 3 — Size
        gold: "#C9A96E", // Phase 4 — Power
        rose: "#B9829A", // standalone/general
        ink: "#3E363A", // primary text
        gray: "#6B5F63", // secondary text
        grayLt: "#E4DADD", // borders, dividers
        bg: "#E9F4F2", // page background — light teal
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
