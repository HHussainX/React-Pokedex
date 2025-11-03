import '../css/Home.css'
import PokeCard from '../components/PokeCard.jsx'
import { useEffect, useMemo, useState } from 'react'
import { fetchAllPokemonList, fetchPokemonDetails } from '../services/api.js'

export default function Home() {
  const [all, setAll] = useState([])
  const [typingMap, setTypingMap] = useState(new Map()) // id -> "grass, poison"
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    setLoading(true)
    fetchAllPokemonList()
      .then(list => { if (live) { setAll(list); setError('') } })
      .catch(() => setError('Failed to load Pokédex.'))
      .finally(() => live && setLoading(false))
    return () => { live = false }
  }, [])

  // lazy-load types for first 200 visible cards as an example
  useEffect(() => {
    const need = all.slice(0, 200).filter(p => !typingMap.has(p.id))
    if (!need.length) return
    ;(async () => {
      const entries = await Promise.all(
        need.map(async p => {
          const d = await fetchPokemonDetails(p.id)
          return [p.id, d?.type ?? '—']
        })
      )
      setTypingMap(prev => new Map([...prev, ...entries]))
    })()
  }, [all]) // run once when list arrives

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return s ? all.filter(p => p.title.toLowerCase().includes(s)) : all
  }, [all, q])

  const withTypes = filtered.map(p => ({ ...p, type: typingMap.get(p.id) || p.type }))

  return (
    <div className="home">
      <form onSubmit={(e) => e.preventDefault()} className="search-form">
        <input
          type="text"
          placeholder="Search for pokemon..."
          className="search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </form>

      {loading && <p className="status">Loading Pokédex…</p>}
      {!loading && error && <p className="status error">{error}</p>}

      {!loading && !error && (
        <div className="pokes-grid">
          {withTypes.map(p => <PokeCard key={p.id} poke={p} />)}
        </div>
      )}
    </div>
  )
}
