import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// DE-T, el asistente del caso, responde en /api/chat desde su propio servidor (dete/server.mjs, puerto
// 8000 por defecto). En desarrollo, Vite le pasa esas peticiones; si no está encendido, la página
// funciona igual y simplemente no muestra a DE-T.
const dete = { '/api': { target: `http://127.0.0.1:${process.env.DETE_PORT || 8000}`, changeOrigin: false } };

// base './' → el sitio funciona en cualquier subcarpeta (GitHub Pages, etc.)
export default defineConfig({
  base: './',
  plugins: [svelte()],
  server: { host: '127.0.0.1', port: 5173, strictPort: true, proxy: dete },
  preview: { proxy: dete },
  build: { target: 'es2022', sourcemap: false }
});
