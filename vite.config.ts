import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    laravel({
      input: ['resources/css/app.css', 'resources/js/main.ts'],
      refresh: true,
    }),
    vue(),
    vueJsx(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': '/resources/js',
    },
  },
});
