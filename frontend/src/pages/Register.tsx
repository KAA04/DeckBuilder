import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { AuthLayout } from './Login'
import { api, apiError } from '../services/api'
import { normalizeUsername, usernameToAuthEmail } from '../services/auth'
import { supabase } from '../services/supabase'

export function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setMessage('')
    const username = normalizeUsername(form.username)
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    if (form.password.length < 8) return setError('Use at least 8 characters for your password.')
    setBusy(true)
    try {
      await api.post('/auth/register', { username, password: form.password })
      const { error: authError } = await supabase.auth.signInWithPassword({ email: usernameToAuthEmail(username), password: form.password })
      if (authError) setError(authError.message)
      else navigate('/decks')
    } catch (requestError) {
      setError(apiError(requestError))
    } finally {
      setBusy(false)
    }
  }
  const update = (key: keyof typeof form, value: string) => setForm({ ...form, [key]: value })
  return <AuthLayout title="Make your mark" eyebrow="JOIN THE DEN"><form onSubmit={submit} className="auth-form"><label>Creature name<input required value={form.username} onChange={(event) => update('username', event.target.value)} /></label><div className="two-up"><label>Secret password<input type="password" required value={form.password} onChange={(event) => update('password', event.target.value)} /></label><label>Repeat password<input type="password" required value={form.confirm} onChange={(event) => update('confirm', event.target.value)} /></label></div>{error && <p className="error-message">{error}</p>}{message && <p className="success-message">{message}</p>}<button className="button primary full" disabled={busy}>{busy ? 'Joining the den...' : 'Create my den'}</button></form><p className="auth-switch">Already part of the den? <Link to="/login">Enter the wilds</Link></p></AuthLayout>
}
