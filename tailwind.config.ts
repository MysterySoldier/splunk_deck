import type { Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        splunk: {
          orange: "#FF6B00",
          coral: "#FA5252",
          teal: "#00B4D8",
          amber: "#F59E0B",
          black: "#0B0E14",
          card: "#121722",
          panel: "#1A2232",
          border: "#2A3446",
          dim: "#8E9AA8",
          faint: "#333E4F",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
