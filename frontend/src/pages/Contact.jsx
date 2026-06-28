import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../supabase.js'
import { SCORE_COLOR } from './Dashboard.jsx'
import { Icon } from '../components/icons.jsx'

const STAGES = ['new', 'qualifying', 'qualified', 'viewing', 'negotiating', 'won', 'lost']

function fmtBudget(l) {
  if (!l.budget_min && !l.budget_max) return '—'
  const k = v => v ? `${Math.round(v / 1000)}k` : '?'
  return `${k(l.budget_min)}–${k(l.budget_max)} AED`
}

export default function Contact() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lead, setLead] = useState(null)
  const [messages, setMessages] = useState([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [summarizing, setSummarizing] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    api(`/leads/${id}`).then(({ lead, messages }) => {
      setLead(lead); setNotes(lead?.notes || ''); setMessages(messages)
    }).catch(e => setMsg({ type: 'red', text: e.message }))
  }, [id])

  const patch = async (fields) => {
    const updated = await api(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(fields) })
    setLead(prev => ({ ...prev, ...updated }))
  }
  const saveNotes = async () => {
    setSaving(true)
    try { await patch({ notes }); setMsg({ type: 'green', text: 'Notes saved.' }) }
    catch (e) { setMsg({ type: 'red', text: e.message }) }
    setSaving(false)
  }
  const changeStage = async (stage) => {
    try { await patch({ stage }); setMsg({ type: 'green', text: `Moved to ${stage}.` }) }
    catch (e) { setMsg({ type: 'red', text: e.message }) }
  }
  const buildSummary = async () => {
    setSummarizing(true)
    try {
      const res = await api(`/leads/${id}/summarize`, { method: 'POST' })
      setLead(prev => ({ ...prev, profile_summary: res.summary }))
      setMsg({ type: 'green', text: 'Summary updated.' })
    } catch (e) { setMsg({ type: 'red', text: e.message }) }
    setSummarizing(false)
  }

  if (!lead) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading...</div>

  const qual = [
    ['Intent', lead.intent && lead.intent !== 'unknown' ? lead.intent : '—'],
    ['Budget', fmtBudget(lead)],
    ['Area', lead.areas && lead.areas.length ? lead.areas.join(', ') : '—'],
    ['Bedrooms', lead.bedrooms || '—'],
    ['Timeline', lead.timeline && lead.timeline !== 'unknown' ? lead.timeline : '—'],
    ['Purpose', lead.purpose && lead.purpose !== 'unknown' ? lead.purpose : '—']
  ]

  return (
    <div>
      <button className="btn-ghost" onClick={() => navigate('/contacts')} style={{ marginBottom: 20, fontSize: '0.82rem' }}>← Back to leads</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div className="avatar" style={{ width: 52, height: 52, fontSize: '1.3rem', background: SCORE_COLOR[lead.score] || '#8b909a' }}>
          {(lead.display_name || '?')[0].toUpperCase()}
        </div>
        <div>
          <div className="page-title" style={{ marginBottom: 0 }}>
            {lead.display_name} {lead.score === 'hot' && <Icon name="flame" size={20} fill="#e5484d" style={{ verticalAlign: '-2px' }} />}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{lead.wa_id} · score: {lead.score || 'cold'}</div>
        </div>
      </div>

      {msg && <div className={`alert alert-${msg.type}`} onClick={() => setMsg(null)} style={{ cursor: 'pointer' }}>{msg.text}</div>}

      {/* Stage control */}
      <div className="card">
        <div className="section-label">Pipeline Stage</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STAGES.map(s => (
            <button key={s} onClick={() => changeStage(s)} className="btn-ghost"
              style={{ padding: '6px 12px', borderRadius: 16, fontSize: '0.78rem', textTransform: 'capitalize',
                background: (lead.stage || 'new') === s ? 'var(--accent)' : 'var(--surface)',
                borderColor: (lead.stage || 'new') === s ? 'var(--accent)' : 'var(--border)',
                color: (lead.stage || 'new') === s ? '#fff' : 'var(--text-2)' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Qualification */}
      <div className="card">
        <div className="section-label">Qualification</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {qual.map(([k, v]) => (
            <div key={k}>
              <div style={{ color: 'var(--muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{k}</div>
              <div style={{ fontSize: '0.92rem', textTransform: 'capitalize' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div className="section-label" style={{ marginBottom: 0 }}>AI Summary</div>
          <button className="btn-ghost" style={{ fontSize: '0.78rem', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={buildSummary} disabled={summarizing}>
            {summarizing ? 'Building...' : <><Icon name="refresh" size={13} />Rebuild</>}
          </button>
        </div>
        <p style={{ color: lead.profile_summary ? 'var(--text)' : 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
          {lead.profile_summary || 'No summary yet. Click Rebuild to generate one from the conversation.'}
        </p>
      </div>

      {/* Notes */}
      <div className="card">
        <div className="section-label">Your Notes</div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          placeholder="Anything to remember about this lead..." style={{ marginBottom: 12 }} />
        <button className="btn-primary" onClick={saveNotes} disabled={saving}>{saving ? 'Saving...' : 'Save Notes'}</button>
      </div>

      {/* Conversation */}
      <div className="section-label">Conversation ({messages.length})</div>
      <div className="card" style={{ padding: '8px 16px', maxHeight: 500, overflowY: 'auto' }}>
        {messages.length === 0 ? (
          <div style={{ padding: '20px 0', color: 'var(--muted)', textAlign: 'center' }}>No messages yet</div>
        ) : (
          messages.map(m => (
            <div key={m.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ color: m.direction === 'outbound' ? 'var(--accent)' : 'var(--muted)', fontSize: '0.75rem', fontWeight: 700, width: 44, flexShrink: 0, paddingTop: 2 }}>
                {m.direction === 'outbound' ? 'AI' : 'Lead'}
              </span>
              <span style={{ flex: 1, fontSize: '0.88rem', lineHeight: 1.6 }}>{m.body}</span>
              <span style={{ color: 'var(--muted)', fontSize: '0.75rem', flexShrink: 0 }}>{new Date(m.timestamp).toLocaleDateString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
