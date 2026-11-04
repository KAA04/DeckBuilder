import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { NavBar } from './components/NavBar'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './hooks/useAuth'
import { AdminImport } from './pages/AdminImport'
import { AdminRemove } from './pages/AdminRemove'
import { DeckBuilder } from './pages/DeckBuilder'
import { DeckHome } from './pages/DeckHome'
import { Login } from './pages/Login'
import { Register } from './pages/Register'

function AppShell() {
  return <><NavBar /><main className="app-main"><Routes><Route path="/decks" element={<DeckHome />} /><Route path="/decks/:deckId" element={<DeckBuilder />} /><Route path="/admin/import" element={<AdminImport />} /><Route path="/admin/remove" element={<AdminRemove />} /></Routes></main></>
}

export default function App() {
  return <BrowserRouter><AuthProvider><Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route element={<ProtectedRoute />}><Route element={<AppShell />}><Route path="*" element={<Navigate to="/decks" replace />} /></Route></Route>
  </Routes></AuthProvider></BrowserRouter>
}
