import type { Config } from 'tailwindcss';

/**
 * Design direction A — "Podium" (approved default).
 * Deep RUN navy base + energetic coral/amber accents.
 * Direction B — "Trail Volt" — swap the `accent`/`volt` values below
 * (see rewards/docs/ARCHITECTURE.md § Design directions).
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0b1220', // deep navy — brand base from runstore.co.za
          soft: '#141d31',
          card: '#1a2540',
          line: '#27345a',
        },
        accent: {
          DEFAULT: '#ff5a3c', // podium coral — primary action / points
          soft: '#ff7a5c',
          glow: '#ffb4a2',
        },
        volt: '#ffd166', // amber — streaks, badges, celebration
        mint: '#3ddc97', // success / earned
        sky: '#5aa9ff', // informational
        paper: '#f7f8fb',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '1.25rem',
        pill: '999px',
      },
      boxShadow: {
        pop: '0 8px 30px rgba(255, 90, 60, 0.25)',
        card: '0 4px 24px rgba(0, 0, 0, 0.35)',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.95)', opacity: '0.8' },
          '70%': { transform: 'scale(1.15)', opacity: '0' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.2, 0.6, 0.4, 1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
