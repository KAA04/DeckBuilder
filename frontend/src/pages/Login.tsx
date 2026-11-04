import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { usernameToAuthEmail } from '../services/auth'
import { supabase } from '../services/supabase'

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({ email: usernameToAuthEmail(username), password })
    setBusy(false)
    if (authError) setError(authError.message)
    else navigate((location.state as { from?: string } | null)?.from ?? '/decks')
  }
  return <AuthLayout title="Welcome back" eyebrow="SIGN IN"><form onSubmit={submit} className="auth-form"><label>Username<input required value={username} onChange={(event) => setUsername(event.target.value)} /></label><label>Password<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="error-message">{error}</p>}<button className="button primary full" disabled={busy}>{busy ? 'Signing in...' : 'Enter the forge'}</button></form><p className="auth-switch">New to Cardforge? <Link to="/register">Create an account</Link></p></AuthLayout>
}

export function AuthLayout({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return <div className="auth-page"><div className="auth-aside"><span className="brand-mark large">CF</span><p className="eyebrow">A TABLE FOR EVERY STRATEGY</p><h1>Build the deck<br /><em>you meant to play.</em></h1><p className="aside-note">Search your collection, find the line, and keep every choice close at hand.</p></div><div className="auth-panel"><Link to="/login" className="brand"><span className="brand-mark">CF</span><span>Cardforge</span></Link><div className="auth-content"><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{children}</div></div></div>
}
