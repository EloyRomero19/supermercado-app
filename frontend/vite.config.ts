import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// En desarrollo, Vite reenvía al backend las rutas de la API y del login con Google.
// Así el navegador ve un único origen (localhost:5173): sin CORS y con cookies SameSite=Strict.
const backend = 'http://localhost:8080'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': backend,
      '/oauth2': backend,
      '/login/oauth2': backend,
    },
  },
})
