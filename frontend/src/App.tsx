import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { GuestOnly, RequireAuth } from './auth/RouteGuards'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route index element={<HomePage />} />
          </Route>
          <Route element={<GuestOnly />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="registro" element={<RegisterPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
