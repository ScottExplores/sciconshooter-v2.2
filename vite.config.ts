import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: 'public', // Ensures public/ folder is served at root
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api/researchhub-proposals': {
        target: 'https://backend.prod.researchhub.com',
        changeOrigin: true,
        secure: false,
        rewrite: () => '/api/funding_feed/?fundraise_status=OPEN&ordering=best&page_size=5&content_type=PREREGISTRATION'
      }
    }
  }
});
