/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'orbis-bg': 'rgb(var(--orbis-bg) / <alpha-value>)',
        'orbis-surface': 'rgb(var(--orbis-surface) / <alpha-value>)',
        'orbis-primary': 'rgb(var(--orbis-primary) / <alpha-value>)',
        'orbis-accent': 'rgb(var(--orbis-accent) / <alpha-value>)',
        'orbis-text': 'rgb(var(--orbis-text) / <alpha-value>)',
        'orbis-text-muted': 'rgb(var(--orbis-text-muted) / <alpha-value>)',
      },
      backgroundImage: {
        'radial-gradient-dark': 'radial-gradient(circle at 50% 0%, #111424 0%, #0B0B0F 100%)',
      }
    },
  },
  plugins: [],
}
