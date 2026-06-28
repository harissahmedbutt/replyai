import React from 'react'
import { Link } from 'react-router-dom'
import './Landing.css'

// Each painpoint = the agent's current reality + what it costs them.
const PROBLEMS = [
  {
    title: 'You replied three hours late',
    body: 'By the time you saw the message, they’d already booked a viewing with the agent who answered first. Speed-to-lead wins the deal — and you lost it.'
  },
  {
    title: 'A serious buyer messaged at 1am',
    body: 'You saw it at 9. Gone. Property leads don’t wait for office hours, and you can’t be awake for all of them.'
  },
  {
    title: '“Is it still available?” — again',
    body: 'The 40th identical question today: price, location, floor, availability. Hours of your day spent typing the same answers.'
  },
  {
    title: 'An afternoon wasted on a no-budget lead',
    body: 'You drove across town for a viewing with someone who was never going to buy — because there was no fast way to tell them apart from a real buyer.'
  }
]

// Concrete scenarios — the educational core. Each maps to a painpoint above.
const SCENARIOS = [
  {
    tag: 'While you sleep',
    title: 'A lead at 1am, qualified by 1:01am',
    bubbles: [
      { side: 'in', text: 'Hi, is the 2-bed in JVC still available?' },
      { side: 'out', text: 'Hi! Yes it is — are you looking to rent or buy, and what’s your budget?' },
      { side: 'in', text: 'Buy, up to 1.4M, ready to move in 2 months' }
    ],
    note: 'You wake up to a HOT lead already scored and waiting in your pipeline — not a missed message.'
  },
  {
    tag: 'While you’re in a viewing',
    title: 'Routine questions, answered instantly',
    bubbles: [
      { side: 'in', text: 'What floor is it on? Any parking?' },
      { side: 'out', text: 'It’s on the 14th floor with 1 covered parking space. Want me to send the floor plan?' },
      { side: 'in', text: 'Yes please' }
    ],
    note: 'The AI handles the repetitive stuff 24/7 so you stay focused on the buyer in front of you.'
  },
  {
    tag: 'When it matters',
    title: 'The judgment calls come to you',
    bubbles: [
      { side: 'in', text: 'Can you do 115k instead of 120k?' },
      { side: 'ai-note', text: 'Negotiation — escalated to you on WhatsApp to approve' },
      { side: 'out', text: 'You reply: ok · edit · skip' }
    ],
    note: 'Negotiation and viewing times are never answered alone — the AI drafts, you decide with one word.'
  }
]

const COMPARISON = [
  ['Response time', 'Whenever you next check your phone', 'Seconds — every time, day or night'],
  ['After hours', 'Leads sit unread until morning', 'Greeted and qualified 24/7'],
  ['Routine questions', 'You type the same answers all day', 'Answered automatically in your voice'],
  ['Qualifying buyers', 'You find out at the viewing', 'Budget, area & timeline captured upfront'],
  ['Lead tracking', 'Lost in your WhatsApp chats', 'A scored pipeline, hot → cold']
]

const STEPS = [
  { n: '1', title: 'Connect your number', body: 'Get a WhatsApp Business number provisioned instantly and put it on your Bayut and Property Finder ads.' },
  { n: '2', title: 'Set your profile', body: 'Tell the AI your agency, the areas you serve, your hours, and the tone it should reply in.' },
  { n: '3', title: 'Watch the pipeline fill', body: 'Leads message, the AI qualifies and scores them, and you approve the judgment calls. Done.' }
]

const FEATURES = [
  { title: 'Instant lead qualification', body: 'Every lead is greeted in seconds and qualified for intent, area, budget in AED, bedrooms, and timeline — over a natural conversation.' },
  { title: 'Auto-answer + escalate', body: 'Routine questions are answered automatically 24/7. Negotiation and viewing requests are routed to you to approve — reply ok, edit, or skip.' },
  { title: 'Hot-lead alerts', body: 'The moment a lead turns hot, you get pinged on WhatsApp — so you never let a serious buyer go cold while showing a property.' },
  { title: 'Lead pipeline', body: 'Every lead tracked from new to qualifying, qualified, viewing, and negotiating — scored hot, warm, or cold automatically.' },
  { title: 'Ask from WhatsApp', body: '“Hot leads”, “new leads”, “leads in Marina”, “summarize Sarah” — query your whole pipeline without opening the dashboard.' },
  { title: 'Replies in your voice', body: 'Set your agency, areas, hours, and tone once. The AI answers exactly the way you would — never off-brand.' }
]

const COMMANDS = [
  ['ok / edit / skip', 'Approve, rewrite, or dismiss the latest escalated reply'],
  ['hot leads', 'List the buyers worth calling right now'],
  ['new leads / today', 'Everyone who came in today'],
  ['leads in [area]', 'e.g. leads in JVC, leads in Marina'],
  ['summarize [name]', 'A full picture of a lead + the best next move'],
  ['pause / resume', 'Stop or restart the agent anytime']
]

const FAQS = [
  { q: 'Will it sound like a robot?', a: 'No. The AI replies in your tone and voice, using the agency name, areas, and style you set in your Business Profile. Leads feel like they’re talking to you.' },
  { q: 'What if it says the wrong thing?', a: 'It won’t handle the risky stuff alone. Negotiation and viewing times are always escalated to you to approve first. You can also switch on approve-everything mode so nothing sends without your ok.' },
  { q: 'Do my leads need to install anything?', a: 'No. They message your number on WhatsApp exactly like they already do. Nothing changes for them.' },
  { q: 'Does it work with Bayut and Property Finder?', a: 'Yes. Put your agent number on your listings and ads. Every lead who messages it gets qualified instantly — even at 2am.' },
  { q: 'Can I turn it off?', a: 'Anytime — from the dashboard or by sending “pause” on WhatsApp. Send “resume” to switch it back on.' }
]

