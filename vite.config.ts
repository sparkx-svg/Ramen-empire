import { defineConfig } from 'vite';
import { resolve } from 'path';

// Production build for GitHub Pages (https://sparkx-svg.github.io/Ramen-empire/)
// Assets are emitted relative so the site works under a sub-path.
export default defineConfig({
  base: './',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  server: {
    port: 5173,
    open: false,
  },
});
