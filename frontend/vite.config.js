import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Dev server proxies /auth, /logs, /ingest to the backend so the frontend
// can call relative paths (no CORS/base-URL juggling in dev). In production
// (Docker Compose / SaaS), Nginx does the same job — see docker-compose.yml
// and docs/setup_saas.md (Phase 6).
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:3000',
      '/logs': 'http://localhost:3000',
      '/ingest': 'http://localhost:3000',
    },
  },
});
