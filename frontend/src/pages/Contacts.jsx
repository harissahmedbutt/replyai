import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../supabase.js'
import { leadBadges, SCORE_COLOR } from './Dashboard.jsx'
import { Icon } from '../components/icons.jsx'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'hot', label: 'Hot' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'new', label: 'New' }
]

export default function Contacts() {
  const [leads, setLeads] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { api('/leads').then(setLeads).finally(() => setLoading(false)) }, [])

  let filtered = leads.filter(c => c.display_name?.toLowerCase().includes(search.toLowerCase()))
  if (filter === 'hot') filtered = filtered.filter(l => l.score === 'hot')
  else if (filter === 'qualified') filtered = filtered.filter(l => ['qualified', 'viewing', 'negotiating'].includes(l.stage))
  else if (filter === 'new') filtered = filtered.filter(l => (l.stage || 'new') === 'new')

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading...</div>

  return (
    <div>
      <div className="page-title">Leads</div>
      <div className="page-sub">{leads.length} leads · click to view the conversation and qualification</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className="btn-ghost"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 20, fontSize: '0.82rem',
              background: filter === f.key ? 'var(--accent)' : 'var(--surface)',
              borderColor: filter === f.key ? 'var(--accent)' : 'var(--border)',
              color: filter === f.key ? '#fff' : 'var(--text-2)' }}>
            {f.key === 'hot' && <Icon name="flame" size={12} fill={filter === f.key ? '#fff' : '#e5484d'} />}
            {f.label}
          </button>
        ))}
      </div>

      <div className="form-group" style={{ marginBottom: 20 }}>
        <input placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon"><Icon name="users" size={40} color="var(--muted)" strokeWidth={1.4} /></div>
          <div className="empty-title">No leads here</div>
          <p>Leads appear when people message your agent number.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: '0 24px' }}>
          {filtered.map(l => {
            const badges = leadBadges(l)
            return (
              <div key={l.id} className="contact-row" onClick={() => navigate(`/contacts/${l.id}`)}>
                <div className="avatar" style={{ background: SCORE_COLOR[l.score] || '#8b909a' }}>
                  {(l.display_name || '?')[0].toUpperCase()}
                </div>
                <div className="contact-info">
                  <div className="contact-name">
                    {l.display_name}{l.score === 'hot' && <Icon name="flame" size={13} fill="#e5484d" style={{ marginLeft: 6, verticalAlign: '-2px' }} />}
                  </div>
                  <div className="contact-preview">{badges.length ? badges.join(' · ') : 'Qualifying…'}</div>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '0.72rem', textAlign: 'right' }}>
                  <div style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{l.stage || 'new'}</div>
                  {l.last_message_at && <div>{new Date(l.last_message_at).toLocaleDateString()}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
