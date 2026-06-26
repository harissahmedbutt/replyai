import React, { useState, useEffect } from 'react'
import { api } from '../supabase.js'

const TOGGLES = [
  { key: 'active', label: 'Agent Active', desc: 'Master switch — turn off to pause all lead handling' },
  { key: 'auto_reply', label: 'Auto-answer routine questions', desc: 'On: the AI instantly answers routine/qualifying messages and only escalates negotiation & viewings. Off: every reply is drafted for your approval first.' },
]

export default function Settings() {
  const [settings, setSettings] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => { api('/settings').then(setSettings) }, [])

  const toggle = async (key) => {
    const updated = { ...settings, [key]: !settings[key] }
    setSettings(updated)
    setSaving(true)
    try {
      await api('/settings', { method: 'PATCH', body: JSON.stringify({ [key]: updated[key] }) })
      setMsg({ type: 'green', text: `${key.replace(/_/g, ' ')} ${updated[key] ? 'enabled' : 'disabled'}` })
    } catch (e) { setMsg({ type: 'red', text: e.message }) }
    setSaving(false)
  }

  if (!settings) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading...</div>

  return (
    <div>
      <div className="page-title">Settings</div>
      <div className="page-sub">Control how your agent behaves</div>

      {msg && <div className={`alert alert-${msg.type}`} onClick={() => setMsg(null)} style={{ cursor: 'pointer' }}>{msg.text}</div>}

      <div className="card">
        {TOGGLES.map(({ key, label, desc }) => (
          <div key={key} className="toggle">
            <div className="toggle-info">
              <strong>{label}</strong>
              <span>{desc}</span>
            </div>
            <button
              className={`toggle-switch ${settings[key] ? 'on' : ''}`}
              onClick={() => toggle(key)}
              disabled={saving}
              aria-label={label}
            />
          </div>
        ))}
      </div>

      <div className="card">
        <div className="section-label">Draft Expiry</div>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 12 }}>
          Pending drafts expire after this many minutes if not actioned.
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="number"
            value={settings.draft_expiry_mins || 30}
            onChange={e => setSettings(prev => ({ ...prev, draft_expiry_mins: parseInt(e.target.value) }))}
            style={{ width: 100 }}
            min={5} max={1440}
          />
          <span style={{ color: 'var(--muted)' }}>minutes</span>
          <button className="btn-primary" disabled={saving} onClick={() => api('/settings', { method: 'PATCH', body: JSON.stringify({ draft_expiry_mins: settings.draft_expiry_mins }) }).then(() => setMsg({ type: 'green', text: 'Saved.' }))}>
            Save
          </button>
        </div>
      </div>

      <div className="card">
        <div className="section-label">WhatsApp Commands</div>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 12 }}>
          Send these to your ReplyAI control number to manage the agent from WhatsApp:
        </p>
        <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: 2.2, color: 'var(--muted)' }}>
          {[
            ['ok', 'Send the latest escalated draft to the lead'],
            ['ok [name]', 'Send the draft for a specific lead'],
            ['edit [text]', 'Replace the draft with your text and send'],
            ['skip', 'Dismiss the latest draft'],
            ['hot leads', 'List your hot leads'],
            ['new leads / today', "Leads that came in today"],
            ['leads in [area]', 'Leads interested in an area, e.g. leads in JVC'],
            ['follow ups', 'Leads still being qualified'],
            ['summarize [name]', 'Full summary of a lead + best next action'],
            ['auto on / auto off', 'Toggle approve-everything mode'],
            ['pause / resume', 'Stop or restart the agent'],
          ].map(([cmd, desc]) => (
            <div key={cmd} style={{ display: 'flex', gap: 20 }}>
              <span style={{ color: 'var(--accent)', minWidth: 140 }}>{cmd}</span>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
