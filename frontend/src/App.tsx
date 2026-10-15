import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { AppLayout } from './layout/AppLayout'
import { GuestOnly, RequireAuth } from './auth/RouteGuards'
import { HomePage } from './pages/HomePage'
import { JoinPage } from './pages/JoinPage'
import { ListRoute } from './pages/ListPage'
import { LoginPage } from './pages/LoginPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { RegisterPage } from './pages/RegisterPage'
import { AccountPage } from './pages/AccountPage'
import { RecipePage } from './pages/RecipePage'
import { RecipesPage } from './pages/RecipesPage'
import { UpdatePrompt } from './pwa/UpdatePrompt'
import { OfflineBanner } from '@/components/OfflineBanner'
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<RequireAuth />}>
            {/* Rutas anidadas: AppLayout pinta la página y debajo la barra de navegación */}
            <Route element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="listas/:listId" element={<ListRoute />} />
              <Route path="recetas" element={<RecipesPage />} />
              <Route path="recetas/:recipeId" element={<RecipePage />} />
              <Route path="cuenta" element={<AccountPage />} />
              {/* Rutas antiguas: por si alguien las tenía guardadas */}
              <Route path="ajustes" element={<Navigate to="/cuenta" replace />} />
              <Route path="comprar" element={<Navigate to="/" replace />} />
              <Route path="buscar" element={<Navigate to="/recetas" replace />} />
            </Route>
            <Route path="unirse/:code" element={<JoinPage />} />
          </Route>
          <Route element={<GuestOnly />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="registro" element={<RegisterPage />} />
          </Route>
          <Route path="privacidad" element={<PrivacyPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
      <UpdatePrompt />
      <OfflineBanner />
      <Toaster />
    </BrowserRouter>
  )
}

export default App
