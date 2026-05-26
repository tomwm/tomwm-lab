import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "flip-in": { from: { transform: "rotateY(90deg)", opacity: "0" }, to: { transform: "rotateY(0deg)", opacity: "1" } },
        "flip-out": { from: { transform: "rotateY(0deg)", opacity: "1" }, to: { transform: "rotateY(-90deg)", opacity: "0" } },
        "slide-in": { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0)" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        "flip-in": "flip-in 0.2s ease-out",
        "flip-out": "flip-out 0.2s ease-in",
        "slide-in": "slide-in 0.25s ease-out",
        "fade-in": "fade-in 0.15s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
