import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import PokemonCollection from './pages/PokemonCollection'
import PokemonSet from './pages/PokemonSet'
import GamesCollection from './pages/GamesCollection'
import Login from './pages/Login'

function ProtectedLayout() {
  const { user } = useAuth()

  if (user === undefined) return <div className="loading-screen">Loading…</div>
  if (user === null) return <Navigate to="/login" replace />

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/"              element={<Dashboard />} />
          <Route path="/pokemon"       element={<PokemonCollection />} />
          <Route path="/pokemon/:setId" element={<PokemonSet />} />
          <Route path="/games"         element={<GamesCollection />} />
          <Route path="*"              element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function LoginRoute() {
  const { user } = useAuth()
  if (user === undefined) return <div className="loading-screen">Loading…</div>
  if (user)               return <Navigate to="/" replace />
  return <Login />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/*"     element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
