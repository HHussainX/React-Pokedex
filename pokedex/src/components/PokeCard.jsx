// src/components/PokeCard.jsx
import { Link } from 'react-router-dom'
import '../css/PokeCard.css'

export default function PokeCard({ poke }) {
  const artworkUrl =
    poke.image ||
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${poke.id}.png`

  return (
    <Link to={`/pokemon/${poke.id}`} className="poke-card-link">
      <div className="poke-card">
        <div className="poke-poster">
          <img src={artworkUrl} alt={poke.title} />
        </div>
        <div className="poke-info">
          <h3>{poke.title}</h3>
          <p>{poke.type}</p>
        </div>
      </div>
    </Link>
  )
}
