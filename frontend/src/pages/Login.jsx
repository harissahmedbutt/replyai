import React, { useState } from 'react'
import { supabase } from '../supabase.js'
import './Landing.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  const submit = async e => {
    e.preventDefault()
    setLoading(true); setMsg(null)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMsg({ type: 'green', text: 'Check your email to confirm your account.' })
      }
    } catch (e) {
      setMsg({ type: 'red', text: e.message })
    }
    setLoading(false)
  }

  const signInWithGoogle = async () => {
    setMsg(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) setMsg({ type: 'red', text: error.message })
  }

  return (
    <div className="lp lp-auth">
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ fontSize: '1.9rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--lp-green-strong)', marginBottom: 8 }}>ReplyAI</div>
        <div style={{ color: 'var(--lp-muted)', marginBottom: 32, fontSize: '0.9rem' }}>Your WhatsApp AI agent</div>

        {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        <button type="button" onClick={signInWithGoogle} className="btn-google" style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '11px 16px', background: '#fff', color: '#1f1f1f', border: '1px solid #dadce0',
          borderRadius: 8, fontWeight: 600, fontSize: '0.92rem', cursor: 'pointer'
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0', color: 'var(--muted)', fontSize: '0.8rem' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border, #2a2a2a)' }} />
          or
          <div style={{ flex: 1, height: 1, background: 'var(--border, #2a2a2a)' }} />
        </div>

        <form onSubmit={submit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
            {loading ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, color: 'var(--muted)', fontSize: '0.85rem' }}>
          {mode === 'login' ? (
            <>No account? <a href="#" onClick={() => setMode('signup')}>Sign up</a></>
          ) : (
            <>Have an account? <a href="#" onClick={() => setMode('login')}>Sign in</a></>
          )}
        </div>
      </div>
    </div>
  )
}
