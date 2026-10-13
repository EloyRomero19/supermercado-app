import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { AppLayout } from './layout/AppLayout'
import { GuestOnly, RequireAuth } from './auth/RouteGuards'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { HomePage } from './pages/HomePage'
import { JoinPage } from './pages/JoinPage'
import { ListPage } from './pages/ListPage'
import { LoginPage } from './pages/LoginPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { RegisterPage } from './pages/RegisterPage'
import { SettingsPage } from './pages/SettingsPage'
import { ShopPage } from './pages/ShopPage'
import { UpdatePrompt } from './pwa/UpdatePrompt'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<RequireAuth />}>
            {/* Rutas anidadas: AppLayout pinta la página y debajo la barra de navegación */}
            <Route element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="listas/:listId" element={<ListPage />} />
              <Route path="comprar" element={<ShopPage />} />
              <Route path="ajustes" element={<SettingsPage />} />
            </Route>
            <Route path="unirse/:code" element={<JoinPage />} />
          </Route>
          <Route element={<GuestOnly />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="registro" element={<RegisterPage />} />
          </Route>
          <Route path="auth/callback" element={<AuthCallbackPage />} />
          <Route path="privacidad" element={<PrivacyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
      <UpdatePrompt />
    </BrowserRouter>
  )
}

export default App
