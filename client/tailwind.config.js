/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#2F4156',
          dark: '#223040',
          hover: '#223040',
          light: '#3C526D',
          50: '#F4F7F9',
          100: '#E8EDF1',
          900: '#1E2B3A',
        },
        teal: {
          DEFAULT: '#567C8D',
          dark: '#456473',
          hover: '#456473',
          light: '#7195A5',
          50: '#F1F5F7',
          100: '#E2EBEF',
        },
        sky: {
          DEFAULT: '#C8D9E6',
          dark: '#B1C7D7',
          light: '#EBF2F7',
          50: '#F5F8FA',
        },
        beige: {
          DEFAULT: '#F5EFE8',
          dark: '#E8DEC3',
          light: '#FAF7F4',
          50: '#FCFAF7',
        },
        brand: {
          50: '#F4F7F9',
          100: '#E8EDF1',
          500: '#567C8D',
          600: '#2F4156',
          700: '#223040',
          900: '#1E2B3A',
        },
      },
    },
  },
  plugins: [],
}

