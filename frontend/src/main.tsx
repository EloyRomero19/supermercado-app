import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Importado lo antes posible: captura el aviso de instalación aunque llegue antes de pintar nada
import './pwa/installPrompt'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
