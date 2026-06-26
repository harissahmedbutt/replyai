import React, { useState, useEffect } from 'react'
import { api } from '../supabase.js'

export default function Persona() {
  const [form, setForm] = useState({
    agent_name: '', agency_name: '', areas_served: '', working_hours: '',
    tone: '', greeting: '', specialties: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    api('/agency').then(a => {
      if (a) setForm({
        agent_name: a.agent_name || '',
        agency_name: a.agency_name || '',
        areas_served: (a.areas_served || []).join(', '),
        working_hours: a.working_hours || '',
        tone: a.tone || '',
        greeting: a.greeting || '',
        specialties: a.specialties || ''
      })
    }).finally(() => setLoading(false))
  }, [])

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true); setMsg(null)
    try {
      await api('/agency', {
        method: 'PUT',
        body: JSON.stringify({
          ...form,
          areas_served: form.areas_served.split(',').map(s => s.trim()).filter(Boolean)
        })
      })
      setMsg({ type: 'green', text: '✅ Business profile saved. Your AI now answers in this voice.' })
    } catch (e) { setMsg({ type: 'red', text: e.message }) }
    setSaving(false)
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading...</div>

  return (
    <div>
      <div className="page-title">Business Profile</div>
      <div className="page-sub">This is what your AI uses to qualify leads and reply in your voice.</div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <form onSubmit={save}>
        <div className="card">
          <div className="form-group">
            <label>Your name</label>
            <input value={form.agent_name} onChange={e => set('agent_name', e.target.value)} placeholder="e.g. Hariss" />
          </div>
          <div className="form-group">
            <label>Agency name</label>
            <input value={form.agency_name} onChange={e => set('agency_name', e.target.value)} placeholder="e.g. Prime Dubai Realty" />
          </div>
          <div className="form-group">
            <label>Areas you serve</label>
            <input value={form.areas_served} onChange={e => set('areas_served', e.target.value)} placeholder="Dubai Marina, JLT, JVC, Downtown, Business Bay" />
            <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: 4 }}>Comma-separated</div>
          </div>
          <div className="form-group">
            <label>Specialties</label>
            <input value={form.specialties} onChange={e => set('specialties', e.target.value)} placeholder="e.g. Rentals and sales of apartments in Marina" />
          </div>
          <div className="form-group">
            <label>Working hours</label>
            <input value={form.working_hours} onChange={e => set('working_hours', e.target.value)} placeholder="e.g. 9am–9pm daily" />
          </div>
          <div className="form-group">
            <label>Tone</label>
            <input value={form.tone} onChange={e => set('tone', e.target.value)} placeholder="e.g. friendly, professional, and quick" />
          </div>
          <div className="form-group">
            <label>Custom greeting (optional)</label>
            <textarea value={form.greeting} onChange={e => set('greeting', e.target.value)} rows={2}
              placeholder="How the AI should greet a brand-new lead. Leave blank for a natural default." />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Business Profile'}</button>
        </div>
      </form>

      <div className="card" style={{ background: '#ffffff05' }}>
        <div className="section-label">How the AI uses this</div>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.7 }}>
          Every incoming lead is greeted in your voice, qualified for intent, area, budget (AED), bedrooms,
          and timeline, and answered on routine questions automatically. Negotiation and viewing
          confirmations are escalated to you to approve on WhatsApp.
        </p>
      </div>
    </div>
  )
}
