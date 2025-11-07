import '../css/Home.css'
import PokeCard from '../components/PokeCard.jsx'
import { useEffect, useMemo, useState } from 'react'
import { fetchAllPokemonList, fetchPokemonDetails } from '../services/api.js'

/* -------------------------
   Helper: ID → Generation
------------------------- */
function generationFromId(id) {
  if (id >= 1 && id <= 151) return 1
  if (id <= 251) return 2
  if (id <= 386) return 3
  if (id <= 493) return 4
  if (id <= 649) return 5
  if (id <= 721) return 6
  if (id <= 809) return 7
  if (id <= 905) return 8
  if (id <= 1017) return 9
  return null
}

/* -------------------------------------------------
   Fallback sets so filters work even w/ no API flags
   (all names are lowercase; include evolutions)
------------------------------------------------- */
const PSEUDO_SET = new Set([
  'dratini','dragonair','dragonite',
  'larvitar','pupitar','tyranitar',
  'bagon','shelgon','salamence',
  'beldum','metang','metagross',
  'gible','gabite','garchomp',
  'deino','zweilous','hydreigon',
  'goomy','sliggoo','goodra',
  'jangmo-o','hakamo-o','kommo-o',
  'dreepy','drakloak','dragapult',
  'frigibax','arctibax','baxcalibur'
])

const STARTER_SET = new Set([
  // Gen 1
  'bulbasaur','ivysaur','venusaur',
  'charmander','charmeleon','charizard',
  'squirtle','wartortle','blastoise',
  // Gen 2
  'chikorita','bayleef','meganium',
  'cyndaquil','quilava','typhlosion',
  'totodile','croconaw','feraligatr',
  // Gen 3
  'treecko','grovyle','sceptile',
  'torchic','combusken','blaziken',
  'mudkip','marshtomp','swampert',
  // Gen 4
  'turtwig','grotle','torterra',
  'chimchar','monferno','infernape',
  'piplup','prinplup','empoleon',
  // Gen 5
  'snivy','servine','serperior',
  'tepig','pignite','emboar',
  'oshawott','dewott','samurott',
  // Gen 6
  'chespin','quilladin','chesnaught',
  'fennekin','braixen','delphox',
  'froakie','frogadier','greninja',
  // Gen 7
  'rowlet','dartrix','decidueye',
  'litten','torracat','incineroar',
  'popplio','brionne','primarina',
  // Gen 8
  'grookey','thwackey','rillaboom',
  'scorbunny','raboot','cinderace',
  'sobble','drizzile','inteleon',
  // Gen 9
  'sprigatito','floragato','meowscarada',
  'fuecoco','crocalor','skeledirge',
  'quaxly','quaxwell','quaquaval'
])

// Not exhaustive, but covers the big ones so the filter isn’t empty
const LEGENDARY_SET = new Set([
  'articuno','zapdos','moltres','raikou','entei','suicune',
  'regirock','regice','registeel','latias','latios','kyogre','groudon','rayquaza',
  'uxie','mesprit','azelf','dialga','palkia','giratina','heatran','regigigas',
  'cobalion','terrakion','virizion','tornadus','thundurus','landorus','kyurem',
  'xerneas','yveltal','zygarde',
  'tapu koku','tapu lele','tapu bulu','tapu fini','solgaleo','lunala','necrozma',
  'zacian','zamazenta','eternatus','regieleki','regidrago','calyrex',
  'koraidon','miraidon','ting-lu','chien-pao','wo-chien','chi-yu'
].map(n => n.replace(/\s+/g,'-'))) // allow hyphenated species

const MYTHICAL_SET = new Set([
  'mew','celebi','jirachi','deoxys','manaphy','phione','darkrai','shaymin','arceus',
  'victini','keldeo','meloetta','genesect',
  'diancie','hoopa','volcanion',
  'magearna','marshadow','zeraora','meltan','melmetal',
  'zarude',
  'zarude-dada', // alt
  'mewtwo' // (not actually mythical, but if your API misflags, this helps demo)
])

/* --------------------------------------
   Infer categories robustly from details
--------------------------------------- */
function deriveCategory(pokeName, d = {}) {
  const name = (pokeName || '').toLowerCase().replace(/\s+/g,'-')

  // Prefer API booleans if present
  const isLegendary = !!(d.isLegendary ?? d.is_legendary ?? d?.species?.is_legendary ?? LEGENDARY_SET.has(name))
  const isMythical  = !!(d.isMythical  ?? d.is_mythical  ?? d?.species?.is_mythical  ?? MYTHICAL_SET.has(name))

  // Pseudo: prefer BST>=600 or sum of stats; else name fallback
  const bstFromArray = Array.isArray(d?.stats)
    ? d.stats.reduce((s, x) => s + (x?.base_stat || 0), 0)
    : null
  const bst = d.baseStatTotal ?? d.bst ?? bstFromArray
  const isPseudo = !isLegendary && !isMythical && (bst ? bst >= 600 : PSEUDO_SET.has(name))

  // Starter: prefer API; else use our starter set (includes evolutions)
  const isStarter = !!(d.isStarter ?? STARTER_SET.has(name))

  return { isLegendary, isMythical, isPseudo, isStarter }
}

