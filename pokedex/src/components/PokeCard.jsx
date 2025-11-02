import '../css/PokeCard.css'
import { usePokemonContext } from '../context/PokeContext.jsx'

export default function PokeCard({ poke }) {
  const { isFavorite, addToFavorites, removeFromFavorites } = usePokemonContext()
  const favorite = isFavorite(poke.id)

  const onFavoriteClick = (e) => {
    e.preventDefault()
    favorite ? removeFromFavorites(poke.id) : addToFavorites(poke)
  }

  return (
    <div className="poke-card">
      <div className="poke-poster">
        <img src={poke.img} alt={poke.title} />
        <div className="poke-overlay">
          <button className={`favorite ${favorite ? 'active' : ''}`} onClick={onFavoriteClick}>
            ♥
          </button>
        </div>
      </div>
      <div className="poke-info">
        <h3>{poke.title}</h3>
        <p className="poke-type">{poke.type || '—'}</p>
      </div>
    </div>
  )
}
