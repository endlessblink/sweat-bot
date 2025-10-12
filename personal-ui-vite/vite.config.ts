import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: parseInt(process.env.PORT || '8005'),
    host: '0.0.0.0', // Listen on all interfaces including 127.0.0.1
    strictPort: false,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'sweat-bot.com',
      'api.sweat-bot.com',
      '.sweat-bot.com' // Allow all subdomains
    ],
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    // Proxy API requests to backend
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      },
      '/exercises': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
        changeOrigin: true
      }
    }
  }
})
