import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import process from 'node:process'

// Serve the admin (admin.html) at /admin in dev, like nginx does in production.
const adminRoute = {
  name: 'admin-route',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/admin' || req.url === '/admin/') req.url = '/admin.html'
      next()
    })
  },
}

const api = { target: process.env.API_URL || 'http://localhost:3001', changeOrigin: true, secure: false }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), adminRoute],
  server: {
    proxy: {
      '/api': api,
      '/uploads': api,
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        admin: fileURLToPath(new URL('./admin.html', import.meta.url)),
      },
    },
  },
})
