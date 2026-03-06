import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body:    ["var(--font-body)",    "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)",    "monospace"],
      },
      colors: {
        cream:    "var(--cream)",
        espresso: "var(--espresso)",
        amber:    "var(--amber)",
        sage:     "var(--sage)",
        muted:    "var(--muted)",
        border:   "var(--border)",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.2" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        blink:  "blink 1.1s ease-in-out infinite",
        fadeUp: "fadeUp 0.4s ease both",
      },
    },
  },
  plugins: [],
};
export default config;
