import { useState } from 'react'

import { useAuth } from '../hooks/useAuth'
import { api, apiError } from '../services/api'

const emptyCard = {
  name: '', type: 'CREATURE', set_name: '', number: '', text: '',
  color1: '', color2: '', health: '', power: '', defense: '', cost: '', image_url: '',
}

export function AdminImport() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState<'manual' | 'csv'>('manual')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string[][]>([])
  const [card, setCard] = useState(emptyCard)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (profile?.role !== 'ADMIN') return <section className="page-shell"><p className="error-message banner">Administrator access is required.</p></section>

  const clearStatus = () => { setMessage(''); setError('') }
  const selectFile = (next: File | null) => {
    setFile(next)
    clearStatus()
    if (!next) return setPreview([])
    const reader = new FileReader()
    reader.onload = () => {
      const rows = String(reader.result).split(/\r?\n/).filter(Boolean).map((row) => row.split(',').map((cell) => cell.trim()))
      setPreview(rows.slice(0, 6))
    }
    reader.onerror = () => setError('The CSV could not be read.')
    reader.readAsText(next)
  }
  const submit = async () => {
    if (!file) return
    clearStatus(); setBusy(true)
    const body = new FormData()
    body.append('file', file)
    try {
      const response = await api.post<{ imported: number }>('/admin/cards/import', body)
      setMessage(`${response.data.imported} cards imported.`)
      setFile(null); setPreview([])
    } catch (err) { setError(apiError(err)) } finally { setBusy(false) }
  }
  const updateCard = (key: keyof typeof card, value: string) => setCard((current) => ({ ...current, [key]: value }))
  const submitOne = async (event: React.FormEvent) => {
    event.preventDefault(); clearStatus(); setBusy(true)
    const body = Object.fromEntries(Object.entries(card).filter(([, value]) => value !== ''))
    try {
      const response = await api.post<{ imported: number }>('/admin/cards/import-one', body)
      setMessage(`${response.data.imported} card imported.`)
      setCard(emptyCard)
    } catch (err) { setError(apiError(err)) } finally { setBusy(false) }
  }
  const fields: Array<{ key: keyof typeof card; label: string; type?: string }> = [
    { key: 'name', label: 'Name' }, { key: 'set_name', label: 'Set name' },
    { key: 'number', label: 'Number', type: 'number' }, { key: 'health', label: 'Health', type: 'number' },
    { key: 'power', label: 'Power', type: 'number' }, { key: 'defense', label: 'Defense (required except spells)', type: 'number' }, { key: 'cost', label: 'Cost', type: 'number' },
    { key: 'image_url', label: 'Image URL' },
  ]
  return <section className="page-shell narrow">
    <div className="page-heading"><div><span className="eyebrow">ADMIN TOOLS</span><h1>Add critters</h1><p>Welcome new creatures, habitats, and treasures to the wilds.</p></div></div>
    <div className="import-box">
      <div className="import-tabs" role="tablist">
        <button className={activeTab === 'manual' ? 'active' : ''} role="tab" aria-selected={activeTab === 'manual'} onClick={() => { setActiveTab('manual'); clearStatus() }}>Manual entry</button>
        <button className={activeTab === 'csv' ? 'active' : ''} role="tab" aria-selected={activeTab === 'csv'} onClick={() => { setActiveTab('csv'); clearStatus() }}>CSV upload</button>
      </div>
      {activeTab === 'manual' ? <form className="manual-card-form" onSubmit={(event) => void submitOne(event)}>
        <div className="manual-card-grid">
          {fields.slice(0, 3).map((field) => <label key={field.key}>{field.label}<input required type={field.type ?? 'text'} value={card[field.key]} onChange={(event) => updateCard(field.key, event.target.value)} /></label>)}
          <label>Type<select value={card.type} onChange={(event) => updateCard('type', event.target.value)}><option>LEADER</option><option>CREATURE</option><option>HABITAT</option><option>TRINKET</option><option>SPELL_MAIN</option><option>SPELL_INTERUPT</option></select></label>
          <label>Color 1<select value={card.color1} onChange={(event) => updateCard('color1', event.target.value)}><option value="">None</option><option>RED</option><option>PURPLE</option><option>BLUE</option><option>GREEN</option><option>YELLOW</option></select></label>
          <label>Color 2<select value={card.color2} onChange={(event) => updateCard('color2', event.target.value)}><option value="">None</option><option>RED</option><option>PURPLE</option><option>BLUE</option><option>GREEN</option><option>YELLOW</option></select></label>
          <label className="wide-field">Card text<textarea value={card.text} onChange={(event) => updateCard('text', event.target.value)} /></label>
          {fields.slice(3).map((field) => <label key={field.key}>{field.label}<input type={field.type ?? 'text'} value={card[field.key]} onChange={(event) => updateCard(field.key, event.target.value)} /></label>)}
        </div>
        <button className="button primary" type="submit" disabled={busy}>{busy ? 'Welcoming...' : 'Welcome card'}</button>
      </form> : <div className="csv-import-panel">
        <label className="file-drop"><input type="file" accept=".csv,text/csv" onChange={(event) => selectFile(event.target.files?.[0] ?? null)} /><strong>{file ? file.name : 'Choose a creature CSV'}</strong><span>Required: name, type, habitat, number</span></label>
        {preview.length > 0 && <div className="preview-wrap"><span className="eyebrow">PREVIEW</span><table><tbody>{preview.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => rowIndex === 0 ? <th key={cellIndex}>{cell}</th> : <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>}
        <button className="button primary" disabled={!file || busy} onClick={() => void submit()}>{busy ? 'Welcoming...' : 'Validate and welcome'}</button>
      </div>}
      {error && <p className="error-message">{error}</p>}{message && <p className="success-message">{message}</p>}
    </div>
  </section>
}
