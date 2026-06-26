import React, { useState, useEffect } from 'react'
import { api } from '../supabase.js'

export default function Onboarding({ onProfileChange }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [provisioning, setProvisioning] = useState(false)
  const [msg, setMsg] = useState(null)
  const [number, setNumber] = useState('')
  const [savingNumber, setSavingNumber] = useState(false)

  const loadStatus = () => api('/onboarding/status').then(setStatus)

  useEffect(() => { loadStatus().finally(() => setLoading(false)) }, [])

  const savePersonalNumber = async e => {
    e.preventDefault()
    setSavingNumber(true); setMsg(null)
    try {
      await api('/onboarding/personal-number', {
        method: 'POST',
        body: JSON.stringify({ number })
      })
      await loadStatus()
      onProfileChange && onProfileChange()
      setMsg({ type: 'green', text: '✅ WhatsApp number saved.' })
    } catch (e) {
      setMsg({ type: 'red', text: e.message })
    }
    setSavingNumber(false)
  }

  const provision = async () => {
    setProvisioning(true); setMsg(null)
    try {
      const res = await api('/onboarding/provision', { method: 'POST' })
      setStatus({ ...status, hasNumbers: true, numbers: res.numbers })
      setMsg({ type: 'green', text: '✅ Numbers provisioned! Check your WhatsApp for a welcome message.' })
    } catch (e) {
      setMsg({ type: 'red', text: e.message })
    }
    setProvisioning(false)
  }

  if (loading) return <div style={{ padding: 40, color: 'var(--muted)' }}>Loading...</div>

  return (
    <div>
      <div className="page-title">Setup</div>
      <div className="page-sub">Get your WhatsApp agent live</div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {/* Step 1 — Personal WhatsApp number */}
      <div className="card">
        <div className="section-label">Step 1 — Your WhatsApp Number</div>
        {status?.hasPersonalNumber ? (
          <div>
            <div style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: 8 }}>✅ Number saved</div>
            <div className="number-box">{status.personalNumber}</div>
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 8 }}>
              This is where you'll receive draft notifications and reply <strong style={{ color: 'var(--text)' }}>ok / edit / skip</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={savePersonalNumber}>
            <p style={{ color: 'var(--muted)', marginBottom: 12, fontSize: '0.9rem' }}>
              Enter the WhatsApp number on your phone. This is where your agent sends you draft
              notifications to approve. Use international format.
            </p>
            <div className="form-group">
              <input
                type="tel"
                value={number}
                onChange={e => setNumber(e.target.value)}
                placeholder="+14155551234"
                required
                style={{ width: '100%' }}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={savingNumber} style={{ marginTop: 8 }}>
              {savingNumber ? 'Saving...' : 'Save Number'}
            </button>
          </form>
        )}
      </div>

      {/* Step 2 — Provision numbers */}
      <div className="card">
        <div className="section-label">Step 2 — Get Your Numbers</div>
        {status?.hasNumbers ? (
          <div>
            <div style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: 12 }}>✅ Numbers active</div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: 4 }}>Agent number (share with contacts)</div>
              <div className="number-box">{status.numbers?.agent_number?.replace('whatsapp:', '')}</div>
            </div>
            <div>
              <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: 4 }}>Control number (save as "ReplyAI" in your contacts)</div>
              <div className="number-box">{status.numbers?.control_number?.replace('whatsapp:', '')}</div>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ color: 'var(--muted)', marginBottom: 16, fontSize: '0.9rem' }}>
              We'll provision two WhatsApp Business numbers for you instantly — one for your contacts to message, one for your private control interface.
            </p>
            <button className="btn-primary" onClick={provision} disabled={provisioning || !status?.hasPersonalNumber}>
              {provisioning ? 'Provisioning...' : '🚀 Provision My Numbers'}
            </button>
            {!status?.hasPersonalNumber && (
              <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 8 }}>Save your WhatsApp number first.</p>
            )}
          </div>
        )}
      </div>

      {/* Step 3 */}
      <div className="card">
        <div className="section-label">Step 3 — Save Your Control Number</div>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          Save your control number in your WhatsApp contacts as <strong style={{ color: 'var(--text)' }}>"ReplyAI"</strong>.
          This is where you'll approve/edit/skip drafts and ask questions like "summarize Sarah."
        </p>
      </div>

      {/* Step 4 */}
      <div className="card">
        <div className="section-label">Step 4 — Set Your Business Profile</div>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 12 }}>
          Tell the AI who you are — agency name, areas you serve, working hours, and tone.
          This is what it uses to qualify leads and reply in your voice.
        </p>
        <a href="/persona" className="btn-primary" style={{ display: 'inline-block', borderRadius: 8, padding: '9px 18px', background: 'var(--accent)', color: '#000', fontWeight: 600 }}>
          Go to Business Profile →
        </a>
      </div>

      {/* Step 5 */}
      <div className="card">
        <div className="section-label">Step 5 — Put Your Number on Your Ads</div>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          Use your agent number as the contact on your <strong style={{ color: 'var(--text)' }}>Bayut / Property Finder</strong> listings and ads.
          Every lead who messages it gets qualified instantly — even at 2am.
        </p>
        {status?.numbers && (
          <div style={{ background: '#ffffff08', borderRadius: 8, padding: 12, marginTop: 12, fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--text)' }}>
            Your agent number: <strong>{status.numbers.agent_number?.replace('whatsapp:', '')}</strong>
          </div>
        )}
      </div>

      {/* Step 6 */}
      <div className="card">
        <div className="section-label">Step 6 — You're Live</div>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          The AI auto-answers routine questions and qualifies every lead. When a lead wants to
          negotiate or book a viewing, you get a WhatsApp message — reply <strong style={{ color: 'var(--text)' }}>ok</strong> to send,
          <strong style={{ color: 'var(--text)' }}> edit [your text]</strong> to change, or <strong style={{ color: 'var(--text)' }}>skip</strong>. Hot leads ping you instantly.
        </p>
        <div style={{ marginTop: 16, padding: 14, background: '#ffffff05', borderRadius: 8, fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 2 }}>
          ok · edit [text] · skip<br/>
          hot leads · new leads · leads in [area] · follow ups<br/>
          summarize [name] · auto on/off · pause · resume
        </div>
      </div>
    </div>
  )
}
