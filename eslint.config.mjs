import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import { globalIgnores } from 'eslint/config';

const staticDemoConfig = {
  files: ['app.js', 'auth.js'],
  rules: { '@next/next/no-location-assign-relative-destination': 'off' },
};

const eslintConfig = [...nextVitals, ...nextTypescript, staticDemoConfig, globalIgnores(['legacy-prototype/**'])];

export default eslintConfig;
