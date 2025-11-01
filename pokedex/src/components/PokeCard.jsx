import '../css/PokeCard.css'

function PokeCard({ poke }) {
  function onlike() {
    alert(`clicked: ${poke.title}`)
  }

  return (
    <div className="poke-card">
      <div className="poke-poster">
        <img src={poke.url} alt={poke.title} />
        <div className="poke-overlay">
          <button className="favorite" onClick={onlike}>♥</button>
        </div>
      </div>
      <div className="poke-info">
        <h3>{poke.title}</h3>
        <p>{poke.type}</p>
      </div>
    </div>
  )
}

export default PokeCard