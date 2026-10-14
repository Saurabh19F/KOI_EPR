/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Primary - KOI ERP ink green
        primary: {
          50: '#eff8f4',
          100: '#d9eee6',
          200: '#b6ddcf',
          300: '#86c3ad',
          400: '#56a187',
          500: '#367f69',
          600: '#255f50',
          700: '#1d4b40',
          800: '#173f37',
          900: '#0f2f29',
        },
        // Sidebar Dark
        sidebar: {
          DEFAULT: '#0d211d',
          hover: '#17352f',
          active: '#213f37',
        },
        // Accent colors
        accent: {
          blue: '#0E7490',
          purple: '#7C3AED',
          orange: '#C05621',
          pink: '#BE185D',
          bronze: '#9a6b36',
        },
        // Status colors
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.625rem', { lineHeight: '0.875rem' }],
        sm: ['0.75rem', { lineHeight: '1.125rem' }],
        base: ['0.8125rem', { lineHeight: '1.25rem' }],
        lg: ['0.875rem', { lineHeight: '1.375rem' }],
        xl: ['1rem', { lineHeight: '1.5rem' }],
        '2xl': ['1.25rem', { lineHeight: '1.625rem' }],
        '3xl': ['1.5rem', { lineHeight: '1.875rem' }],
        '4xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '5xl': ['2.5rem', { lineHeight: '2.75rem' }],
      },
      boxShadow: {
        'card': '0 1px 2px 0 rgb(15 23 42 / 0.06), 0 12px 24px -18px rgb(15 23 42 / 0.22)',
        'card-hover': '0 2px 6px 0 rgb(15 23 42 / 0.08), 0 18px 32px -20px rgb(15 23 42 / 0.26)',
        'sidebar': '4px 0 18px -12px rgba(13, 33, 29, 0.55)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
