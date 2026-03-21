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
          blue: '#0F172A', // Finivis Navy
          red: '#FF3B30', // iOS System Red
          dark: '#1d1d1f', // Apple Typography Black
          light: '#f5f5f7', // Apple Background Light Gray
          border: '#e5e5ea' // Apple subtle border
        }
      },
      fontFamily: {
        sans: [
          '-apple-system', 
          'BlinkMacSystemFont', 
          '"SF Pro Text"',
          '"Segoe UI"', 
          'Roboto', 
          '"Helvetica Neue"', 
          'Arial', 
          'sans-serif'
        ],
      },
      boxShadow: {
        'apple': '0 4px 24px -6px rgba(0, 0, 0, 0.04)',
        'apple-focus': '0 0 0 4px rgba(15, 23, 42, 0.15)',
      }
    },
  },
  plugins: [],
}
