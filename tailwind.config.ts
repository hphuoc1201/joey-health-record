import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
        },
        // Dark navigation surface (Metronic-style near-black).
        ink: {
          800: "#1a1d23",
          900: "#141519",
          950: "#0f1013",
        },
      },
      boxShadow: {
        fab: "0 8px 24px -6px rgba(37, 99, 235, 0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
