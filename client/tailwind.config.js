export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        captain: {
          black: "#0A0A0A",
          charcoal: "#111111",
          surface: "#1A1A1A",
          card: "#161616",
          gold: "#C9A84C",
          bright: "#E8C96A",
          muted: "#9A7A2E",
          white: "#FAFAFA",
          border: "#222222"
        },
        gold: {
          DEFAULT: "#C9A84C",
          light: "#E8C96A",
          dark: "#9A7A2E",
          muted: "rgba(201,168,76,0.15)"
        },
        black: {
          DEFAULT: "#0A0A0A",
          soft: "#111111",
          card: "#161616",
          border: "#222222"
        }
      },
      fontFamily: {
        display: ["Bebas Neue", "sans-serif"],
        bebas: ["Bebas Neue", "sans-serif"],
        garamond: ["Cormorant Garamond", "serif"],
        serif: ["Playfair Display", "serif"],
        sans: ["DM Sans", "sans-serif"],
        script: ["Dancing Script", "cursive"],
        mono: ["JetBrains Mono", "monospace"],
        nav: ["Montserrat", "sans-serif"]
      },
      boxShadow: {
        gold: "0 0 20px rgba(201, 168, 76, 0.16)",
        "gold-strong": "0 0 32px rgba(201, 168, 76, 0.28)"
      },
      backgroundImage: {
        "gold-line": "linear-gradient(90deg, transparent, #D4AF37, transparent)",
        shimmer: "linear-gradient(110deg, #D4AF37 0%, #FFD700 35%, #D4AF37 70%, #B8960C 100%)"
      }
    }
  },
  plugins: []
};
