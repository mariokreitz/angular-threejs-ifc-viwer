import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        surface: {
          base: '#0b0d0f',
          panel: '#111316',
          raised: '#181b1f',
          overlay: '#1e2228',
        },
        accent: {
          primary: '#00c8ff',
          secondary: '#ff6b35',
          danger: '#ff4757',
        },
        ifc: {
          text: '#e8eaed',
          muted: '#8b919a',
          subtle: '#4a5260',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderColor: {
        subtle: 'rgba(255,255,255,0.07)',
        strong: 'rgba(255,255,255,0.13)',
      },
      transitionTimingFunction: {
        'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        120: '120ms',
      },
    },
  },
};

export default config;
