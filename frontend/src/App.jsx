import React, { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase, api } from './supabase.js'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Contacts from './pages/Contacts.jsx'
import Contact from './pages/Contact.jsx'
import Persona from './pages/Persona.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  const refreshProfile = useCallback(() => {
    return api('/onboarding/status')
      .then(setProfile)
      .catch(() => setProfile({ hasPersonalNumber: true }))
  }, [])

  useEffect(() => {
    if (session) refreshProfile()
    else setProfile(null)
  }, [session, refreshProfile])

  if (loading) return <div style={{ padding: 40, color: '#888' }}>Loading...</div>

  if (!session) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    )
  }

  if (!profile) return <div style={{ padding: 40, color: '#888' }}>Loading...</div>

  // New users must add their WhatsApp number before reaching the app
  if (!profile.hasPersonalNumber) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Layout><Onboarding onProfileChange={refreshProfile} /></Layout>} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Navigate to="/" />} />
        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/onboarding" element={<Onboarding onProfileChange={refreshProfile} />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/contacts/:id" element={<Contact />} />
              <Route path="/persona" element={<Persona />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </BrowserRouter>
  )
}
