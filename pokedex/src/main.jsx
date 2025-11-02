import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './css/index.css'
import App from './App.jsx'
import { PokemonProvider } from './context/PokeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PokemonProvider>
        <App />
      </PokemonProvider>
    </BrowserRouter>
  </StrictMode>,
)
