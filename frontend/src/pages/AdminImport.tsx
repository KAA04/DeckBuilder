import { useState } from 'react'

import { useAuth } from '../hooks/useAuth'
import { api, apiError } from '../services/api'

export function AdminImport() {
  const { profile } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string[][]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  if (profile?.role !== 'ADMIN') return <section className="page-shell"><p className="error-message banner">Administrator access is required.</p></section>
  const selectFile = (next: File | null) => { setFile(next); setMessage(''); setError(''); if (!next) return setPreview([]); const reader = new FileReader(); reader.onload = () => { const rows = String(reader.result).split(/\r?\n/).filter(Boolean).map((row) => row.split(',').map((cell) => cell.trim())); setPreview(rows.slice(0, 6)) }; reader.readAsText(next) }
  const submit = async () => { if (!file) return; setMessage(''); setError(''); const body = new FormData(); body.append('file', file); try { const response = await api.post<{ imported: number }>('/admin/cards/import', body); setMessage(`${response.data.imported} cards imported.`); setFile(null); setPreview([]) } catch (err) { setError(apiError(err)) } }
  return <section className="page-shell narrow"><div className="page-heading"><div><span className="eyebrow">ADMIN TOOLS</span><h1>Import cards</h1><p>Bring a validated CSV into the card database.</p></div></div><div className="import-box"><label className="file-drop"><input type="file" accept=".csv,text/csv" onChange={(event) => selectFile(event.target.files?.[0] ?? null)} /><strong>{file ? file.name : 'Choose a CSV file'}</strong><span>Required: name, type, set_name, numer</span></label>{preview.length > 0 && <div className="preview-wrap"><span className="eyebrow">PREVIEW</span><table><tbody>{preview.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => rowIndex === 0 ? <th key={cellIndex}>{cell}</th> : <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>}{error && <p className="error-message">{error}</p>}{message && <p className="success-message">{message}</p>}<button className="button primary" disabled={!file} onClick={() => void submit()}>Validate and import</button></div></section>
}
