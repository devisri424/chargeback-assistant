/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0E151D',
        surface: '#141D28',
        raised: '#1B2733',
        border: '#28374A',
        ink: '#E7EDF3',
        muted: '#8A98A9',
        accent: '#37D6C4',
        'accent-dim': '#1F6E64',
        low: '#3FCB82',
        medium: '#F0B23D',
        high: '#F0616F',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
}
