import { defineConfig } from 'vite';

// base './' keeps asset URLs relative so the built site works from any host
// (GitHub Pages project sites, Netlify, a plain static server, file preview…).
export default defineConfig({
  base: './',
  build: { outDir: 'dist', assetsInlineLimit: 0 },
  worker: { format: 'es' },
});
