import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'vc-purple': '#2B0A4A',
        'vc-magenta': '#C2185B',
        'vc-pink': '#FF2E93',
        'vc-orange': '#FF7A3D',
        'vc-gold': '#FFC857',
        'vc-teal': '#00E5D4',
        'vc-dark': '#0B0620',
      },
      fontFamily: {
        display: ['Bungee', 'cursive'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'neon-pink': '0 0 10px #FF2E93, 0 0 30px #FF2E93, 0 0 60px #FF2E9388',
        'neon-teal': '0 0 10px #00E5D4, 0 0 30px #00E5D4, 0 0 60px #00E5D488',
        'neon-orange': '0 0 10px #FF7A3D, 0 0 30px #FF7A3D, 0 0 60px #FF7A3D88',
        'neon-gold': '0 0 10px #FFC857, 0 0 30px #FFC857, 0 0 60px #FFC85788',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px #FF2E93, 0 0 30px #FF2E93' },
          '50%': { boxShadow: '0 0 20px #FF2E93, 0 0 60px #FF2E93, 0 0 100px #FF2E9366' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'neon-flicker': {
          '0%, 100%': { opacity: '1' },
          '33%': { opacity: '0.9' },
          '66%': { opacity: '0.95' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'neon-flicker': 'neon-flicker 4s ease-in-out infinite',
        'slide-up': 'slide-up 0.4s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
      },
      backgroundSize: {
        '300%': '300%',
      },
    },
  },
  plugins: [],
};

export default config;
