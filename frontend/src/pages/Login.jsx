import React, { useState } from 'react'
import { supabase } from '../supabase.js'

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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>ReplyAI</div>
        <div style={{ color: 'var(--muted)', marginBottom: 32, fontSize: '0.9rem' }}>Your WhatsApp AI agent</div>

        {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

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
