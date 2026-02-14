/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["var(--font-inter)"],
        "space-grotesk": ["var(--font-space-grotesk)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        primary: "#08677A",
        accent: "#F9A825",
        frost: "#F1F4F9",
      },
    },
  },
  plugins: [],
};