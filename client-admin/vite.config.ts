import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  envDir: '../',
  plugins: [react()],
  server: {
    port: 3002,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || process.env.API_URL || 'http://localhost:5005',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: process.env.VITE_API_URL || process.env.API_URL || 'http://localhost:5005',
        ws: true,
      },
    },
  },
});
