import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: path.resolve(__dirname, 'postcss.config.cjs'),
  },
  server: {
    port: 5173, // ✅ Lock the port so Netlify Dev can always proxy correctly
  },
});
