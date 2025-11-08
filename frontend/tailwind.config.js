/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#123450',     // Azul escuro principal
        accent: '#F9A60C',      // Dourado de destaque
        highlight: '#FC6E22',   // Laranja vibrante
        neutral: '#FFFFFF',     // Branco base
        background: {
          light: '#FFFFFF',
          subtle: '#FFF8E7',    // leve tom amarelado (opcional pra fundos suaves)
        },
      },
      boxShadow: {
        glow: '0 0 15px rgba(249, 166, 12, 0.5)',  // brilho dourado suave
      },
      animation: {
        'pulse-smooth': 'pulse-smooth 2s infinite',
      },
      keyframes: {
        'pulse-smooth': {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 5px rgba(249, 166, 12, 0.6), 0 0 10px rgba(252, 110, 34, 0.4)',
          },
          '50%': {
            opacity: '0.9',
            boxShadow: '0 0 15px rgba(249, 166, 12, 0.9), 0 0 25px rgba(252, 110, 34, 0.6)',
          },
        },
      },
    },
  },
  plugins: [],
};