function Logo() {
  return (
    <div className="lp-logo">
      <span className="lp-logo-mark">R</span>
      ReplyAI
    </div>
  )
}

export default function Landing() {
  return (
    <div className="lp">
      {/* Nav */}
      <header className="lp-nav">
        <div className="lp-container lp-nav-inner">
          <Logo />
          <nav className="lp-nav-links">
            <a href="#problem">The problem</a>
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <a href="#faq">FAQ</a>
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
            <h1>Reply to every lead in seconds. Even the 2am ones.</h1>
            <p className="lp-lede">
              ReplyAI is your AI WhatsApp assistant. It answers and qualifies every property
              lead instantly, handles the routine questions 24/7, and sends the judgment
              calls to you to approve — so you stop losing deals to slow replies.
            </p>
            <div className="lp-hero-cta">
              <Link to="/login" className="lp-btn lp-btn-primary">Start qualifying leads</Link>
              <a href="#how" className="lp-btn lp-btn-ghost">See how it works</a>
            </div>
            <div className="lp-hero-note">
              Works with your WhatsApp and your Bayut / Property Finder listings — no new app for your leads.
            </div>
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

      {/* Capability strip (reframed as how the product behaves) */}
      <section className="lp-stats">
        <div className="lp-container lp-stats-grid">
          <div><div className="lp-stat-v">Seconds</div><div className="lp-stat-l">To first reply, every time</div></div>
          <div><div className="lp-stat-v">24/7</div><div className="lp-stat-l">Answering, even overnight</div></div>
          <div><div className="lp-stat-v">Every lead</div><div className="lp-stat-l">Qualified &amp; scored</div></div>
          <div><div className="lp-stat-v">You decide</div><div className="lp-stat-l">On every judgment call</div></div>
        </div>
      </section>

      {/* The problem today */}
      <section id="problem" className="lp-section">
        <div className="lp-container">
          <div className="lp-section-head">
            <h2>You know this day too well</h2>
            <p>Every lead you don’t answer fast enough is a deal someone else just closed.</p>
          </div>
          <div className="lp-problems">
            {PROBLEMS.map(p => (
              <div key={p.title} className="lp-problem">
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What ReplyAI does — scenarios */}
      <section className="lp-section lp-section-alt">
        <div className="lp-container">
          <div className="lp-section-head">
            <h2>Here’s what changes</h2>
            <p>The same WhatsApp conversations — handled the way you wish you had time to.</p>
          </div>
          <div className="lp-scenarios">
            {SCENARIOS.map(s => (
              <div key={s.title} className="lp-scenario">
                <div className="lp-scenario-tag">{s.tag}</div>
                <h3>{s.title}</h3>
                <div className="lp-scenario-chat">
                  {s.bubbles.map((b, i) => (
                    b.side === 'ai-note'
                      ? <div key={i} className="lp-scenario-escalate">{b.text}</div>
                      : <div key={i} className={`lp-bubble lp-${b.side === 'in' ? 'in' : 'out'}`}>{b.text}</div>
                  ))}
                </div>
                <p className="lp-scenario-note">{s.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before / After */}
      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-section-head">
            <h2>Your day, before and after</h2>
            <p>Same leads, same listings — a completely different pipeline.</p>
          </div>
          <div className="lp-compare">
            <div className="lp-compare-head">
              <div className="lp-compare-cell lp-compare-row-label" />
              <div className="lp-compare-cell lp-compare-before">Your day now</div>
              <div className="lp-compare-cell lp-compare-after">With ReplyAI</div>
            </div>
            {COMPARISON.map(([label, before, after]) => (
              <div key={label} className="lp-compare-row">
                <div className="lp-compare-cell lp-compare-row-label">{label}</div>
                <div className="lp-compare-cell lp-compare-before">{before}</div>
                <div className="lp-compare-cell lp-compare-after">{after}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="lp-section lp-section-alt">
        <div className="lp-container">
          <div className="lp-section-head">
            <h2>Live in minutes</h2>
            <p>No new app for your leads — they just message WhatsApp like always.</p>
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
      <section id="features" className="lp-section">
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

      {/* Run it from WhatsApp */}
      <section className="lp-section lp-section-alt">
        <div className="lp-container lp-wa">
          <div className="lp-wa-copy">
            <h2>Run it all from WhatsApp</h2>
            <p>
              No dashboard required. Approve replies, pull up your hot leads, and manage the
              whole pipeline with a quick message — right from the app you already live in.
            </p>
          </div>
          <div className="lp-wa-cmds">
            {COMMANDS.map(([cmd, desc]) => (
              <div key={cmd} className="lp-wa-cmd">
                <code>{cmd}</code>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="lp-section">
        <div className="lp-container lp-faq-wrap">
          <div className="lp-section-head">
            <h2>Questions agents ask</h2>
            <p>Straight answers before you sign up.</p>
          </div>
          <div className="lp-faq">
            {FAQS.map(f => (
              <details key={f.q} className="lp-faq-item">
                <summary>{f.q}<span className="lp-faq-plus" /></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <div className="lp-container lp-cta-inner">
          <h2>Turn every WhatsApp message into a qualified lead.</h2>
          <p>Set up your AI agent in minutes and stop losing deals to slow replies.</p>
          <Link to="/login" className="lp-btn lp-btn-primary lp-btn-lg">Get started free</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <Logo />
          <div className="lp-footer-meta">© {new Date().getFullYear()} ReplyAI · AI WhatsApp lead qualifier for Dubai real estate</div>
        </div>
      </footer>
    </div>
  )
}
