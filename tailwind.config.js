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
        // Official Rush Brand Color Palette
        'legacy': '#006332',        // Primary green
        'growth': '#30AE6E',        
        'vitality': '#5FEEA2',      
        'sage': '#DFF9EB',          
        'gold': '#FFC60B',
        'sky-blue': '#54ADD3',
        'navy': '#005D83',
        'purple': '#2D1D4E',
        'violet': '#6C43B9',
        'blush': '#FFE3E0',
        'sand': '#F2DBB3',
        'rush-black': '#5F5858',
        'rush-gray': '#AFAEAF',
        
        // Legacy aliases for backward compatibility
        'legacy-green': '#006332',
        'growth-green': '#30AE6E',
        'vitality-green': '#5FEEA2',
        'cerulean-blue': '#54ADD3',
        'deep-blue': '#005D83',
        'rush-purple': '#2D1D4E',
        'raw-umber': '#5F5858',
        'wash-gray': '#AFAEAF',
        'wash-green': '#9AEFC2',
        'ivory': '#FFFBEC',
        'rose': '#FDE0DF',
        'rush-indigo': '#1E1869',
      },
      fontFamily: {
        'calibre': ['Montserrat', 'Source Sans 3', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'georgia': ['Georgia', 'Times New Roman', 'serif'],
        'sans': ['Montserrat', 'Source Sans 3', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        'serif': ['Georgia', 'Times New Roman', 'serif'],
      },
      fontWeight: {
        'normal': '400',    // Calibre Regular
        'medium': '500',
        'semibold': '600',  // Calibre Semibold
        'bold': '700',
      },
      fontSize: {
        // Responsive typography scale
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      animation: {
        'bounce': 'bounce 1s infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
