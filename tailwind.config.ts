import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        phoenix: {
          50: "#fff4ed",
          100: "#ffe5d4",
          200: "#ffc6a9",
          300: "#ff9d72",
          400: "#ff6a3a",
          500: "#ff4214",
          600: "#f02a0a",
          700: "#c71d0b",
          800: "#9d1911",
          900: "#7e1812",
          950: "#440807",
        },
      },
    },
  },
  plugins: [],
};

export default config;
