/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0064AF',
        'main-black-100': '#000',
        'main-gray-75': '#333',
        'main-gray-50': '#999',
      },
      fontFamily: {
        sans: ['"Exo 2"'],
        mono: ['"Cascadia Code"'],
      },
    },
  },
  plugins: [],
};
