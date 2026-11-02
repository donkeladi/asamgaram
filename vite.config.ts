import { defineConfig } from 'vite';

// base './' supaya boleh dihoskan di sub-laluan GitHub Pages (username.github.io/repo/)
export default defineConfig({
  base: './',
  build: { target: 'es2020', chunkSizeWarningLimit: 900 },
});
