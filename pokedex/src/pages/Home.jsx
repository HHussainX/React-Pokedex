import '../css/Home.css'
import PokeCard from '../components/PokeCard.jsx'
import { useEffect, useMemo, useState } from 'react'
import { fetchAllPokemonList, fetchPokemonDetails } from '../services/api.js'

/* -------------------------------------------------------
   Helper: ID → Generation
   this helps filter by generation like gen 1 pokemon are
   between 1 and 151 and from 152 to 251 are gen 2 pokemon
   this carrys on for the other gens
------------------------------------------------------- */
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
   these variable have the names of the pokemon hardcoded
   as the API has no tag to say is the pokemon is a legendary,
   mythical, starter or a pseudo legendary.
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

/* -------------------------------------------------------
   Infer categories robustly from details
   this helps to find the pokemon that is a legendary, mythical, psuedo legendary
   or a starter if it fails then it will use the hard coded
   names mentioned above
------------------------------------------------------- */
function deriveCategory(pokeName, d = {}) {
  const name = (pokeName || '').toLowerCase().replace(/\s+/g,'-')

  // Prefer API booleans if present this will see if there is a isLegendary or isMythical tag if not then it will get the hard coded names above
  const isLegendary = !!(d.isLegendary ?? d.is_legendary ?? d?.species?.is_legendary ?? LEGENDARY_SET.has(name))
  const isMythical  = !!(d.isMythical  ?? d.is_mythical  ?? d?.species?.is_mythical  ?? MYTHICAL_SET.has(name))

  // Pseudo: prefer BST>=600 or sum of stats; else name fallback this checks for a total base state value of more or equal to 600 if not then it will get the hard coded names above
  const bstFromArray = Array.isArray(d?.stats)
    ? d.stats.reduce((s, x) => s + (x?.base_stat || 0), 0)
    : null
  const bst = d.baseStatTotal ?? d.bst ?? bstFromArray
  const isPseudo = !isLegendary && !isMythical && (bst ? bst >= 600 : PSEUDO_SET.has(name))

  // Starter: prefer API; else use our starter set (includes evolutions) will check for isStarter tag if not then it will get the hard coded names above
  const isStarter = !!(d.isStarter ?? STARTER_SET.has(name))

  return { isLegendary, isMythical, isPseudo, isStarter }
}

