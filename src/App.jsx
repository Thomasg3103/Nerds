import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import PokemonCollection from './pages/PokemonCollection'
import GamesCollection from './pages/GamesCollection'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pokemon" element={<PokemonCollection />} />
            <Route path="/games" element={<GamesCollection />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
