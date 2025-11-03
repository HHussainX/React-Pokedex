const BASE = 'https://pokeapi.co/api/v2'

export async function fetchAllPokemonList() {
  const res = await fetch(`${BASE}/pokemon?limit=100000&offset=0`)
  const data = await res.json()
  const list = data.results.map(p => {
    const id = Number(p.url.split('/').filter(Boolean).pop())
    return {
      id,
      title: p.name.charAt(0).toUpperCase() + p.name.slice(1),
      img: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
      type: null, // filled later
    }
  })
  list.sort((a, b) => a.id - b.id)
  return list
}

export async function fetchPokemonDetails(idOrName) {
  const res = await fetch(`${BASE}/pokemon/${idOrName}`)
  if (!res.ok) return null
  const d = await res.json()
  return {
    id: d.id,
    title: d.name.charAt(0).toUpperCase() + d.name.slice(1),
    img: d.sprites.other?.['official-artwork']?.front_default || d.sprites.front_default,
    type: d.types.map(t => t.type.name).join(', ')
  }
}
