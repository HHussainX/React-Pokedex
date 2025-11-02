import './css/App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Favorite from './pages/Favorite.jsx'
import NavBar from './components/NavBar.jsx'

export default function App() {
  return (
    <div>
      <NavBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/favorites" element={<Favorite />} />
          <Route path="*" element={<div style={{ padding: 16 }}>Not Found</div>} />
        </Routes>
      </main>
    </div>
  )
}
