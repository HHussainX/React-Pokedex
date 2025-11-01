import '../css/Home.css'
import PokeCard from '../components/PokeCard'
import { useMemo } from 'react'

function Home() {
  // Base data
  const pokemons = [
    { id: 1, title: 'Bulbasaur', type: 'Grass, Poison' },
    { id: 2, title: 'Ivysaur',   type: 'Grass, Poison' },
    { id: 3, title: 'Venusaur',  type: 'Grass, Poison' },
    { id: 4, title: 'Charmander', type: 'Fire' },
    { id: 5, title: 'Charmeleon', type: 'Fire' },
  ]

  // Add sprite URLs using the Pokédex id
  const pokesWithImg = useMemo(
    () =>
      pokemons.map(p => ({
        ...p,
        url: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`,
      })),
    []
  )

  const handleSearch = (e) => {
    e.preventDefault()
    // add search logic later
  }

  return (
    <div className="home">
      <form onSubmit={handleSearch} className="search-form">
        <input type="text" placeholder="Search for pokemon..." className="search-input" />
      </form>

      <div className="pokes-grid">
        {pokesWithImg.map(pokemon => (
          <PokeCard poke={pokemon} key={pokemon.id} />
        ))}
      </div>
    </div>
  )
}

export default Home
