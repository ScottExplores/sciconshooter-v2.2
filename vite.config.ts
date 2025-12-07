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
    port: 3000
  }
});