/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
            DEFAULT: '#1a1a1a', // Dark
            light: '#ffffff',   // Light
        },
        accent: {
            gold: '#d4af37',
            rose: '#b76e79',
        },
        gray: {
            light: '#f5f5f5',
            medium: '#e0e0e0',
            dark: '#666666',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}