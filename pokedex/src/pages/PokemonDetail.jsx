// src/pages/PokemonDetail.jsx
import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import '../css/PokemonDetail.css'

export default function PokemonDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let live = true
    setLoading(true)
    setError('')
    fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('Pokémon not found')
        return r.json()
      })
      .then(json => { if (live) setData(json) })
      .catch(e => setError(e.message))
      .finally(() => live && setLoading(false))
    return () => { live = false }
  }, [id])

  // ----- SAFE DERIVED VALUES -----
  const movesSource = data?.moves ?? [] // <-- prevents crash
  const levelUpMoves = useMemo(() => {
    const rows = []
    for (const m of movesSource) {
      const levelDetails = (m.version_group_details ?? [])
        .filter(v => v.move_learn_method?.name === 'level-up')
        .sort((a, b) => (a.level_learned_at || 0) - (b.level_learned_at || 0))
      if (levelDetails.length) {
        rows.push({ name: m.move?.name ?? 'unknown', level: levelDetails[0].level_learned_at || 0 })
      }
    }
    return rows.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)).slice(0, 20)
  }, [movesSource])

  if (loading) return <div className="container">Loading…</div>
  if (error)   return <div className="container">Error: {error}</div>
  if (!data)   return null

  const artwork =
    data.sprites?.other?.['official-artwork']?.front_default ||
    data.sprites?.other?.dream_world?.front_default ||
    data.sprites?.front_default ||
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${data.id}.png`

  const name = (data.name || '').replace('-', ' ')
  const types = (data.types ?? []).map(t => t.type?.name).join(', ')
  const abilities = (data.abilities ?? []).map(a =>
    a.is_hidden ? `${a.ability?.name} (hidden)` : a.ability?.name
  )

  return (
    <div className="container detail">
      <Link to="/" className="back">← Back</Link>

      <h1 style={{ textTransform: 'capitalize' }}>
        {name} <span className="id">#{String(data.id).padStart(3, '0')}</span>
      </h1>
      <p className="types" style={{ textTransform: 'capitalize' }}>{types}</p>

      <div className="detail-body" style={{ display:'grid', gridTemplateColumns:'360px 1fr', gap:'2rem' }}>
        <img
          className="artwork"
          src={artwork}
          alt={name}
          style={{ width:'100%', height:360, objectFit:'contain', background:'#111', borderRadius:12, padding:16 }}
        />

        <div className="info">
          <h2>Stats</h2>
          <ul className="stats" style={{ listStyle:'none', padding:0, margin:0, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 16px', textTransform:'capitalize' }}>
            {(data.stats ?? []).map(s => (
              <li key={s.stat?.name} style={{ display:'flex', justifyContent:'space-between' }}>
                <span>{s.stat?.name}</span>
                <span>{s.base_stat}</span>
              </li>
            ))}
          </ul>

          <h2>About</h2>
          <div className="about-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 16px' }}>
            <div><strong>Height:</strong> {(data.height ?? 0) / 10} m</div>
            <div><strong>Weight:</strong> {(data.weight ?? 0) / 10} kg</div>
            <div style={{ textTransform:'capitalize' }}>
              <strong>Abilities:</strong> {abilities.join(', ')}
            </div>
          </div>

          <h2>Level-up Moves</h2>
          <ul className="moves" style={{ listStyle:'none', padding:0, margin:'4px 0 0', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 16px' }}>
            {levelUpMoves.length ? levelUpMoves.map(m => (
              <li key={`${m.name}-${m.level}`} style={{ display:'flex', justifyContent:'space-between', textTransform:'capitalize' }}>
                <span>{m.name}</span><span style={{ opacity:.8 }}>Lv {m.level}</span>
              </li>
            )) : <li>No level-up moves found.</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}
