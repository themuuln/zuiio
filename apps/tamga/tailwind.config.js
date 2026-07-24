/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        border: "rgb(220, 222, 229)",
        input: "rgb(220, 222, 229)",
        ring: "rgb(71, 56, 242)",
        background: "rgb(251, 252, 254)",
        foreground: "rgb(4, 5, 12)",
        primary: {
          DEFAULT: "rgb(71, 56, 242)",
          foreground: "rgb(247, 248, 252)",
        },
        secondary: {
          DEFAULT: "rgb(241, 242, 245)",
          foreground: "rgb(4, 5, 12)",
        },
        destructive: {
          DEFAULT: "rgb(212, 2, 55)",
          foreground: "rgb(247, 248, 252)",
        },
        muted: {
          DEFAULT: "rgb(241, 242, 245)",
          foreground: "rgb(82, 85, 96)",
        },
        accent: {
          DEFAULT: "rgb(241, 242, 245)",
          foreground: "rgb(4, 5, 12)",
        },
        card: {
          DEFAULT: "rgb(255, 255, 255)",
          foreground: "rgb(4, 5, 12)",
        },
        tamga: {
          purple: "rgb(71, 56, 242)",
          "purple-light": "rgb(109, 122, 255)",
          gold: "rgb(230, 173, 0)",
          "gold-light": "rgb(252, 209, 118)",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "calc(0.75rem - 2px)",
        sm: "calc(0.75rem - 4px)",
      },
    },
  },
  plugins: [],
};
