import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // When deploying on GitHub Pages under https://<user>.github.io/EyesTrend
  base: '/EyesTrend/',
  define: {
    // Shims the process.env.API_KEY for the browser during build time
    'process.env.API_KEY': JSON.stringify(process.env.VITE_API_KEY || ''),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false
  }
});