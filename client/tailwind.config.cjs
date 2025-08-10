/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",              // root HTML file in client/
    "./src/**/*.{js,ts,jsx,tsx}" // all components, pages, etc. in src/
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1e40af", // Your original primary color
        secondary: {
          50: '#f0fdfa',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
      },
    },
  },
  plugins: [],
};