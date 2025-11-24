/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          50: '#f6f8fb',
          100: '#e9edf5',
          200: '#cfd8e7',
          300: '#a8b6cf',
          400: '#7c90b2',
          500: '#5d7398',
          600: '#4b5d7b',
          700: '#3f4d65',
          800: '#384253',
          900: '#313847',
          950: '#1e2230',
        },
        accent: {
          50: '#fef6e7',
          100: '#fde8c2',
          200: '#fbd288',
          300: '#f9b34a',
          400: '#f59723',
          500: '#e77b12',
          600: '#c75d0d',
          700: '#a04810',
          800: '#823b13',
          900: '#6b3214',
          950: '#3d1908',
        },
      },
    },
  },
  plugins: [],
}
