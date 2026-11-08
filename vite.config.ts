import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // In dev, "/api" is proxied to the API so there is no CORS to configure.
  const target = env.VITE_DEV_API_TARGET || 'http://127.0.0.1:8000';
  return {
    plugins: [react()],
    server: { port: 5173, proxy: { '/api': { target, changeOrigin: true } } },
    preview: { port: 4173, proxy: { '/api': { target, changeOrigin: true } } },
    build: { sourcemap: false, chunkSizeWarningLimit: 700 },
  };
});