export default function Home() {
  const [all, setAll] = useState([]) //this will store the complete list of pokemons from the API and stores it to an array then any filtering will happen of this data
  const [q, setQ] = useState('') // this will track the characters that the user types to the search bar adn match the characters with the pokemon names e.g. 'char' would match charmander or charmelon etc

  // caches
  const [typeMap, setTypeMap] = useState(new Map()) // id -> "Fire, Flying" this will cache the pokemon type info
  const [genMap, setGenMap] = useState(new Map())   // id -> 1..9 this will cache what gen the pokemon are from
  const [catMap, setCatMap] = useState(new Map())   // id -> { isLegendary, isMythical, isPseudo, isStarter } this will cache what the category the pokemon are

  const [loading, setLoading] = useState(true) // this checks if the API call is in progress when the call is done it is marked as false wether it failed or succed
  const [error, setError] = useState('') // this will store any error message into an empty string

  // filters
  const [genFilter, setGenFilter] = useState('') // this tracks what generation the user selects by default the empty string means all pokemon
  const [typeFilters, setTypeFilters] = useState([]) // this track what type button the user selects by default the enpty string means show all pokemon
  const [catFilter, setCatFilter] = useState('') // this tracks what category of pokemon the user selects by default the empty string means all pokemon

  // Load the basic list once
  useEffect(() => {
    let live = true // this checks if the component is mounted or not
    setLoading(true) // this will display Loading pokedex message to the user while the API call is active
    fetchAllPokemonList() // this will start the API call and returns the pokemon
      .then(list => {
        if (!live) return // checks is component is mounted if not then stop
        setAll(list) // this stores the complete pokeon list in the useState that was made above
        setError('') // incase of a retry this will clear any error messages
        setGenMap(new Map(list.map(p => [p.id, generationFromId(p.id)]))) // this will create an array in this format [id, generation] and wraps it in new Map this will save time looking for all the pokemon in a certain generation that the user selects.
      })
      .catch(() => setError('Failed to load Pokédex.')) // this will display 'Failed to load Pokédex.' is there is a network error or the server is down when the API call fails
      .finally(() => live && setLoading(false)) // this will check if the component is still mounted if yes then it will change setLoading to false and hide the loading message, if no then it would skip it.
    return () => { live = false } // this will set live to false if the component is unmounted so the API doesn't update the unmounted component NOTE THIS WILL ONLY RUN IF THE COMPONENT IS UNMOUNTED
  }, [])

  /* ---------------------------------------------------------
     On-demand detail fetch:
     Whenever the user types/searches/filters, we ensure that
     all Pokémon currently relevant have details loaded.
  --------------------------------------------------------- */
  const prelimFiltered = useMemo(() => {
    const search = q.trim().toLowerCase() // this removes spaces before or after the word it also puts all of the characters typed into lowercase
    return all.filter(p => { // this will go through every pokemon and keeps all of the pokemon that returns as true (p represents a singular pokemon) 
      const nameMatch = p.title.toLowerCase().includes(search) // this will check if the pokemon name starts with the search query
      const g = genMap.get(p.id) ?? generationFromId(p.id) // this will check in the cache for the generation number and if it not in the cache then calculate it **
      const genMatch = genFilter ? String(g) === String(genFilter) : true // this will check if the gen number matches the generation number filter that the user set
      const tStr = (typeMap.get(p.id) || p.type || '').toLowerCase() // ask ai to clarify
      const typeMatch = typeFilters.length // this will check if the pokemon has the type that the user selected i.e flying, fire
        ? typeFilters.every(tf => tStr.includes(tf.toLowerCase()))
        : true
      return nameMatch && genMatch && typeMatch // this connects nameMatch genMatch typeMatch variables using AND variables
    })
  }, [all, q, genFilter, typeFilters, typeMap, genMap])

  // Ensure details for anything in prelimFiltered lacking data
  // this will run every time the prelimFiltered changes
  useEffect(() => { 
    // If there are no Pokémon in prelimFiltered, then there is nothing to fetch.
    // This avoids running unnecessary code and saves performance.
    if (!prelimFiltered.length) return 

    // 'need' = all Pokémon that are missing type OR category data in our caches.
    // We filter for Pokémon whose typeMap does NOT have their ID
    // OR whose catMap does NOT have their ID stored.
    const need = prelimFiltered.filter(p => 
        !typeMap.has(p.id) || !catMap.has(p.id)
    ) 

    // If none of the current Pokémon need extra data, stop here.
    if (!need.length) return

    // We need to run async/await inside the effect, but useEffect cannot be async.
    // So we create an async function and execute it immediately.
    ;(async () => {
      // These arrays will store the fetched data before we apply them to state.
      // This avoids updating state too many times inside the loop.
      const entriesType = []
      const entriesCat = []
      const entriesGen = []

      // Loop over every Pokémon that needs detailed info.
      for (const p of need) {
        try {
          // Fetch full Pokémon details from the API.
          const d = await fetchPokemonDetails(p.id)

          // Determine the Pokémon types.
          // If API gives an array (['Fire','Flying']) → join into "Fire, Flying".
          // If not, fall back to d.type or p.type from the basic list.
          const types = Array.isArray(d?.types) 
            ? d.types.join(', ') 
            : (d?.type ?? p.type ?? '—')

          // Store the ID and its resolved type string (e.g. [6, "Fire, Flying"]).
          entriesType.push([p.id, types])

          // Determine the category flags (starter/mythical/legendary/pseudo).
          // This uses our helper function with fallbacks.
          const cat = deriveCategory(p.title, d)

          // Store the result in the format [id, categoryObject].
          entriesCat.push([p.id, cat])

          // Determine the generation:
          // 1. Use API generation if available,
          // 2. else use genMap (if it already knows),
          // 3. else calculate from ID.
          const g = d?.generation 
            ?? genMap.get(p.id) 
            ?? generationFromId(p.id)

          // Store [id, generationNumber].
          entriesGen.push([p.id, g])
        } catch {
          // Empty catch → if a single Pokémon fails to load details,
          // we just skip it instead of breaking everything.
        }
      }

      // Now that we have all results, update the caches in one go.
      // This avoids multiple re-renders inside the loop.

      // Update types cache if we fetched any new types.
      if (entriesType.length) {
        setTypeMap(prev => new Map([...prev, ...entriesType]))
      }

      // Update category cache.
      if (entriesCat.length) {
        setCatMap(prev => new Map([...prev, ...entriesCat]))
      }

      // Update generation cache.
      if (entriesGen.length) {
        setGenMap(prev => new Map([...prev, ...entriesGen]))
      }

    })()

    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [prelimFiltered])  // This runs every time the list of relevant Pokémon changes.



// ---------------------------------------------
// After details are loaded, apply CATEGORY filter
// ---------------------------------------------
const filtered = useMemo(() => {
    return prelimFiltered.filter(p => {
      // If the user has not selected a category (starter/mythical/etc),
      // keep all Pokémon.
      if (!catFilter) return true

      // Try to get the category from cache (catMap).
      // If missing, fallback to deriveCategory using only the name.
      const cat = catMap.get(p.id) || deriveCategory(p.title)

      // Check if the current pokemon matches the selected category.
      return catFilter === 'starter'   ? !!cat.isStarter
           : catFilter === 'mythical'  ? !!cat.isMythical
           : catFilter === 'legendary' ? !!cat.isLegendary
           : catFilter === 'pseudo'    ? !!cat.isPseudo
           : true
    })
}, [prelimFiltered, catFilter, catMap])



// Inject the type string into each Pokémon result.
// If detailed type is cached, use that; otherwise fallback to the basic type.
const withTypes = filtered.map(p => ({
    ...p,
    type: typeMap.get(p.id) || p.type
}))



// Build a dynamic list of all types that exist in the data.
// This prepares the type filter buttons.
const allTypes = useMemo(() => {
    const set = new Set()

    // Add types from detailed cache (typeMap)
    typeMap.forEach(t => 
      t?.split(',').forEach(x => set.add(x.trim()))
    )

    // Add types from initial Pokémon list (all)
    all.forEach(p => 
      (p.type || '')
        .split(',')
        .forEach(x => x && set.add(x.trim()))
    )

    // Convert Set → Array, remove empties → alphabetically sort
    return Array.from(set).filter(Boolean).sort()
}, [typeMap, all])



// The generations list is static, so useMemo keeps it constant.
const generations = useMemo(() => [1,2,3,4,5,6,7,8,9], [])



// Toggle a type in the typeFilters array.
// If it's already selected → remove it.
// If it's not selected → add it.
const toggleType = (t) =>
  setTypeFilters(prev =>
    prev.includes(t)
      ? prev.filter(x => x !== t)
      : [...prev, t]
  )




// -----------------------------
// FINAL RETURN (UI ELEMENTS)
// -----------------------------
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
        <select 
          className="filter-select" 
          value={genFilter} 
          onChange={(e) => setGenFilter(e.target.value)}
        >
          <option value="">All Generations</option>
          {generations.map(g => (
            <option key={g} value={g}>Gen {g}</option>
          ))}
        </select>

        <select 
          className="filter-select" 
          value={catFilter} 
          onChange={(e) => setCatFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="starter">Starter</option>
          <option value="mythical">Mythical</option>
          <option value="legendary">Legendary</option>
          <option value="pseudo">Pseudo-legendary</option>
        </select>
      </form>

      // TYPE FILTER BUTTONS
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

      {/* Status messages */}
      {loading && <p className="status">Loading Pokédex…</p>}
      {!loading && error && <p className="status error">{error}</p>}

      {/* Pokémon grid */}
      {!loading && !error && (
        <div className="pokes-grid">
          {withTypes.map(p => <PokeCard key={p.id} poke={p} />)}
        </div>
      )}
    </div>
)
}

