/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        finivis: {
          blue: '#1a56cc',
          red: '#ff3300',
          dark: '#4a4a4a',
          light: '#f9f9f9',
          border: '#e5e7eb'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
