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
  server: {
    proxy: {
      '/api': {
        target: 'https://talkora-backend-v1-1.vercel.app',
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
