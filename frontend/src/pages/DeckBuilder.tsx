import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { CardTile } from '../components/CardTile'
import { LoadingState } from '../components/LoadingState'
import { SearchFilters, type SearchValues } from '../components/SearchFilters'
import { api, apiError } from '../services/api'
import type { Card, CardsResponse, Deck, DeckCard } from '../types'

const initialSearch: SearchValues = { search: '', type: '', color: '', set_name: '', sort: 'name' }

export function DeckBuilder() {
  const { deckId } = useParams()
  const [deck, setDeck] = useState<Deck | null>(null)
  const [deckName, setDeckName] = useState('')
  const [cards, setCards] = useState<Card[]>([])
  const [filters, setFilters] = useState(initialSearch)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [activePanel, setActivePanel] = useState<'search' | 'deck'>('search')
  const [detail, setDetail] = useState<Card | null>(null)

  const loadDeck = async () => { try { const response = await api.get<Deck>(`/decks/${deckId}`); setDeck(response.data); setDeckName(response.data.name) } catch (err) { setError(apiError(err)) } finally { setLoading(false) } }
  const loadCards = async (nextPage = 1) => { setSearching(true); try { const response = await api.get<CardsResponse>('/cards', { params: { ...filters, page: nextPage, limit: 24 } }); setCards(nextPage === 1 ? response.data.cards : [...cards, ...response.data.cards]); setPage(nextPage); setHasMore(response.data.has_more) } catch (err) { setError(apiError(err)) } finally { setSearching(false) } }
  useEffect(() => { void loadDeck() }, [deckId])
  useEffect(() => { const timer = window.setTimeout(() => void loadCards(), 350); return () => window.clearTimeout(timer) }, [filters, deckId])
  const add = async (card: Card) => {
    if (!deck) return
    const previousDeck = deck
    const existing = deck.cards?.find((item) => item.card_id === card.id)
    const nextCards = existing
      ? deck.cards?.map((item) => item.card_id === card.id ? { ...item, quantity: item.quantity + 1 } : item)
      : [...(deck.cards ?? []), { card_id: card.id, quantity: 1, cards: card }]
    setDeck({ ...deck, cards: nextCards, card_count: deck.card_count + 1 })
    try {
      await api.post(`/decks/${deckId}/cards`, { card_id: card.id, quantity: 1 })
    } catch (err) {
      setDeck(previousDeck)
      setError(apiError(err))
    }
  }
  const setQuantity = async (item: DeckCard, quantity: number) => {
    if (!deck) return
    const previousDeck = deck
    const change = quantity - item.quantity
    const nextCards = quantity <= 0
      ? (deck.cards ?? []).filter((entry) => entry.card_id !== item.card_id)
      : (deck.cards ?? []).map((entry) => entry.card_id === item.card_id ? { ...entry, quantity } : entry)
    setDeck({ ...deck, cards: nextCards, card_count: deck.card_count + change })
    try {
      if (quantity <= 0) await api.delete(`/decks/${deckId}/cards/${item.card_id}`)
      else await api.patch(`/decks/${deckId}/cards/${item.card_id}`, { quantity })
    } catch (err) {
      setDeck(previousDeck)
      setError(apiError(err))
    }
  }
  const rename = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const input = new FormData(event.currentTarget).get('name')?.toString().trim()
    if (!input || input === deck?.name || !deck) return
    const previousDeck = deck
    setDeck({ ...deck, name: input })
    setDeckName(input)
    try {
      const response = await api.patch<Deck>(`/decks/${deckId}`, { name: input })
      setDeck((current) => current ? { ...current, name: response.data.name } : current)
    } catch (err) {
      setDeck(previousDeck)
      setDeckName(previousDeck.name)
      setError(apiError(err))
    }
  }
  if (loading) return <LoadingState label="Opening deck" />
  if (!deck) return <p className="error-message banner">{error || 'Deck not found.'}</p>
  return <section className="builder-shell"><div className="builder-mobile-tabs"><button className={activePanel === 'search' ? 'active' : ''} onClick={() => setActivePanel('search')}>Card database</button><button className={activePanel === 'deck' ? 'active' : ''} onClick={() => setActivePanel('deck')}>My deck <span>{deck.card_count}</span></button></div><div className={`search-panel ${activePanel === 'search' ? 'mobile-active' : ''}`}><div className="panel-heading"><div><span className="eyebrow">CARD DATABASE</span><h1>Find your next move</h1></div><span className="result-count">{searching ? 'Searching...' : `${cards.length} shown`}</span></div><SearchFilters values={filters} onChange={(next) => { setFilters(next); setPage(1) }} /><div className="card-grid">{cards.map((card) => <CardTile key={card.id} card={card} onAdd={() => void add(card)} onOpen={() => setDetail(card)} />)}</div>{!searching && !cards.length && <div className="empty-state compact"><h2>No cards found</h2><p>Try a different search or filter.</p></div>}{hasMore && <button className="button ghost load-more" onClick={() => void loadCards(page + 1)}>Load more</button>}</div><aside className={`deck-panel ${activePanel === 'deck' ? 'mobile-active' : ''}`}><div className="deck-panel-heading"><span className="eyebrow">CURRENT DECK</span><form onSubmit={rename}><input name="name" value={deckName} onChange={(event) => setDeckName(event.target.value)} aria-label="Deck name" /></form><div className="deck-total"><strong>{deck.card_count}</strong><span>cards total</span></div></div><div className="deck-list">{(deck.cards ?? []).map((item) => <div className="deck-row" key={item.card_id}><div className="mini-art">{item.cards.image_url ? <img src={item.cards.image_url} alt="" /> : item.cards.name.slice(0, 1)}</div><div className="deck-row-name"><strong>{item.cards.name}</strong><span>{item.cards.type.replace('_', ' ')}</span></div><div className="quantity"><button aria-label={`Decrease ${item.cards.name}`} onClick={() => void setQuantity(item, item.quantity - 1)}>-</button><span>{item.quantity}</span><button aria-label={`Increase ${item.cards.name}`} onClick={() => void setQuantity(item, item.quantity + 1)}>+</button></div><button className="remove-button" aria-label={`Remove ${item.cards.name}`} onClick={() => void setQuantity(item, 0)}>x</button></div>)}{!deck.cards?.length && <div className="deck-empty"><span>01</span><p>Your deck is waiting.<br />Add cards from the database.</p></div>}</div></aside>{detail && <div className="modal-backdrop" onClick={() => setDetail(null)}><div className="card-detail" onClick={(event) => event.stopPropagation()}><button className="close-button" onClick={() => setDetail(null)}>x</button><div className="detail-art">{detail.image_url ? <img src={detail.image_url} alt={detail.name} /> : <span>{detail.name.slice(0, 2)}</span>}</div><div><span className="eyebrow">{detail.type.replace('_', ' ')}</span><h2>{detail.name}</h2><p>{detail.text || 'No card text available.'}</p><p className="muted">{detail.set_name} / {detail.number}</p><button className="button primary" onClick={() => { void add(detail); setDetail(null) }}>+ Add to deck</button></div></div></div>}</section>
}
