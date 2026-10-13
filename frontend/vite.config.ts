import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// En desarrollo, Vite reenvía al backend las rutas de la API y del login con Google.
// Así el navegador ve un único origen (localhost:5173): sin CORS y con cookies SameSite=Strict.
const backend = 'http://localhost:8080'
const proxy = {
  '/api': backend,
  '/oauth2': backend,
  '/login/oauth2': backend,
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt': cuando hay una versión nueva, se pregunta al usuario (UpdatePrompt) en vez de
      // recargar la página por sorpresa mientras está marcando productos
      registerType: 'prompt',
      includeManifestIcons: false, // ya entran en la caché por globPatterns (evita duplicados)
      manifest: {
        name: 'Lista de la compra',
        short_name: 'Compra',
        description: 'Listas de la compra compartidas y en tiempo real',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone', // se abre como una app, sin la barra del navegador
        background_color: '#f6f7f5',
        theme_color: '#1a7f4b',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Se guardan en caché los archivos de la app (el "app shell"): abre al instante y sin red
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        cleanupOutdatedCaches: true,
        // Al navegar a cualquier ruta (/listas/123…), el service worker sirve index.html y React
        // Router pinta la página. EXCEPTO estas rutas, que deben llegar al backend: si no, el login
        // con Google (que es una navegación a /oauth2/... y vuelta a /login/oauth2/...) se rompería.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/oauth2\//, /^\/login\/oauth2\//],
        // La API NO se guarda en caché a propósito: son datos privados (en un móvil compartido
        // otro usuario podría verlos) y deben estar al día. Sin red, la app abre y avisa.
      },
    }),
  ],
  server: { proxy },
  // "npm run preview" sirve la build de producción (con service worker) y también necesita el proxy
  preview: { proxy },
})
