import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import daisyui from "daisyui";

export default defineConfig({
  plugins: [react(), tailwindcss(), daisyui],
  daisyui: {
    themes: [
      "light", "dark",
    ]
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react', 'react-hot-toast'],
          state: ['zustand']
        }
      }
    },
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2015'
  },
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'https://talkora-private-chat.up.railway.app',
        changeOrigin: true,
        secure: true,
        timeout: 20000, // 20 seconds timeout for proxy
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🚀 Proxying request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('✅ Proxy response:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err, req, res) => {
            console.error('❌ Proxy error:', err.message);
          });
        },
      }
    }
  }
});
