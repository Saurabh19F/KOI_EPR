const colors = require('tailwindcss/colors');
const shades = { ...colors.blue, 900: '#182652', 950: '#101b3a' };

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        white: '#fcfeff',
        plum: shades, primary: shades,
        muted: { DEFAULT: '#f1f5f9', foreground: '#506075' },
        sidebar: { DEFAULT: shades[950], hover: shades[800], active: shades[700] },
        accent: { blue: '#2563eb', purple: '#481f6b', orange: '#853d09', pink: '#cf0065', bronze: '#5f3e0d' },
        success: '#067461', warning: '#853d09', danger: '#b90f1c', info: '#154fa6',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.78rem', { lineHeight: '1.05rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['0.9375rem', { lineHeight: '1.4rem' }],
        lg: ['1rem', { lineHeight: '1.5rem' }],
        xl: ['1rem', { lineHeight: '1.5rem' }],
        '2xl': ['1.25rem', { lineHeight: '1.625rem' }],
        '3xl': ['1.5rem', { lineHeight: '1.875rem' }],
        '4xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '5xl': ['2.5rem', { lineHeight: '2.75rem' }],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(37, 99, 235, 0.04), 0 8px 20px -12px rgba(37, 99, 235, 0.15)',
        'card-hover': '0 4px 12px -2px rgba(37, 99, 235, 0.08), 0 20px 36px -16px rgba(37, 99, 235, 0.2)',
        'sidebar': '4px 0 24px -8px rgba(37, 99, 235, 0.4)',
        'glow': '0 0 20px -5px rgba(37, 99, 235, 0.15)',
        'glow-accent': '0 0 24px -4px rgba(37, 99, 235, 0.2)',
        'inner-glow': 'inset 0 1px 0 0 rgba(252, 254, 255, 0.06)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'fade-in-up': 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in-down': 'fadeInDown 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in': 'slideIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'gradient': 'gradientShift 6s ease infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #2563eb 0%, #2563eb 100%)',
        'gradient-accent': 'linear-gradient(135deg, #2563eb 0%, #2563eb 100%)',
        'gradient-surface': 'linear-gradient(180deg, #fcfeff 0%, #fcfeff 100%)',
      },
    },
  },
  plugins: [],
};
