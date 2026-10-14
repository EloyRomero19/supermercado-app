import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Tipografía incluida en la app (no se pide a Google Fonts: más privado y funciona sin conexión)
import '@fontsource-variable/inter'
import './index.css'
// Importado lo antes posible: captura el aviso de instalación aunque llegue antes de pintar nada
import './pwa/installPrompt'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
