/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Palette
        'vitality-green': '#5FEEA2',
        'growth-green': '#00A66C',
        'legacy-green': '#006332',
        'rush-black': '#0C0C0C',
        
        // Secondary Palette
        'rush-green': '#00A66C',
        'wash-green': '#9AEFC2',
        'rush-gray': '#EAEAEA',
        'wash-gray': '#A59F9F',
        'raw-umber': '#5F5858',
        
        // Tertiary/Accent Colors
        'sage': '#DFF9EB',
        'ivory': '#FFFBEC',
        'rose': '#FDE0DF',
        'cerulean-blue': '#54ADD3',
        'deep-blue': '#00668E',
        'rush-purple': '#694FA0',
        'rush-indigo': '#1E1869',
      },
      fontFamily: {
        'calibre': ['Calibre', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontWeight: {
        'normal': '400', // Calibre Regular
        'medium': '500',
        'semibold': '600', // Calibre Semibold
        'bold': '700',
      },
      animation: {
        bounce: 'bounce 1s infinite',
      },
    },
  },
  plugins: [],
}