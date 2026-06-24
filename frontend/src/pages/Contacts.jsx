import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../supabase.js'

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { api('/contacts').then(setContacts).finally(() => setLoading(false)) }, [])

  const filtered = contacts.filter(c =>
    c.display_name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading...</div>

  return (
    <div>
      <div className="page-title">Contacts</div>
      <div className="page-sub">{contacts.length} contacts · click to view history and add notes</div>

      <div className="form-group" style={{ marginBottom: 20 }}>
        <input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">👥</div>
          <div className="empty-title">No contacts yet</div>
          <p>Contacts appear when people message your agent number or when you import chat exports.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: '0 24px' }}>
          {filtered.map(c => (
            <div key={c.id} className="contact-row" onClick={() => navigate(`/contacts/${c.id}`)}>
              <div className="avatar">{(c.display_name || '?')[0].toUpperCase()}</div>
              <div className="contact-info">
                <div className="contact-name">{c.display_name}</div>
                <div className="contact-preview">{c.profile_summary?.slice(0, 100) || c.notes || 'No notes yet'}</div>
              </div>
              {c.last_message_at && (
                <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>
                  {new Date(c.last_message_at).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
