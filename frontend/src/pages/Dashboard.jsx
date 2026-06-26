import React, { useState, useEffect } from 'react'
import { api } from '../supabase.js'
import { useNavigate } from 'react-router-dom'

const STAGES = [
  { key: 'new', label: 'New' },
  { key: 'qualifying', label: 'Qualifying' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'viewing', label: 'Viewing' },
  { key: 'negotiating', label: 'Negotiating' }
]

const SCORE_COLOR = { hot: '#ff4d4f', warm: '#faad14', cold: '#8c8c8c' }

export function leadBadges(l) {
  const bits = []
  if (l.intent && l.intent !== 'unknown') bits.push(l.intent)
  if (l.bedrooms) bits.push(`${l.bedrooms} BR`)
  if (l.areas && l.areas.length) bits.push(l.areas.join(', '))
  if (l.budget_max) bits.push(`≤ ${Math.round(l.budget_max / 1000)}k AED`)
  if (l.timeline && l.timeline !== 'unknown') bits.push(l.timeline)
  return bits
}

export default function Dashboard() {
  const [drafts, setDrafts] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([api('/messages/drafts'), api('/leads')]).then(([d, l]) => {
      setDrafts(d); setLeads(l)
    }).finally(() => setLoading(false))
  }, [])

  const sendDraft = async (draft) => {
    try {
      await api(`/messages/drafts/${draft.id}/send`, { method: 'POST' })
      setDrafts(prev => prev.filter(d => d.id !== draft.id))
      setMsg({ type: 'green', text: `Sent to ${draft.contacts?.display_name} ✅` })
    } catch (e) { setMsg({ type: 'red', text: e.message }) }
  }
  const dismissDraft = async (draft) => {
    try {
      await api(`/messages/drafts/${draft.id}/dismiss`, { method: 'POST' })
      setDrafts(prev => prev.filter(d => d.id !== draft.id))
    } catch (e) { setMsg({ type: 'red', text: e.message }) }
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading...</div>

  const hot = leads.filter(l => l.score === 'hot')
  const qualified = leads.filter(l => ['qualified', 'viewing', 'negotiating'].includes(l.stage))
  const today = leads.filter(l => l.last_message_at && new Date(l.last_message_at).toDateString() === new Date().toDateString())

  return (
    <div>
      <div className="page-title">Pipeline</div>
      <div className="page-sub">Your leads, qualified and scored by the AI</div>

      {msg && <div className={`alert alert-${msg.type}`} onClick={() => setMsg(null)} style={{ cursor: 'pointer' }}>{msg.text}</div>}

      <div className="stats">
        <div className="stat"><div className="stat-value" style={{ color: '#ff4d4f' }}>{hot.length}</div><div className="stat-label">🔥 Hot Leads</div></div>
        <div className="stat"><div className="stat-value">{qualified.length}</div><div className="stat-label">Qualified+</div></div>
        <div className="stat"><div className="stat-value">{today.length}</div><div className="stat-label">Active Today</div></div>
        <div className="stat"><div className="stat-value">{leads.length}</div><div className="stat-label">Total Leads</div></div>
      </div>

      {/* Needs you — escalated drafts awaiting approval */}
      {drafts.length > 0 && (
        <div>
          <div className="section-label">⚡ Needs You — {drafts.length} to approve</div>
          {drafts.map(draft => (
            <DraftCard key={draft.id} draft={draft} onSend={sendDraft} onDismiss={dismissDraft} />
          ))}
        </div>
      )}

      {/* Pipeline by stage */}
      <div className="section-label" style={{ marginTop: drafts.length ? 24 : 0 }}>Pipeline</div>
      {leads.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📊</div>
          <div className="empty-title">No leads yet</div>
          <p>Put your agent number on your Bayut / Property Finder ads. Leads who message it will appear here, qualified.</p>
          <br />
          <a href="/onboarding">Complete setup →</a>
        </div>
      ) : (
        STAGES.map(stage => {
          const inStage = leads.filter(l => (l.stage || 'new') === stage.key)
          if (!inStage.length) return null
          return (
            <div key={stage.key} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                {stage.label} · {inStage.length}
              </div>
              <div className="card" style={{ padding: '0 24px' }}>
                {inStage.map(l => {
                  const badges = leadBadges(l)
                  return (
                    <div key={l.id} className="contact-row" onClick={() => navigate(`/contacts/${l.id}`)}>
                      <div className="avatar" style={{ background: SCORE_COLOR[l.score] || '#8c8c8c' }}>
                        {(l.display_name || '?')[0].toUpperCase()}
                      </div>
                      <div className="contact-info">
                        <div className="contact-name">
                          {l.display_name}
                          {l.score === 'hot' && <span style={{ marginLeft: 6 }}>🔥</span>}
                        </div>
                        <div className="contact-preview">{badges.length ? badges.join(' · ') : 'Qualifying…'}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
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
        <span className="badge badge-pending">needs approval</span>
      </div>
      <div className="draft-incoming">{draft.incoming_message || 'Lead message'}</div>
      {editing ? (
        <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3} style={{ marginBottom: 12 }} />
      ) : (
        <div className="draft-text">{draft.draft_text}</div>
      )}
      <div className="draft-actions">
        <button className="btn-primary" onClick={handleSend} disabled={sending}>{sending ? 'Sending...' : '✅ Send'}</button>
        <button className="btn-ghost" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : '✏️ Edit'}</button>
        <button className="btn-ghost" onClick={() => onDismiss(draft)}>Skip</button>
      </div>
    </div>
  )
}
