import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: { center: true, padding: "1rem" },
    extend: {
      colors: {
        brand: {
          50:  "#FFF6ED",
          100: "#FFEAD5",
          200: "#FDDCAB",
          300: "#FBCB7A",
          400: "#FFA64E",
          500: "#FF7A18", // primario
          600: "#FF8C32",
          700: "#FF9D4B",
          800: "#FFAE64",
          900: "#FFC07E",
          DEFAULT: "#FF7A18",
        },
        surface: {
          DEFAULT: "#0b0b0c",
          soft: "#111214",
          ring: "rgba(255,122,24,0.35)",
        },
        border: {
          subtle: "rgba(255,255,255,0.08)",
        },
        foreground: {
          DEFAULT: "#FFFFFF",
          muted: "rgba(255,255,255,0.75)",
          dim: "rgba(255,255,255,0.6)",
        },
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.04), 0 6px 30px rgba(0,0,0,0.18)",
      },
      // ✅ sin callbacks (evita el error de TS)
      ringColor: {
        DEFAULT: "#FF7A18", // era theme("colors.brand.500")
      },
      ringOffsetColor: {
        DEFAULT: "#111214", // era theme("colors.surface.soft")
      },
      fontSize: {
        display: ["2.25rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
      },
    },
  },
  plugins: [],
};

export default config;
