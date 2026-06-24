import React, { useState, useEffect, useRef } from 'react'
import { api } from '../supabase.js'

export default function Persona() {
  const [persona, setPersona] = useState(null)
  const [lastBuilt, setLastBuilt] = useState(null)
  const [editText, setEditText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef()

  useEffect(() => {
    api('/imports/persona').then(r => {
      setPersona(r.persona); setEditText(r.persona || ''); setLastBuilt(r.lastBuilt)
    })
  }, [])

  const uploadFiles = async (files) => {
    if (!files.length) return
    setUploading(true); setMsg(null)
    const formData = new FormData()
    Array.from(files).forEach(f => formData.append('exports', f))
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/imports/exports`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${(await (await import('../supabase.js')).supabase.auth.getSession()).data.session?.access_token}` },
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMsg({ type: 'green', text: `✅ Imported ${data.totalMessages} messages and built your persona.` })
      const r = await api('/imports/persona')
      setPersona(r.persona); setEditText(r.persona || ''); setLastBuilt(r.lastBuilt)
    } catch (e) { setMsg({ type: 'red', text: e.message }) }
    setUploading(false)
  }

  const savePersona = async () => {
    setSaving(true)
    await api('/imports/persona', { method: 'PUT', body: JSON.stringify({ persona_doc: editText }) })
    setPersona(editText)
    setSaving(false)
    setMsg({ type: 'green', text: 'Persona saved.' })
  }

  return (
    <div>
      <div className="page-title">Persona</div>
      <div className="page-sub">Upload chat exports to teach the agent how you write</div>

      {msg && <div className={`alert alert-${msg.type}`} onClick={() => setMsg(null)} style={{ cursor: 'pointer' }}>{msg.text}</div>}

      {/* Upload zone */}
      <div
        className={`upload-zone ${dragging ? 'drag' : ''}`}
        onClick={() => fileRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); uploadFiles(e.dataTransfer.files) }}
        style={{ marginBottom: 24 }}
      >
        <div style={{ fontSize: '2rem' }}>📂</div>
        <div style={{ fontWeight: 600, marginTop: 8 }}>{uploading ? 'Building your persona...' : 'Drop WhatsApp chat exports here'}</div>
        <p>WhatsApp → Settings → Chats → Export Chat → Without Media → .txt file</p>
        <p>Upload 3+ chats for best results</p>
        <input ref={fileRef} type="file" accept=".txt" multiple style={{ display: 'none' }} onChange={e => uploadFiles(e.target.files)} />
      </div>

      {/* Persona editor */}
      {lastBuilt && (
        <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: 12 }}>
          Last built: {new Date(lastBuilt).toLocaleString()}
        </div>
      )}
      <div className="card">
        <div className="section-label">Your Persona Doc</div>
        {persona ? (
          <div>
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              rows={20}
              style={{ marginBottom: 12, fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.7 }}
              placeholder="Your persona will appear here after uploading chat exports..."
            />
            <button className="btn-primary" onClick={savePersona} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <div style={{ color: 'var(--muted)', padding: '20px 0' }}>
            No persona yet. Upload at least 3 chat exports above to build one.
          </div>
        )}
      </div>
    </div>
  )
}