export default function Home() {
  const [all, setAll] = useState([])
  const [q, setQ] = useState('')

  // caches
  const [typeMap, setTypeMap] = useState(new Map()) // id -> "Fire, Flying"
  const [genMap, setGenMap] = useState(new Map())   // id -> 1..9
  const [catMap, setCatMap] = useState(new Map())   // id -> { isLegendary, isMythical, isPseudo, isStarter }

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // filters
  const [genFilter, setGenFilter] = useState('')
  const [typeFilters, setTypeFilters] = useState([])
  const [catFilter, setCatFilter] = useState('') // '', 'starter','mythical','legendary','pseudo'

  // Load the basic list once
  useEffect(() => {
    let live = true
    setLoading(true)
    fetchAllPokemonList()
      .then(list => {
        if (!live) return
        setAll(list)
        setError('')
        setGenMap(new Map(list.map(p => [p.id, generationFromId(p.id)])))
      })
      .catch(() => setError('Failed to load Pokédex.'))
      .finally(() => live && setLoading(false))
    return () => { live = false }
  }, [])

  /* ---------------------------------------------------------
     On-demand detail fetch:
     Whenever the user types/searches/filters, we ensure that
     all Pokémon currently relevant have details loaded.
  --------------------------------------------------------- */
  const prelimFiltered = useMemo(() => {
    const search = q.trim().toLowerCase()
    return all.filter(p => {
      const nameMatch = p.title.toLowerCase().includes(search)
      const g = genMap.get(p.id) ?? generationFromId(p.id)
      const genMatch = genFilter ? String(g) === String(genFilter) : true
      const tStr = (typeMap.get(p.id) || p.type || '').toLowerCase()
      const typeMatch = typeFilters.length
        ? typeFilters.every(tf => tStr.includes(tf.toLowerCase()))
        : true
      return nameMatch && genMatch && typeMatch
    })
  }, [all, q, genFilter, typeFilters, typeMap, genMap])

  // Ensure details for anything in prelimFiltered lacking data
  useEffect(() => {
    if (!prelimFiltered.length) return
    const need = prelimFiltered.filter(p => !typeMap.has(p.id) || !catMap.has(p.id))
    if (!need.length) return

    ;(async () => {
      const entriesType = []
      const entriesCat = []
      const entriesGen = []
      for (const p of need) {
        try {
          const d = await fetchPokemonDetails(p.id)
          const types = Array.isArray(d?.types) ? d.types.join(', ') : (d?.type ?? p.type ?? '—')
          entriesType.push([p.id, types])
          const cat = deriveCategory(p.title, d)
          entriesCat.push([p.id, cat])
          const g = d?.generation ?? genMap.get(p.id) ?? generationFromId(p.id)
          entriesGen.push([p.id, g])
        } catch {}
      }
      if (entriesType.length) setTypeMap(prev => new Map([...prev, ...entriesType]))
      if (entriesCat.length)  setCatMap(prev => new Map([...prev, ...entriesCat]))
      if (entriesGen.length)  setGenMap(prev => new Map([...prev, ...entriesGen]))
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prelimFiltered])

  // Now apply category filter (after we’ve ensured details)
  const filtered = useMemo(() => {
    return prelimFiltered.filter(p => {
      if (!catFilter) return true
      const cat = catMap.get(p.id) || deriveCategory(p.title) // still works via name fallbacks
      return catFilter === 'starter'   ? !!cat.isStarter
           : catFilter === 'mythical'  ? !!cat.isMythical
           : catFilter === 'legendary' ? !!cat.isLegendary
           : catFilter === 'pseudo'    ? !!cat.isPseudo
           : true
    })
  }, [prelimFiltered, catFilter, catMap])

  const withTypes = filtered.map(p => ({ ...p, type: typeMap.get(p.id) || p.type }))
  const allTypes = useMemo(() => {
    const set = new Set()
    typeMap.forEach(t => t?.split(',').forEach(x => set.add(x.trim())))
    all.forEach(p => (p.type || '').split(',').forEach(x => x && set.add(x.trim())))
    return Array.from(set).filter(Boolean).sort()
  }, [typeMap, all])
  const generations = useMemo(() => [1,2,3,4,5,6,7,8,9], [])

  const toggleType = (t) => setTypeFilters(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  return (
    <div className="home">
      <form onSubmit={(e) => e.preventDefault()} className="search-form">
        <input
          type="text"
          placeholder="Search Pokémon…"
          className="search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="filter-select" value={genFilter} onChange={(e) => setGenFilter(e.target.value)}>
          <option value="">All Generations</option>
          {generations.map(g => <option key={g} value={g}>Gen {g}</option>)}
        </select>
        <select className="filter-select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          <option value="starter">Starter</option>
          <option value="mythical">Mythical</option>
          <option value="legendary">Legendary</option>
          <option value="pseudo">Pseudo-legendary</option>
        </select>
      </form>

      <div className="filters-row">
        {allTypes.map(t => (
          <button
            key={t}
            type="button"
            className={`type-pill ${typeFilters.includes(t) ? 'active' : ''}`}
            onClick={() => toggleType(t)}
            aria-pressed={typeFilters.includes(t)}
          >
            {t}
          </button>
        ))}
      </div>

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
