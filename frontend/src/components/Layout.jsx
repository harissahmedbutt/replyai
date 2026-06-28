import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase.js'

const ic = {
  pipeline: <path d="M3 3v18h18M8 17V9m5 8V5m5 12v-6" />,
  leads: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m13 10v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />,
  profile: <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01" />,
  settings: <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />,
  setup: <path d="M14.7 6.3a4 4 0 0 1-5.6 5.6L3 18v3h3l6.1-6.1a4 4 0 0 0 5.6-5.6l-2.5 2.5-2.5-2.5z" />
}

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {d}
    </svg>
  )
}

export default function Layout({ children }) {
  const navigate = useNavigate()

  const signOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-mark">R</span>
          ReplyAI
        </div>
        <nav>
          <NavLink to="/"><Icon d={ic.pipeline} />Pipeline</NavLink>
          <NavLink to="/contacts"><Icon d={ic.leads} />Leads</NavLink>
          <NavLink to="/persona"><Icon d={ic.profile} />Business Profile</NavLink>
          <NavLink to="/settings"><Icon d={ic.settings} />Settings</NavLink>
          <NavLink to="/onboarding"><Icon d={ic.setup} />Setup</NavLink>
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: 20 }}>
          <button className="btn-ghost" onClick={signOut} style={{ width: '100%' }}>Sign out</button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  )
}
