import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase.js'

export default function Layout({ children }) {
  const navigate = useNavigate()

  const signOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">ReplyAI</div>
        <nav>
          <NavLink to="/">💬 Dashboard</NavLink>
          <NavLink to="/contacts">👥 Contacts</NavLink>
          <NavLink to="/persona">🧠 Persona</NavLink>
          <NavLink to="/settings">⚙️ Settings</NavLink>
          <NavLink to="/onboarding">🔌 Setup</NavLink>
        </nav>
        <div style={{ marginTop: 'auto', padding: '20px' }}>
          <button className="btn-ghost" onClick={signOut} style={{ width: '100%' }}>Sign out</button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  )
}
