import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// En desarrollo, Vite reenvía al backend las rutas de la API.
// Así el navegador ve un único origen (localhost:5173): sin CORS y con cookies SameSite=Strict.
const proxy = { '/api': 'http://localhost:8080' }

/**
 * Vista previa al compartir un enlace (WhatsApp, Telegram, iMessage…): etiquetas Open Graph.
 * Esos programas no ejecutan JavaScript, leen el HTML tal cual; por eso van en index.html y no
 * en React. La imagen necesita una URL absoluta: PUBLIC_URL (Docker, ver docker-compose.prod.yml)
 * o, en Vercel, su variable con el dominio de producción. Sin ninguna, queda relativa.
 */
const publicUrl =
  process.env.PUBLIC_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '')

const PREVIEWS = {
  home: {
    title: '¿Qué falta? · Lo que falta en casa, a un toque',
    description: 'Listas de la compra compartidas en tiempo real: apunta lo que falta y mira en directo lo que ya está en el carro.',
  },
  invite: {
    title: 'Te han invitado a una lista de la compra',
    description: 'Únete en ¿Qué falta? para apuntar lo que falta en casa y ver en directo lo que ya está en el carro.',
  },
}

function openGraph({ title, description }: { title: string; description: string }): string {
  return [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="¿Qué falta?" />`,
    `<meta property="og:locale" content="es_ES" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:image" content="${publicUrl}/og-image.jpg" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="¿Qué falta?: lo que falta en casa, a un toque" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join('\n    ')
}

/**
 * Pone las etiquetas en index.html y, al compilar, crea unirse.html: la misma app con la vista
 * previa de invitación. El servidor la sirve para /unirse/:código (vercel.json y Caddyfile).
 */
function sharePreview(): Plugin {
  let outDir = 'dist'
  return {
    name: 'share-preview',
    configResolved: (config) => {
      outDir = config.build.outDir
    },
    transformIndexHtml: (html) => html.replace('<!-- open-graph -->', openGraph(PREVIEWS.home)),
    writeBundle() {
      const index = readFileSync(join(outDir, 'index.html'), 'utf8')
      writeFileSync(join(outDir, 'unirse.html'), index.replace(openGraph(PREVIEWS.home), openGraph(PREVIEWS.invite)))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // "@/components/..." en vez de rutas relativas largas (lo usan también los componentes de shadcn/ui)
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [
    react(),
    tailwindcss(),
    sharePreview(),
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
        // Router pinta la página. EXCEPTO /api, que siempre debe llegar al backend.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        // La API NO se guarda en caché a propósito: son datos privados (en un móvil compartido
        // otro usuario podría verlos) y deben estar al día. Sin red, la app abre y avisa.
      },
    }),
  ],
  server: { proxy },
  // "npm run preview" sirve la build de producción (con service worker) y también necesita el proxy
  preview: { proxy },
})
