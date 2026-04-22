/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paytm: {
          blue: '#00BAF2',
          dark: '#002970',
          light: '#F5F7F9'
        }
      }
    },
  },
  plugins: [],
}
