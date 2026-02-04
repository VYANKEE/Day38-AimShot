/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      cursor: {
        'crosshair': 'crosshair',
      },
      colors: {
        cyan: {
          400: '#00f3ff',
          500: '#00d0db',
          600: '#00aeb8',
        },
      },
      animation: {
        'spin-slow': 'spin 10s linear infinite',
      },
    },
  },
  plugins: [],
}