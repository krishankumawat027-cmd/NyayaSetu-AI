import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: { extend: { colors: { navy: '#17233f', teal: '#118f84', paper: '#f8fafc' }, fontFamily: { sans: ['var(--font-jakarta)'], display: ['var(--font-serif)'] } } },
  plugins: [],
};
export default config;
