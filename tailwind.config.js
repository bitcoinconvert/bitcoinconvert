/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './*.html'],
  darkMode: 'class', // Hakikisha dark mode inatumia class-based approach
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0f172a', // Nyeusi kama grok.com
      },
    },
  },
  plugins: [],
};