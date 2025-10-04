/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'hebrew': ['"Segoe UI"', '"Arial Unicode MS"', '"Noto Sans Hebrew"', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}