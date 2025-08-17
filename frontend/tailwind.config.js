/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Tailwind 3.4.17 custom colors for Store Rating Platform theme
      colors: {
        'theme-purple': '#6B46C1',     // Primary purple for headers
        'theme-blue': '#3B82F6',       // Blue for links and accents
        'theme-orange': '#F97316',     // Orange for buttons and CTAs
        'theme-white': '#FFFFFF',      // White for cards and backgrounds
        'theme-gray': {
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          800: '#1F2937',
        }
      },
    },
  },
  plugins: [],
}