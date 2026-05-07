/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
            DEFAULT: '#121212', // Charcoal
            light: '#ffffff',   // White
            dark: '#0a0a0a',    // Almost Black
        },
        accent: {
            gold: '#d4af37',
            rose: '#b76e79',
        },
        gray: {
            light: '#f5f5f5',
            medium: '#e0e0e0',
            dark: '#666666',
            charcoal: '#1e1e1e', // Lighter charcoal for cards
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