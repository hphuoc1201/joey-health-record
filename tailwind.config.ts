import type { Config } from "tailwindcss";

// Material Design 3 (Material You) color roles, exposed as Tailwind colors.
// The actual hex values live as CSS variables in globals.css (:root), so the
// whole app themes from one place. Light scheme, blue-based primary.
const md = (name: string) => `var(--md-${name})`;

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- MD3 semantic roles ---
        primary: md("primary"),
        "on-primary": md("on-primary"),
        "primary-container": md("primary-container"),
        "on-primary-container": md("on-primary-container"),
        secondary: md("secondary"),
        "on-secondary": md("on-secondary"),
        "secondary-container": md("secondary-container"),
        "on-secondary-container": md("on-secondary-container"),
        tertiary: md("tertiary"),
        "on-tertiary": md("on-tertiary"),
        "tertiary-container": md("tertiary-container"),
        "on-tertiary-container": md("on-tertiary-container"),
        error: md("error"),
        "on-error": md("on-error"),
        "error-container": md("error-container"),
        "on-error-container": md("on-error-container"),
        surface: md("surface"),
        "surface-dim": md("surface-dim"),
        "surface-bright": md("surface-bright"),
        "surface-lowest": md("surface-container-lowest"),
        "surface-low": md("surface-container-low"),
        "surface-container": md("surface-container"),
        "surface-high": md("surface-container-high"),
        "surface-highest": md("surface-container-highest"),
        "on-surface": md("on-surface"),
        "on-surface-variant": md("on-surface-variant"),
        outline: md("outline"),
        "outline-variant": md("outline-variant"),
        "inverse-surface": md("inverse-surface"),
        "inverse-on-surface": md("inverse-on-surface"),
        scrim: md("scrim"),

        // --- Legacy scales, remapped to MD3 tones so existing bg-brand-*/
        // gray-* classes across the app adopt the new system automatically. ---
        brand: {
          50: "#eef3ff",
          100: "#dbe7ff", // primary-container
          200: "#b8ccff",
          300: "#8bb0ff",
          400: "#5b8dff",
          500: "#3a76f0",
          600: "#2563eb", // primary
          700: "#1b4fc4",
          800: "#123a9e",
        },
        gray: {
          50: "#f4f3fa", // surface-container-low
          100: "#ecebf3", // surface-container(ish) — chips
          200: "#dfe0e8", // outline-variant lighter — hairlines
          300: "#c3c6cf", // outline-variant — input borders
          400: "#8f9199", // muted icons
          500: "#5a5d66", // on-surface-variant — secondary text
          600: "#494c54",
          700: "#3a3d44", // body text
          800: "#26282e",
          900: "#1a1c1e", // on-surface
        },
        // Scrim / backdrop.
        ink: {
          800: "#26282e",
          900: "#1a1c1e",
          950: "#000000",
        },
      },
      borderRadius: {
        // MD3 shape scale.
        "md-xs": "4px",
        "md-sm": "8px",
        "md-md": "12px",
        "md-lg": "16px",
        "md-xl": "28px",
      },
      boxShadow: {
        // MD3 elevation levels.
        "md-1": "0 1px 2px 0 rgba(0,0,0,.06), 0 1px 3px 1px rgba(0,0,0,.10)",
        "md-2": "0 1px 2px 0 rgba(0,0,0,.06), 0 2px 6px 2px rgba(0,0,0,.10)",
        "md-3": "0 4px 8px 3px rgba(0,0,0,.10), 0 1px 3px 0 rgba(0,0,0,.10)",
        fab: "0 3px 8px 0 rgba(0,0,0,.15), 0 1px 3px 0 rgba(0,0,0,.12)",
      },
      fontFamily: {
        sans: ["var(--font-roboto)", "Roboto", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
