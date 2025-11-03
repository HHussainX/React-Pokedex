import { createContext, useContext, useState, useEffect } from 'react'

const PokemonContext = createContext()

export function PokemonProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('favorites') || '[]')
    } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites))
  }, [favorites])

  const isFavorite = (id) => favorites.some(p => p.id === id)
  const addToFavorites = (poke) =>
    setFavorites(prev => (isFavorite(poke.id) ? prev : [...prev, poke]))
  const removeFromFavorites = (id) =>
    setFavorites(prev => prev.filter(p => p.id !== id))

  return (
    <PokemonContext.Provider value={{ favorites, isFavorite, addToFavorites, removeFromFavorites }}>
      {children}
    </PokemonContext.Provider>
  )
}
export const usePokemonContext = () => useContext(PokemonContext)
