import type { Card } from '../types'

const colorClass = (color: string | null) => color?.toLowerCase() ?? 'none'

export function CardTile({ card, onAdd, onOpen }: { card: Card; onAdd: () => void; onOpen: () => void }) {
  return <article className="card-tile" onClick={onOpen}>
    <div className="card-art">
      {card.image_url ? <img src={card.image_url} alt={card.name} /> : <span>{card.name.slice(0, 2).toUpperCase()}</span>}
      <button className="add-button" onClick={(event) => { event.stopPropagation(); onAdd() }}>+ Add</button>
    </div>
    <div className="card-tile-body">
      <div className="card-title-row"><strong>{card.name}</strong><span className="type-label">{card.type.replace('_', ' ')}</span></div>
      <div className="color-row">{[card.color1, card.color2].filter(Boolean).map((color) => <span className={`color-dot ${colorClass(color)}`} key={color} title={color ?? ''} />)}</div>
      <span className="muted">{card.set_name} / {card.number}</span>
    </div>
  </article>
}
