/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#f8fafc',
        surface: '#ffffff',
        navy: '#0f172a',
        cobalt: '#2563eb',
        emerald: '#10b981',
        ruby: '#ef4444',
        whisper: 'rgba(226, 232, 240, 0.8)',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        display: ['Geist Sans', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      borderRadius: {
        'premium': '1rem',
        'tactile': '0.75rem',
      },
      boxShadow: {
        'premium': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
      }
    },
  },
  plugins: [],
}
