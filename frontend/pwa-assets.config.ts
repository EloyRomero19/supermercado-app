import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Genera los iconos de la PWA a partir de public/favicon.svg: npm run generate-pwa-assets
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    // Fondo verde (no blanco) en los iconos que llevan margen: el "maskable" de Android, que el
    // sistema recorta en círculo o cuadrado, y el de iOS
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#1a7f4b' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#1a7f4b' } },
  },
  images: ['public/favicon.svg'],
})
