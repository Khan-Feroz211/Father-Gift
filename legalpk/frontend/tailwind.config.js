/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0D1B2A',
          50: '#E8EDF2',
          100: '#C5D0DB',
          200: '#9EAFBE',
          300: '#778EA1',
          400: '#567289',
          500: '#3A5671',
          600: '#2A3F55',
          700: '#1B2E44',
          800: '#0D1B2A',
          900: '#06101A',
        },
        gold: {
          DEFAULT: '#B8860B',
          50: '#FDF8E7',
          100: '#F9EDBB',
          200: '#F5E090',
          300: '#F0D264',
          400: '#E8C238',
          500: '#D4A90B',
          600: '#B8860B',
          700: '#8F6709',
          800: '#664A07',
          900: '#3D2C04',
          light: '#F5E6A3',
        },
        cream: {
          DEFAULT: '#FAF8F2',
          100: '#FAF8F2',
          200: '#F2EFE4',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'navy-gradient': 'linear-gradient(135deg, #0D1B2A 0%, #1B2E44 100%)',
      },
    },
  },
  plugins: [],
}
