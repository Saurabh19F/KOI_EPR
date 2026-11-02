/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
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
        sidebar: {
          DEFAULT: '#0d211d',
          hover: '#17352f',
          active: '#213f37',
        },
        accent: {
          blue: '#0E7490',
          purple: '#7C3AED',
          orange: '#C05621',
          pink: '#BE185D',
          bronze: '#9a6b36',
        },
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
        'card': '0 1px 3px 0 rgb(15 23 42 / 0.04), 0 8px 20px -12px rgb(15 23 42 / 0.15)',
        'card-hover': '0 4px 12px -2px rgb(15 23 42 / 0.08), 0 20px 36px -16px rgb(15 23 42 / 0.2)',
        'sidebar': '4px 0 24px -8px rgba(13, 33, 29, 0.4)',
        'glow': '0 0 20px -5px rgba(15, 47, 41, 0.15)',
        'glow-accent': '0 0 24px -4px rgba(154, 107, 54, 0.2)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.06)',
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
        'gradient-primary': 'linear-gradient(135deg, #0f2f29 0%, #173f37 100%)',
        'gradient-accent': 'linear-gradient(135deg, #9a6b36 0%, #7a4f24 100%)',
        'gradient-surface': 'linear-gradient(180deg, #fbfaf6 0%, #f6f3ec 100%)',
      },
    },
  },
  plugins: [],
};
