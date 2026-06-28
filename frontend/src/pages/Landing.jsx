import React from 'react'
import { Link } from 'react-router-dom'
import './Landing.css'

const FEATURES = [
  {
    title: 'Instant lead qualification',
    body: 'Every lead is greeted in seconds and qualified for intent, area, budget in AED, bedrooms, and timeline — over a natural conversation.'
  },
  {
    title: 'Auto-answer + escalate',
    body: 'Routine questions are answered automatically 24/7. Negotiation and viewing requests are routed to you to approve — reply ok, edit, or skip.'
  },
  {
    title: 'Hot-lead alerts',
    body: 'The moment a lead turns hot, you get pinged on WhatsApp — so you never let a serious buyer go cold while showing a property.'
  },
  {
    title: 'Lead pipeline',
    body: 'Every lead tracked from new to qualifying, qualified, viewing, and negotiating — scored hot, warm, or cold automatically.'
  },
  {
    title: 'Ask from WhatsApp',
    body: '“Hot leads”, “new leads”, “leads in Marina”, “summarize Sarah” — query your whole pipeline without opening the dashboard.'
  },
  {
    title: 'Replies in your voice',
    body: 'Set your agency, areas, hours, and tone once. The AI answers exactly the way you would — never off-brand.'
  }
]

const STEPS = [
  { n: '1', title: 'Connect your number', body: 'Get a WhatsApp Business number provisioned instantly and put it on your Bayut and Property Finder ads.' },
  { n: '2', title: 'Set your profile', body: 'Tell the AI your agency, the areas you serve, your hours, and the tone it should reply in.' },
  { n: '3', title: 'Watch the pipeline fill', body: 'Leads message, the AI qualifies and scores them, and you approve the judgment calls. Done.' }
]

export default function Landing() {
  return (
    <div className="lp">
      {/* Nav */}
      <header className="lp-nav">
        <div className="lp-container lp-nav-inner">
          <div className="lp-logo">
            <span className="lp-logo-mark">R</span>
            ReplyAI
          </div>
          <nav className="lp-nav-links">
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <Link to="/login" className="lp-link-muted">Sign in</Link>
            <Link to="/login" className="lp-btn lp-btn-primary lp-btn-sm">Get started</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-container lp-hero-grid">
          <div className="lp-hero-copy">
            <div className="lp-eyebrow">For Dubai real-estate agents</div>
            <h1>Never let a property lead go cold again.</h1>
            <p className="lp-lede">
              ReplyAI is your AI WhatsApp assistant. It qualifies every lead in seconds,
              answers routine questions 24/7, and escalates the judgment calls to you —
              so your pipeline fills while you're showing a property or asleep.
            </p>
            <div className="lp-hero-cta">
              <Link to="/login" className="lp-btn lp-btn-primary">Start qualifying leads</Link>
              <a href="#how" className="lp-btn lp-btn-ghost">See how it works</a>
            </div>
            <div className="lp-hero-note">Speed-to-lead wins the deal. ReplyAI replies in seconds.</div>
          </div>

          {/* Chat mockup */}
          <div className="lp-mock">
            <div className="lp-mock-head">
              <span className="lp-mock-dot" /> WhatsApp · Lead
            </div>
            <div className="lp-mock-body">
              <div className="lp-bubble lp-in">Hi, saw your 2-bed in Marina on Bayut — still available?</div>
              <div className="lp-bubble lp-out">Hi! Yes, still available 🙂 Are you looking to rent or buy, and what's your budget range?</div>
              <div className="lp-bubble lp-in">Rent, around 120k/yr, moving next month</div>
              <div className="lp-qual">
                <div className="lp-qual-title">Lead qualified</div>
                <div className="lp-qual-tags">
                  <span>Rent</span><span>Dubai Marina</span><span>2 BR</span><span>≤ 120k AED</span><span>1–3 months</span>
                </div>
                <div className="lp-qual-score">Score: <strong>HOT</strong></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="lp-stats">
        <div className="lp-container lp-stats-grid">
          <div><div className="lp-stat-v">&lt; 10s</div><div className="lp-stat-l">Average reply time</div></div>
          <div><div className="lp-stat-v">24/7</div><div className="lp-stat-l">Always answering leads</div></div>
          <div><div className="lp-stat-v">100%</div><div className="lp-stat-l">Of leads qualified</div></div>
          <div><div className="lp-stat-v">0</div><div className="lp-stat-l">Leads left on read</div></div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="lp-section">
        <div className="lp-container">
          <div className="lp-section-head">
            <h2>Live in minutes</h2>
            <p>No new app for your leads. They just message WhatsApp like always.</p>
          </div>
          <div className="lp-steps">
            {STEPS.map(s => (
              <div key={s.n} className="lp-step">
                <div className="lp-step-n">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="lp-section lp-section-alt">
        <div className="lp-container">
          <div className="lp-section-head">
            <h2>Everything you need to win the deal</h2>
            <p>One AI call qualifies, replies, scores, and decides what to escalate.</p>
          </div>
          <div className="lp-features">
            {FEATURES.map(f => (
              <div key={f.title} className="lp-feature">
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <div className="lp-container lp-cta-inner">
          <h2>Turn every WhatsApp message into a qualified lead.</h2>
          <p>Set up your AI agent today and stop losing deals to slow replies.</p>
          <Link to="/login" className="lp-btn lp-btn-primary lp-btn-lg">Get started free</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div className="lp-logo">
            <span className="lp-logo-mark">R</span>
            ReplyAI
          </div>
          <div className="lp-footer-meta">© {new Date().getFullYear()} ReplyAI · AI WhatsApp lead qualifier for Dubai real estate</div>
        </div>
      </footer>
    </div>
  )
}
