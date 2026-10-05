import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Shown on the profile screen as "เวอร์ชัน x.y.z".
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  server: {
    port: 5173,
    // Same-origin /api in dev, matching Caddy's routing in production.
    proxy: { '/api': 'http://localhost:4000' },
  },
  test: { environment: 'node', include: ['src/**/*.test.js'] },
});
