import { useEffect, useState } from 'react'

import { CardTile } from '../components/CardTile'
import { LoadingState } from '../components/LoadingState'
import { SearchFilters, type SearchValues } from '../components/SearchFilters'
import { useAuth } from '../hooks/useAuth'
import { api, apiError } from '../services/api'
import type { Card, CardsResponse } from '../types'

const initialSearch: SearchValues = { search: '', type: '', color: '', set_name: '', sort: 'name' }

export function AdminRemove() {
  const { profile } = useAuth()
  const [cards, setCards] = useState<Card[]>([])
  const [filters, setFilters] = useState(initialSearch)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [target, setTarget] = useState<Card | null>(null)

  const loadCards = async (nextPage = 1) => {
    setSearching(true)
    try {
      const response = await api.get<CardsResponse>('/cards', { params: { ...filters, page: nextPage, limit: 24 } })
      setCards(nextPage === 1 ? response.data.cards : [...cards, ...response.data.cards])
      setPage(nextPage)
      setHasMore(response.data.has_more)
    } catch (requestError) {
      setError(apiError(requestError))
    } finally {
      setSearching(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCards(), 120)
    return () => window.clearTimeout(timer)
  }, [filters])

  const remove = async () => {
    if (!target) return
    const removed = target
    setTarget(null)
    setCards((current) => current.filter((card) => card.id !== removed.id))
    try {
      await api.delete(`/admin/cards/${removed.id}`)
    } catch (requestError) {
      setCards((current) => [removed, ...current])
      setError(apiError(requestError))
    }
  }

  if (profile?.role !== 'ADMIN') return <section className="page-shell"><p className="error-message banner">Administrator access is required.</p></section>
  if (loading) return <LoadingState label="Loading cards" />

  return <section className="page-shell">
    <div className="page-heading"><div><span className="eyebrow">ADMIN TOOLS</span><h1>Manage cards</h1><p>Search the wilds and release cards from the collection.</p></div></div>
    {error && <p className="error-message banner">{error}</p>}
    <div className="admin-card-search">
      <SearchFilters values={filters} onChange={(next) => { setFilters(next); setPage(1) }} />
      <div className="panel-heading"><span className="result-count">{searching ? 'Searching...' : `${cards.length} shown`}</span></div>
      <div className="card-grid">{cards.map((card) => <CardTile key={card.id} card={card} onAdd={() => setTarget(card)} onOpen={() => setTarget(card)} actionLabel="Remove" actionClass="remove-card-button" />)}</div>
      {!searching && !cards.length && <div className="empty-state compact"><h2>No critters found</h2><p>Try a different trail or habitat filter.</p></div>}
      {hasMore && <button className="button ghost load-more" onClick={() => void loadCards(page + 1)}>Load more</button>}
    </div>
    {target && <div className="modal-backdrop" onClick={() => setTarget(null)}><div className="site-modal" role="dialog" aria-modal="true" aria-labelledby="remove-card-title" onClick={(event) => event.stopPropagation()}><button className="close-button" aria-label="Close" onClick={() => setTarget(null)}>x</button><span className="eyebrow">RELEASE CARD</span><h2 id="remove-card-title">Release {target.name}?</h2><p>This permanently releases the card from the wilds and any decks using it.</p><div className="site-modal-actions"><button className="button ghost" onClick={() => setTarget(null)}>Keep card</button><button className="button primary danger-button" onClick={() => { void remove() }}>Release card</button></div></div></div>}
  </section>
}
