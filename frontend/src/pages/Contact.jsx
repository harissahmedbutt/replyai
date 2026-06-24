import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../supabase.js'

export default function Contact() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [contact, setContact] = useState(null)
  const [messages, setMessages] = useState([])
  const [notes, setNotes] = useState('')
  const [summarizing, setSummarizing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    Promise.all([api('/contacts'), api(`/contacts/${id}/messages`)]).then(([contacts, msgs]) => {
      const c = contacts.find(x => x.id === id)
      setContact(c); setNotes(c?.notes || ''); setMessages(msgs)
    })
  }, [id])

  const saveNotes = async () => {
    setSaving(true)
    await api(`/contacts/${id}`, { method: 'PATCH', body: JSON.stringify({ notes }) })
    setSaving(false)
    setMsg({ type: 'green', text: 'Notes saved.' })
  }

  const buildSummary = async () => {
    setSummarizing(true)
    try {
      const res = await api(`/contacts/${id}/summarize`, { method: 'POST' })
      setContact(prev => ({ ...prev, profile_summary: res.summary }))
      setMsg({ type: 'green', text: 'Summary updated.' })
    } catch (e) { setMsg({ type: 'red', text: e.message }) }
    setSummarizing(false)
  }

  if (!contact) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading...</div>

  return (
    <div>
      <button className="btn-ghost" onClick={() => navigate('/contacts')} style={{ marginBottom: 20, fontSize: '0.82rem' }}>← Back</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <div className="avatar" style={{ width: 52, height: 52, fontSize: '1.3rem' }}>
          {(contact.display_name || '?')[0].toUpperCase()}
        </div>
        <div>
          <div className="page-title" style={{ marginBottom: 0 }}>{contact.display_name}</div>
          <div style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{contact.wa_id}</div>
        </div>
      </div>

      {msg && <div className={`alert alert-${msg.type}`} onClick={() => setMsg(null)} style={{ cursor: 'pointer' }}>{msg.text}</div>}

      {/* Summary */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="section-label" style={{ marginBottom: 0 }}>AI Summary</div>
          <button className="btn-ghost" style={{ fontSize: '0.78rem', padding: '5px 12px' }} onClick={buildSummary} disabled={summarizing}>
            {summarizing ? 'Building...' : '↻ Rebuild'}
          </button>
        </div>
        <p style={{ color: contact.profile_summary ? 'var(--text)' : 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
          {contact.profile_summary || 'No summary yet. Click Rebuild to generate one from the conversation history.'}
        </p>
      </div>

      {/* Notes */}
      <div className="card">
        <div className="section-label">Your Notes</div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          placeholder="Who is this person? Context about your relationship, what they care about, anything the agent should know..."
          style={{ marginBottom: 12 }}
        />
        <button className="btn-primary" onClick={saveNotes} disabled={saving}>
          {saving ? 'Saving...' : 'Save Notes'}
        </button>
      </div>

      {/* Message history */}
      <div className="section-label">Message History ({messages.length})</div>
      <div className="card" style={{ padding: '8px 16px', maxHeight: 500, overflowY: 'auto' }}>
        {messages.length === 0 ? (
          <div style={{ padding: '20px 0', color: 'var(--muted)', textAlign: 'center' }}>No messages yet</div>
        ) : (
          messages.map(m => (
            <div key={m.id} style={{
              padding: '8px 0',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start'
            }}>
              <span style={{ color: m.direction === 'outbound' ? 'var(--accent)' : 'var(--muted)', fontSize: '0.75rem', fontWeight: 700, width: 50, flexShrink: 0, paddingTop: 2 }}>
                {m.direction === 'outbound' ? 'You' : contact.display_name?.split(' ')[0]}
              </span>
              <span style={{ flex: 1, fontSize: '0.88rem', lineHeight: 1.6 }}>{m.body}</span>
              <span style={{ color: 'var(--muted)', fontSize: '0.75rem', flexShrink: 0 }}>
                {new Date(m.timestamp).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
