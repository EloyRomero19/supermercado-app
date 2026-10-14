import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
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
  // "@/components/..." en vez de rutas relativas largas (lo usan también los componentes de shadcn/ui)
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt': cuando hay una versión nueva, se pregunta al usuario (UpdatePrompt) en vez de
      // recargar la página por sorpresa mientras está marcando productos
      registerType: 'prompt',
      includeManifestIcons: false, // ya entran en la caché por globPatterns (evita duplicados)
      manifest: {
        name: '¿Qué falta? · Lo que falta en casa, a un toque',
        short_name: 'Qué falta', // nombre bajo el icono: corto para que no se corte
        description: '¿Qué falta? Listas de la compra compartidas en tiempo real y recetas que te dicen lo que te falta.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone', // se abre como una app, sin la barra del navegador
        // Colores del tema (index.css): fondo de la pantalla de inicio en Android y barra del sistema
        background_color: '#f8fbf8',
        theme_color: '#0a7e3a',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Se guardan en caché los archivos de la app (el "app shell"): abre al instante y sin red
        // De la tipografía, solo los alfabetos que usamos (el navegador descarga los demás si hicieran falta)
        globPatterns: ['**/*.{js,css,html,svg,png,ico}', '**/inter-latin-*.woff2'],
        // Las pantallas de inicio de iPhone no se precachean: cada dispositivo pide solo la suya
        globIgnores: ['**/apple-splash-*.png'],
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
