module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'trt': ['TRT', 'sans-serif'],
      },
      colors: {
        dark: {
          bg: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          text: '#f1f5f9',
          'text-secondary': '#94a3b8',
          primary: '#3b82f6',
          'primary-hover': '#2563eb',
        }
      }
    },
  },
  plugins: [],
} 