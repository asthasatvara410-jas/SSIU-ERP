/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0F2C59',
          'navy-dark': '#071325',
          'navy-medium': '#183B70',
          'navy-light': '#0097D7',
          'navy-subtle': '#EBF5FA',
          gold: '#F5A623',
          'gold-hover': '#E09212',
          'gold-subtle': '#FFF8EB',
          orange: '#F37023',
          'orange-hover': '#E05D10',
          'orange-light': '#FFF3EC',
        }
      }
    },
  },
  plugins: [],
}
