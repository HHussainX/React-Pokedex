import '../css/Favorites.css'
import { usePokemonContext } from '../context/PokeContext.jsx'
import PokeCard from '../components/PokeCard.jsx'

export default function Favorite() {
  const { favorites } = usePokemonContext()

  if (favorites.length) {
    return (
      <div className="favorites">
        <h2>Your Favorite Pokémon</h2>
        <div className="pokes-grid">
          {favorites.map(poke => <PokeCard key={poke.id} poke={poke} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="favorites-empty">
      <h2>No Favorite Pokémon Yet</h2>
      <p>Start adding Pokémon to your favorites and they will appear here!</p>
    </div>
  )
}
