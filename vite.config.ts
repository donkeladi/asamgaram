import { defineConfig } from 'vite';

// Kod sumber di src/. Hasil bina ditulis ke akar repo supaya GitHub Pages
// (mod "Deploy from a branch", folder "/ (root)") terus menyajikan game siap-bina.
export default defineConfig({
  root: 'src',
  publicDir: '../public',
  base: './',
  build: { outDir: '..', emptyOutDir: false, target: 'es2020', chunkSizeWarningLimit: 900 },
});
