import { useState } from 'react'
import { Link } from 'react-router-dom'

import type { Deck } from '../types'

export function DeckList({ decks, onRename, onDelete }: { decks: Deck[]; onRename: (deck: Deck, name: string) => void; onDelete: (deck: Deck) => void }) {
  const [editing, setEditing] = useState<string | null>(null)
  const [name, setName] = useState('')
  if (!decks.length) return <div className="empty-state"><span className="empty-icon">+</span><h2>Your den is empty</h2><p>Start a new deck and gather the critters for your next adventure.</p></div>
  return <div className="deck-grid">{decks.map((deck) => <article className="deck-card" key={deck.id}>
    <div className="deck-card-top"><span className="deck-kicker">DECK / {String(deck.card_count).padStart(2, '0')} CARDS</span><button className="icon-button" aria-label="Delete deck" onClick={() => onDelete(deck)}>x</button></div>
    {editing === deck.id ? <input autoFocus value={name} onChange={(event) => setName(event.target.value)} onBlur={() => { onRename(deck, name); setEditing(null) }} onKeyDown={(event) => { if (event.key === 'Enter') { onRename(deck, name); setEditing(null) } }} /> : <h2>{deck.name}</h2>}
    <p>{deck.description || 'A fresh trail waiting to be explored.'}</p>
    <div className="deck-card-footer"><Link className="button primary small" to={`/decks/${deck.id}`}>Enter the den</Link><button className="button ghost small" onClick={() => { setEditing(deck.id); setName(deck.name) }}>Rename</button></div>
  </article>)}</div>
}
