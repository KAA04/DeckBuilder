import { useState } from 'react'

import { useAuth } from '../hooks/useAuth'
import { api, apiError } from '../services/api'

export function AdminImport() {
  const { profile } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string[][]>([])
  const [card, setCard] = useState({
    name: '', type: 'CREATURE', set_name: '', numer: '', text: '',
    color1: '', color2: '', health: '', power: '', defense: '', image_url: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  if (profile?.role !== 'ADMIN') return <section className="page-shell"><p className="error-message banner">Administrator access is required.</p></section>
  const selectFile = (next: File | null) => { setFile(next); setMessage(''); setError(''); if (!next) return setPreview([]); const reader = new FileReader(); reader.onload = () => { const rows = String(reader.result).split(/\r?\n/).filter(Boolean).map((row) => row.split(',').map((cell) => cell.trim())); setPreview(rows.slice(0, 6)) }; reader.readAsText(next) }
  const submit = async () => { if (!file) return; setMessage(''); setError(''); const body = new FormData(); body.append('file', file); try { const response = await api.post<{ imported: number }>('/admin/cards/import', body); setMessage(`${response.data.imported} cards imported.`); setFile(null); setPreview([]) } catch (err) { setError(apiError(err)) } }
  const updateCard = (key: keyof typeof card, value: string) => setCard((current) => ({ ...current, [key]: value }))
  const submitOne = async (event: React.FormEvent) => {
    event.preventDefault(); setMessage(''); setError('')
    const body = Object.fromEntries(Object.entries(card).filter(([, value]) => value !== ''))
    try {
      const response = await api.post<{ imported: number }>('/admin/cards/import-one', body)
      setMessage(`${response.data.imported} card imported.`)
      setCard({ name: '', type: 'CREATURE', set_name: '', numer: '', text: '', color1: '', color2: '', health: '', power: '', defense: '', image_url: '' })
    } catch (err) { setError(apiError(err)) }
  }
  const fields: Array<{ key: keyof typeof card; label: string; type?: string }> = [
    { key: 'name', label: 'Name' }, { key: 'set_name', label: 'Set name' },
    { key: 'numer', label: 'Number', type: 'number' }, { key: 'text', label: 'Card text' },
    { key: 'health', label: 'Health', type: 'number' }, { key: 'power', label: 'Power', type: 'number' },
    { key: 'defense', label: 'Defense', type: 'number' }, { key: 'image_url', label: 'Image URL' },
  ]
  return <section className="page-shell narrow"><div className="page-heading"><div><span className="eyebrow">ADMIN TOOLS</span><h1>Import cards</h1><p>Bring cards into the database by CSV or one at a time.</p></div></div><div className="import-box"><h2>Manual card entry</h2><form className="manual-card-form" onSubmit={(event) => void submitOne(event)}><div className="manual-card-grid">{fields.slice(0, 3).map((field) => <label key={field.key}>{field.label}<input required type={field.type ?? 'text'} value={card[field.key]} onChange={(event) => updateCard(field.key, event.target.value)} /></label>)}<label>Type<select value={card.type} onChange={(event) => updateCard('type', event.target.value)}><option>LEADER</option><option>CREATURE</option><option>HABITAT</option><option>TRINKET</option><option>SPELL_MAIN</option><option>SPELL_INTERUPT</option></select></label><label>Color 1<select value={card.color1} onChange={(event) => updateCard('color1', event.target.value)}><option value="">None</option><option>RED</option><option>PURPLE</option><option>BLUE</option><option>GREEN</option><option>YELLOW</option></select></label><label>Color 2<select value={card.color2} onChange={(event) => updateCard('color2', event.target.value)}><option value="">None</option><option>RED</option><option>PURPLE</option><option>BLUE</option><option>GREEN</option><option>YELLOW</option></select></label><label className="wide-field">Card text<textarea value={card.text} onChange={(event) => updateCard('text', event.target.value)} /></label>{fields.slice(4).map((field) => <label key={field.key}>{field.label}<input type={field.type ?? 'text'} value={card[field.key]} onChange={(event) => updateCard(field.key, event.target.value)} /></label>)}</div><button className="button primary" type="submit">Add card</button></form><hr /><h2>CSV import</h2><label className="file-drop"><input type="file" accept=".csv,text/csv" onChange={(event) => selectFile(event.target.files?.[0] ?? null)} /><strong>{file ? file.name : 'Choose a CSV file'}</strong><span>Required: name, type, set_name, numer</span></label>{preview.length > 0 && <div className="preview-wrap"><span className="eyebrow">PREVIEW</span><table><tbody>{preview.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => rowIndex === 0 ? <th key={cellIndex}>{cell}</th> : <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>}{error && <p className="error-message">{error}</p>}{message && <p className="success-message">{message}</p>}<button className="button primary" disabled={!file} onClick={() => void submit()}>Validate and import</button></div></section>
}
