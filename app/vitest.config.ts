import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

// El complemento de Svelte compila los módulos con runas (state.svelte.ts) que usan los textos.
export default defineConfig({
  plugins: [svelte()],
  test: { environment: 'node', include: ['src/lib/**/*.test.ts'] }
});
