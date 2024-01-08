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
        secondary: '#0099ff',
        tertiary: '#49c2f1',
        'main-black-100': '#000',
        'main-gray-75': '#333',
        'main-gray-50': '#999',
        'main-gray-10': '#f8f8f8',
        error: '#ff5100',
        warn: '#ffc300',
      },
      fontFamily: {
        sans: ['"Exo 2"', 'sans-serif'],
        mono: ['"Cascadia Code"'],
      },
    },
  },
  plugins: [],
};
