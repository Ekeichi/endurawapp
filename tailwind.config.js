/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0A',
        surface: '#141414',
        surface2: '#1A1A1A',
        accent: '#F97316',
        'accent-dark': '#EA580C',
        secondary: '#6B7280',
        success: '#22C55E',
        warning: '#EAB308',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}
