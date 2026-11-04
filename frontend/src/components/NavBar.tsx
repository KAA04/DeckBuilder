import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'

export function NavBar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const logout = async () => {
    await signOut()
    navigate('/login')
  }
  return <header className="topbar">
    <Link to="/decks" className="brand"><span className="brand-mark">CF</span><span>Critter Forge</span></Link>
    <nav className="nav-links">
      <Link to="/decks">My decks</Link>
      {profile?.role === 'ADMIN' && <Link to="/admin/import">Add critters</Link>}
      {profile?.role === 'ADMIN' && <Link to="/admin/remove">Manage cards</Link>}
    </nav>
    <div className="account"><span>{profile?.username ?? 'Account'}</span><button className="button ghost small" onClick={logout}>Log out</button></div>
  </header>
}
