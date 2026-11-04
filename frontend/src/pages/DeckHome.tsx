import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { DeckList } from '../components/DeckList'
import { LoadingState } from '../components/LoadingState'
import { api, apiError } from '../services/api'
import type { Deck } from '../types'

export function DeckHome() {
  const navigate = useNavigate()
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [deckName, setDeckName] = useState('Untitled deck')
  const [deleteTarget, setDeleteTarget] = useState<Deck | null>(null)
  const load = async () => { try { const response = await api.get<Deck[]>('/decks'); setDecks(response.data) } catch (err) { setError(apiError(err)) } finally { setLoading(false) } }
  useEffect(() => { void load() }, [])
  const create = async (event: React.FormEvent) => {
    event.preventDefault()
    const name = deckName.trim()
    if (!name) return
    try { const response = await api.post<Deck>('/decks', { name }); navigate(`/decks/${response.data.id}`) } catch (err) { setError(apiError(err)) }
  }
  const rename = async (deck: Deck, name: string) => { if (!name.trim() || name === deck.name) return; try { const response = await api.patch<Deck>(`/decks/${deck.id}`, { name }); setDecks((current) => current.map((item) => item.id === deck.id ? { ...item, name: response.data.name } : item)) } catch (err) { setError(apiError(err)) } }
  const remove = async () => {
    if (!deleteTarget) return
    try { await api.delete(`/decks/${deleteTarget.id}`); setDecks((current) => current.filter((item) => item.id !== deleteTarget.id)); setDeleteTarget(null) } catch (err) { setError(apiError(err)) }
  }
  return <section className="page-shell"><div className="page-heading"><div><span className="eyebrow">YOUR WILDLANDS</span><h1>My decks</h1><p>Gather your favorite critters and find your next adventure.</p></div><button className="button primary" onClick={() => { setDeckName('Untitled deck'); setCreateOpen(true) }}>+ New deck</button></div>{error && <p className="error-message banner">{error}</p>}{loading ? <LoadingState label="Exploring your decks" /> : <DeckList decks={decks} onRename={rename} onDelete={setDeleteTarget} />}{createOpen && <div className="modal-backdrop" onClick={() => setCreateOpen(false)}><div className="site-modal" role="dialog" aria-modal="true" aria-labelledby="create-deck-title" onClick={(event) => event.stopPropagation()}><button className="close-button" aria-label="Close" onClick={() => setCreateOpen(false)}>x</button><span className="eyebrow">NEW DECK</span><h2 id="create-deck-title">Name your deck</h2><form className="site-modal-form" onSubmit={(event) => { void create(event) }}><label>Deck name<input autoFocus value={deckName} onChange={(event) => setDeckName(event.target.value)} /></label><div className="site-modal-actions"><button type="button" className="button ghost" onClick={() => setCreateOpen(false)}>Cancel</button><button type="submit" className="button primary">Create deck</button></div></form></div></div>}{deleteTarget && <div className="modal-backdrop" onClick={() => setDeleteTarget(null)}><div className="site-modal" role="dialog" aria-modal="true" aria-labelledby="delete-deck-title" onClick={(event) => event.stopPropagation()}><button className="close-button" aria-label="Close" onClick={() => setDeleteTarget(null)}>x</button><span className="eyebrow">RELEASE DECK</span><h2 id="delete-deck-title">Release {deleteTarget.name}?</h2><p>This cannot be undone.</p><div className="site-modal-actions"><button className="button ghost" onClick={() => setDeleteTarget(null)}>Keep deck</button><button className="button primary danger-button" onClick={() => { void remove() }}>Release deck</button></div></div></div>}</section>
}
