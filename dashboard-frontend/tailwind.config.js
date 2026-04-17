/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["SC Prosper Sans", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#eef7ff",
          100: "#cde3fb", // Extracted --sc--hero-news--category--background-color
          200: "#badfff",
          300: "#8accff",
          400: "#54adff",
          500: "#337be5", // Extracted --sc--progress-indicator--color
          600: "#0473ea", // Extracted --color-blue-primary
          700: "#005bc1",
          800: "#004d9c",
          900: "#004085",
        },
        scgreen: {
          50:  "#ebfae5", // --color-green-lightest
          100: "#cdf4bf", // --color-green-lighter
          200: "#d7f6cc", // --color-green-lighter-2
          300: "#9be880", // --color-green-bright
          400: "#92e773", // --color-green-light
          500: "#38d200", // --color-green-primary
          600: "#238500", // --color-green-dark
          700: "#1b6600", // --color-green-darker
          800: "#0b2900", // --color-green-darkest
          900: "#061700",
        },
        scindigo: {
          900: "#020b43", // --color-indigo-primary
        }
      },
      animation: {
        "fade-in":    "fadeIn 0.4s ease-out",
        "slide-in":   "slideIn 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: 0, transform: "translateY(8px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        slideIn: { "0%": { opacity: 0, transform: "translateX(-12px)" }, "100%": { opacity: 1, transform: "translateX(0)" } },
      },
    },
  },
  plugins: [import("@tailwindcss/forms")],
};
