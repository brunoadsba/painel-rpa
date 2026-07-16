/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#030A22',
          900: '#050F33',
          800: '#001858',
          700: '#0C2570',
          600: '#1B3486',
        },
        teal: {
          DEFAULT: '#3AA6A6',
          light: '#8FDCD6',
        },
      },
      fontFamily: {
        display: ['Archivo', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
