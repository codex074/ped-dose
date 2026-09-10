import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FFFDF8',
        sky: { DEFAULT: '#7EC8E3', soft: '#E3F4FA', deep: '#3FA7CB' },
        mint: { DEFAULT: '#A8E6CF', soft: '#EAF9F2' },
        peach: { DEFAULT: '#FFD3B6', soft: '#FFF0E6' },
        butter: { DEFAULT: '#FFF3B0' },
        lavender: { DEFAULT: '#CDB4DB', soft: '#F3ECF7' },
        blush: { DEFAULT: '#FFC8DD' },
        ink: { DEFAULT: '#334155', muted: '#64748B' },
        line: '#E5E7EB',
        status: {
          safe: '#34D399', safeSoft: '#D1FAE5',
          caution: '#FBBF24', cautionSoft: '#FEF3C7', cautionText: '#92400E',
          danger: '#F87171', dangerSoft: '#FEE2E2', dangerText: '#991B1B',
          info: '#60A5FA', infoSoft: '#DBEAFE', infoText: '#1E40AF',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Thai"', 'Inter', 'system-ui', 'sans-serif'],
        num: ['Inter', '"IBM Plex Sans Thai"', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl: '1rem', '2xl': '1.5rem', '3xl': '2rem' },
      boxShadow: {
        soft: '0 4px 16px rgba(51, 65, 85, 0.06)',
        lift: '0 10px 28px rgba(51, 65, 85, 0.10)',
      },
      transitionDuration: { fast: '120ms', normal: '200ms', slow: '320ms' },
      keyframes: {
        'fade-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'soft-pulse': { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
      animation: { 'fade-up': 'fade-up 320ms ease-out both', 'soft-pulse': 'soft-pulse 1.4s ease-in-out infinite' },
    },
  },
  plugins: [],
} satisfies Config;
