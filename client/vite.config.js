import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const apiProxy = {
  target: 'http://localhost:8080',
  changeOrigin: true,
  bypass: (req) => {
    // If the browser requests an HTML page (like direct navigation or refresh), serve index.html
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      return '/index.html';
    }
  }
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/auth': apiProxy,
      '/me': apiProxy,
      '/families': apiProxy,
      '/family': apiProxy,
      '/schemes': apiProxy,
      '/applications': apiProxy,
      '/documents': apiProxy,
      '/queries': apiProxy,
      '/admin': apiProxy,
      '/uploads': apiProxy
    }
  }
});

