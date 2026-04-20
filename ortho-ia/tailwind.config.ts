import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette principale — vert médical professionnel
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        // Accents chaleureux — pour les touches humaines (ambre pour patients, terracotta pour alerte)
        warm: {
          50:  '#fef7ed',
          100: '#fdecd3',
          200: '#fcd9a8',
          300: '#f9bf73',
          400: '#f5a142',
          500: '#f08c1f',
          600: '#de7012',
          700: '#b85410',
          800: '#934215',
          900: '#773816',
        },
        // Sévérité clinique (cohérent avec SEUILS palette)
        severite: {
          normal: '#81C784',
          limite: '#FFEE58',
          fragile: '#FFB74D',
          deficit: '#E57373',
          patho:   '#C62828',
        },
        ortho: {
          green: '#22c55e',
          dark: '#1a1a2e',
          light: '#f8fafc',
          accent: '#10b981',
        },
        // Surfaces (light/dark unified tokens)
        surface: {
          light: '#ffffff',
          subtle: '#f8fafc',
          muted:  '#f1f5f9',
          dark:   '#0f172a',
          'dark-subtle': '#1e293b',
          'dark-muted':  '#334155',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Hiérarchie claire pour écran
        'xs':   ['0.75rem',  { lineHeight: '1rem' }],
        'sm':   ['0.875rem', { lineHeight: '1.375rem' }],
        'base': ['1rem',     { lineHeight: '1.625rem' }],
        'lg':   ['1.125rem', { lineHeight: '1.75rem' }],
        'xl':   ['1.25rem',  { lineHeight: '1.875rem' }],
        '2xl':  ['1.5rem',   { lineHeight: '2rem' }],
        '3xl':  ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.01em' }],
        '4xl':  ['2.25rem',  { lineHeight: '2.5rem',  letterSpacing: '-0.02em' }],
        '5xl':  ['3rem',     { lineHeight: '3.25rem', letterSpacing: '-0.03em' }],
      },
      boxShadow: {
        // Ombres cohérentes, plus douces que defaults
        'card':       '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'card-lg':    '0 10px 24px -4px rgb(0 0 0 / 0.10), 0 4px 8px -4px rgb(0 0 0 / 0.05)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'check-bounce': 'checkBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        checkBounce: {
          '0%':   { transform: 'scale(0)', opacity: '0' },
          '60%':  { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
export default config
