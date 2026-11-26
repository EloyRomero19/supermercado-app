import { createAppleSplashScreens, defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Genera los iconos y las pantallas de inicio de la PWA a partir de public/favicon.svg:
//   npm run generate-pwa-assets
// El color es el de la pizarra (index.css): la app tiene un único tema, siempre oscuro.
const BRAND = '#26302c'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    // Fondo pizarra (no blanco) en los iconos que llevan margen: el "maskable" de Android, que el
    // sistema recorta en círculo o cuadrado, y el de iOS
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: BRAND } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: BRAND } },
    // Pantalla de inicio en iPhone mientras arranca la app instalada (Android la crea solo a partir
    // del manifiesto). Una imagen por tamaño de pantalla (sin versión clara/oscura: hay un solo tema).
    appleSplashScreens: createAppleSplashScreens(
      {
        padding: 0.35,
        resizeOptions: { background: BRAND, fit: 'contain' },
        linkMediaOptions: { log: true, addMediaScreen: true, xhtml: false },
        png: { compressionLevel: 9, quality: 70 },
      },
      [
        'iPhone SE 4.7"',
        'iPhone 13 mini',
        'iPhone XR',
        'iPhone 11 Pro Max',
        'iPhone 14',
        'iPhone 14 Plus',
        'iPhone 15 Pro',
        'iPhone 15 Pro Max',
        'iPhone 16 Pro',
        'iPhone 16 Pro Max',
        'iPhone 17 Pro',
        'iPhone 17 Pro Max',
        'iPhone Air',
      ],
    ),
  },
  images: ['public/favicon.svg'],
})
