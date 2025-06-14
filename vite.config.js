import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/bitcoinconvert/',
  plugins: [react()],
  server: {
    proxy: {
      '/api/blockcypher': {
        target: 'http://185.117.72.82:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/blockcypher/, '/api/blockcypher'),
      },
    },
  },
});
