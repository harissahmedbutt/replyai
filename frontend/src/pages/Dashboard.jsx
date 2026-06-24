import React, { useState, useEffect } from 'react'
import { api } from '../supabase.js'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [drafts, setDrafts] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([api('/messages/drafts'), api('/contacts')]).then(([d, c]) => {
      setDrafts(d); setContacts(c)
    }).finally(() => setLoading(false))
  }, [])

  const sendDraft = async (draft) => {
    try {
      await api(`/messages/drafts/${draft.id}/send`, { method: 'POST' })
      setDrafts(prev => prev.filter(d => d.id !== draft.id))
      setMsg({ type: 'green', text: `Sent to ${draft.contacts.display_name} ✅` })
    } catch (e) { setMsg({ type: 'red', text: e.message }) }
  }

  const dismissDraft = async (draft) => {
    try {
      await api(`/messages/drafts/${draft.id}/dismiss`, { method: 'POST' })
      setDrafts(prev => prev.filter(d => d.id !== draft.id))
    } catch (e) { setMsg({ type: 'red', text: e.message }) }
  }

  const recentContacts = contacts.slice(0, 8)

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading...</div>

  return (
    <div>
      <div className="page-title">Dashboard</div>
      <div className="page-sub">Your pending drafts and recent conversations</div>

      {msg && <div className={`alert alert-${msg.type}`} onClick={() => setMsg(null)} style={{ cursor: 'pointer' }}>{msg.text}</div>}

      <div className="stats">
        <div className="stat">
          <div className="stat-value">{drafts.length}</div>
          <div className="stat-label">Pending Drafts</div>
        </div>
        <div className="stat">
          <div className="stat-value">{contacts.length}</div>
          <div className="stat-label">Total Contacts</div>
        </div>
      </div>

      {/* Pending drafts */}
      {drafts.length > 0 && (
        <div>
          <div className="section-label">Pending Drafts</div>
          {drafts.map(draft => (
            <DraftCard key={draft.id} draft={draft} onSend={sendDraft} onDismiss={dismissDraft} />
          ))}
        </div>
      )}

      {/* Recent contacts */}
      <div className="section-label" style={{ marginTop: drafts.length ? 24 : 0 }}>Recent Conversations</div>
      {recentContacts.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">💬</div>
          <div className="empty-title">No conversations yet</div>
          <p>Once contacts message your agent number, they'll appear here.</p>
          <br />
          <a href="/onboarding">Complete setup →</a>
        </div>
      ) : (
        <div className="card" style={{ padding: '0 24px' }}>
          {recentContacts.map(c => (
            <div key={c.id} className="contact-row" onClick={() => navigate(`/contacts/${c.id}`)}>
              <div className="avatar">{(c.display_name || '?')[0].toUpperCase()}</div>
              <div className="contact-info">
                <div className="contact-name">{c.display_name}</div>
                <div className="contact-preview">{c.profile_summary?.slice(0, 80) || 'No summary yet'}</div>
              </div>
              {c.last_message_at && (
                <div style={{ color: 'var(--muted)', fontSize: '0.78rem', flex: 'shrink 0' }}>
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

function DraftCard({ draft, onSend, onDismiss }) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(draft.draft_text)
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    setSending(true)
    await onSend({ ...draft, draft_text: editText })
    setSending(false)
  }

  return (
    <div className="draft-card">
      <div className="draft-card-header">
        <div className="draft-contact">{draft.contacts?.display_name}</div>
        <span className="badge badge-pending">pending</span>
      </div>
      <div className="draft-incoming">{draft.incoming_message || 'Incoming message'}</div>
      {editing ? (
        <textarea
          value={editText}
          onChange={e => setEditText(e.target.value)}
          rows={3}
          style={{ marginBottom: 12 }}
        />
      ) : (
        <div className="draft-text">{draft.draft_text}</div>
      )}
      <div className="draft-actions">
        <button className="btn-primary" onClick={handleSend} disabled={sending}>
          {sending ? 'Sending...' : '✅ Send'}
        </button>
        <button className="btn-ghost" onClick={() => setEditing(!editing)}>
          {editing ? 'Cancel' : '✏️ Edit'}
        </button>
        <button className="btn-ghost" onClick={() => onDismiss(draft)}>Skip</button>
      </div>
    </div>
  )
}
