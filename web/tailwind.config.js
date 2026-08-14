/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0D0D0D',
          surface: '#161616',
          elevated: '#1E1E1E',
          border: '#2A2A2A',
          active: '#3D3D3D',
        },
        paper: {
          DEFAULT: '#F5F3EF',
          surface: '#FFFFFF',
          elevated: '#FAFAF8',
          border: '#E5E2DC',
        },
        text: {
          primary: '#F0EDE8',
          secondary: '#8A8680',
          tertiary: '#5A5754',
        },
        brass: {
          DEFAULT: '#C8A97E',
          dark: '#8B6B3D',
        },
        success: '#4CAF7D',
        danger: '#E05A5A',
        warning: '#D4944A',
        info: '#5A8FBF',
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      opacity: {
        12: '0.12',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
    },
  },
  plugins: [],
};