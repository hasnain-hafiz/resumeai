/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Design tokens for the Authentication feature UI - see docs/DESIGN.md
        ink: {
          950: "#0B0D12",
          900: "#12151C",
          800: "#1B1F2A",
          700: "#262B38",
        },
        paper: {
          50: "#FAFAF9",
          100: "#F2F1EE",
        },
        accent: {
          DEFAULT: "#5B5FEF",
          hover: "#4A4EDB",
          soft: "#EEEEFD",
        },
        success: "#1FAA6E",
        danger: "#E5484D",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,18,27,0.04), 0 8px 24px rgba(16,18,27,0.06)",
      },
    },
  },
  plugins: [],
};
