/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        buy:  '#3B6D11',
        sell: '#A32D2D',
        neutral: '#888780',
      },
      fontFamily: {
        mono: ['DM Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
