import React, { useState, useEffect } from 'react'
import { api } from '../supabase.js'

export default function Onboarding() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [provisioning, setProvisioning] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => { api('/onboarding/status').then(setStatus).finally(() => setLoading(false)) }, [])

  const provision = async () => {
    setProvisioning(true); setMsg(null)
    try {
      const res = await api('/onboarding/provision', { method: 'POST' })
      setStatus({ hasNumbers: true, hasPersona: status?.hasPersona, numbers: res.numbers })
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
      <div className="page-sub">Get your WhatsApp agent live in 5 steps</div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {/* Step 1 */}
      <div className="card">
        <div className="section-label">Step 1 — Get Your Numbers</div>
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
            <button className="btn-primary" onClick={provision} disabled={provisioning}>
              {provisioning ? 'Provisioning...' : '🚀 Provision My Numbers'}
            </button>
          </div>
        )}
      </div>

      {/* Step 2 */}
      <div className="card">
        <div className="section-label">Step 2 — Save Your Control Number</div>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          Save your control number in your WhatsApp contacts as <strong style={{ color: 'var(--text)' }}>"ReplyAI"</strong>.
          This is where you'll approve/edit/skip drafts and ask questions like "summarize Sarah."
        </p>
      </div>

      {/* Step 3 */}
      <div className="card">
        <div className="section-label">Step 3 — Upload Chat Exports</div>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: 12 }}>
          Export 3+ WhatsApp chats: <strong style={{ color: 'var(--text)' }}>Settings → Chats → Export Chat → Without Media</strong>.
          Upload the .txt files to build your persona and populate contact history.
        </p>
        <a href="/persona" className="btn-primary" style={{ display: 'inline-block', borderRadius: 8, padding: '9px 18px', background: 'var(--accent)', color: '#000', fontWeight: 600 }}>
          Go to Persona Builder →
        </a>
      </div>

      {/* Step 4 */}
      <div className="card">
        <div className="section-label">Step 4 — Share Your Agent Number</div>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          Share your agent number with your contacts. You can copy this message:
        </p>
        {status?.numbers && (
          <div style={{ background: '#ffffff08', borderRadius: 8, padding: 12, marginTop: 12, fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--text)' }}>
            Hey! I'm moving to a new WhatsApp number for business: {status.numbers.agent_number?.replace('whatsapp:', '')} — add me there 👍
          </div>
        )}
      </div>

      {/* Step 5 */}
      <div className="card">
        <div className="section-label">Step 5 — You're Live</div>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          When someone messages your agent number, you'll get a WhatsApp draft notification on your personal number.
          Reply <strong style={{ color: 'var(--text)' }}>ok</strong> to send, <strong style={{ color: 'var(--text)' }}>edit [your text]</strong> to change, or <strong style={{ color: 'var(--text)' }}>skip</strong> to dismiss.
        </p>
        <div style={{ marginTop: 16, padding: 14, background: '#ffffff05', borderRadius: 8, fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 2 }}>
          ok · ok [name] · edit [text] · skip · skip [name]<br/>
          summarize [name] · today · catch me up<br/>
          auto on · auto off · pause · resume
        </div>
      </div>
    </div>
  )
}
