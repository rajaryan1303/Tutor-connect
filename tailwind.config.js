/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4f46e5',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        dark: {
          bg: '#111827',
          card: '#1f2937',
          border: '#374151',
          text: '#d1d5db',
          heading: '#f9fafb',
        },
        secondary: {
          DEFAULT: '#ff9900',
          50: '#ffe4c4',
          100: '#ffd7b5',
          200: '#ffb57d',
          300: '#ffa07a',
          400: '#ff8f00',
          500: '#ff9900',
          600: '#ff8c00',
          700: '#ff7f00',
          800: '#ff6f00',
          900: '#ff5c00',
        },
      },
    },
  },
  plugins: [],
}
