import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Bundle ALL component CSS into one file loaded upfront, instead of a
    // per-route CSS chunk that arrives a beat after the page renders. Kills the
    // flash-of-unstyled-content when first navigating to a page.
    cssCodeSplit: false,
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      // App shell only — no offline data caching (Vendorya is online-first).
      // This just makes the app installable (Install button in Chrome/Edge).
      includeAssets: ['favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Vendorya',
        short_name: 'Vendorya',
        description: 'Vendorya — multi-tenant retail & ERP platform.',
        theme_color: '#f78f1e',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the built shell; navigations fall back to index.html (SPA).
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        // Never let the SW intercept API or Django admin routes.
        navigateFallbackDenylist: [/^\/api/, /^\/django-admin/, /^\/static/, /^\/media/],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
