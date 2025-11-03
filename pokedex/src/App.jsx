// src/App.jsx
import './css/App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Home from './pages/Home'
import Favorites from './pages/Favorite'
import PokemonDetail from './pages/PokemonDetail'
import NavBar from './components/NavBar'

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/pokemon/:id" element={<PokemonDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}