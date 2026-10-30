/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: { 50: '#fcfaf5', 100: '#f8f4ea', 200: '#efe9d8', 300: '#e4dcc4' },
        sage: { 50: '#eff1e6', 100: '#e2e6d2', 200: '#d4dabf', 300: '#bcc5a0', 400: '#a2ae80' },
        olive: { 500: '#6d7c5b', 600: '#5b6a4a', 700: '#4b5841', 800: '#3e4936', 900: '#2e3728' },
        gold: { 200: '#eae0c6', 300: '#ddd0aa', 400: '#cbb98a', 500: '#b49d63' },
        ink: '#2a2a24',
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 12px 32px -16px rgba(62, 73, 54, 0.35)',
        nav: '0 8px 30px -12px rgba(62, 73, 54, 0.3)',
      },
    },
  },
  plugins: [],
};
