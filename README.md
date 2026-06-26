# ReplyAI — AI WhatsApp Lead Qualifier for Dubai Real Estate

An AI WhatsApp assistant for Dubai real-estate agents. It instantly **qualifies every property lead**, **auto-answers routine questions 24/7**, flags hot leads, and **escalates the judgment calls** (negotiation, viewing times) to the agent — so no lead goes cold while you're showing a property or asleep.

In real estate, speed-to-lead wins the deal. ReplyAI replies in seconds, gathers budget / area / bedrooms / timeline, and hands you a qualified pipeline.

---

## How It Works

1. Sign up → get a WhatsApp Business number provisioned instantly
2. Set your **business profile** (agency name, areas served, working hours, tone)
3. Put your agent number on your Bayut / Property Finder ads and listings
4. A buyer or renter messages → the AI replies, qualifies, and captures the lead:

```
Lead:  "Hi, saw your 2-bed in Marina on Bayut — still available?"
AI:    "Hi! Yes, still available 🙂 Are you looking to rent or buy,
        and what's your budget range? Happy to share options."
Lead:  "Rent, around 120k/yr, moving next month"
AI →   captures: intent=rent · area=Dubai Marina · 2BR ·
        budget≤120k AED · timeline=1-3m · score=HOT
AI →   agent gets a hot-lead alert on WhatsApp
```

5. Routine questions are answered automatically. Negotiation, viewing times, or anything
   the AI is unsure about get **escalated to you to approve** — reply **ok / edit / skip**.

---

## Architecture

```
Lead → Agent Number (Twilio WhatsApp)
              ↓
         Node.js Backend
              ↓
   Claude claude-opus-4-8 — qualify + reply + extract (structured output)
              ↓
    ┌─────────────────────────────┬──────────────────────────────┐
    │ routine → auto-send to lead  │ negotiation/viewing/unsure → │
    │                              │ escalate draft to the agent  │
    └─────────────────────────────┴──────────────────────────────┘
              ↓
   Lead saved with stage + score → Pipeline dashboard + hot-lead alerts
```

A single Claude call per message returns the reply to send, the extracted lead fields
(intent, budget, area, bedrooms, timeline, purpose), the pipeline stage + lead score, and
the escalate/auto-answer decision.

---

## Features

- **Instant lead qualification** — gathers intent, area, budget (AED), bedrooms, timeline, purpose over a natural conversation
- **Auto-answer + escalate** — routine questions answered in seconds; negotiation and viewing confirmations routed to the agent
- **Hot-lead alerts** — the agent is pinged on WhatsApp the moment a lead turns hot
- **Lead pipeline** — every lead tracked through new → qualifying → qualified → viewing → negotiating, scored hot/warm/cold
- **Pipeline queries** — ask "hot leads", "new leads", "leads in Marina", "follow ups", "summarize [name]" from WhatsApp
- **Dubai-tuned** — AED budgets, lakh/crore-free phrasing, areas like Marina, JVC, JLT, Downtown, Business Bay
- **Web dashboard** — pipeline view, lead detail with qualification + stage, business profile, settings

---

## WhatsApp Commands

Send these to your control number from your personal WhatsApp:

| Command | Action |
|---------|--------|
| `ok` | Send the latest escalated draft to the lead |
| `ok [name]` | Send the draft for a specific lead |
| `edit [your text]` | Replace the draft and send your version |
| `skip` | Dismiss the latest draft |
| `hot leads` | List your hot leads |
| `new leads` / `today` | Leads that came in today |
| `leads in [area]` | Leads interested in an area (e.g. `leads in JVC`) |
| `follow ups` | Leads still being qualified |
| `summarize [name]` | Full summary of a lead and best next action |
| `auto on / off` | Toggle approve-everything mode |
| `pause / resume` | Stop or restart the agent |

---

## Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js + Express |
| Frontend | React + Vite |
| Database | PostgreSQL (Supabase) |
| WhatsApp | Twilio WhatsApp Business API |
| AI | Claude `claude-opus-4-8` (Anthropic), structured outputs |
| Auth | Supabase Auth (email + Google SSO) |
| Billing | Stripe |
| Deployment | Railway (backend) + Vercel (frontend) |

---

## Setup

### Prerequisites
- [Supabase](https://supabase.com) account
- [Twilio](https://twilio.com) account with WhatsApp Business API access
- [Anthropic](https://console.anthropic.com) API key
- [Stripe](https://stripe.com) account (optional, for billing)
- [Railway](https://railway.app) + [Vercel](https://vercel.com) accounts

### 1. Database

Create a Supabase project and run `backend/schema.sql` in the SQL editor.

### 2. Environment Variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**backend/.env**
```
PORT=4000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_SANDBOX_NUMBER=+14155238886
ANTHROPIC_API_KEY=sk-ant-your-key
APP_URL=https://your-frontend.vercel.app
```

**frontend/.env**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://your-backend.up.railway.app
```

### 3. Run Locally

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

### 4. Deploy

- **Backend → Railway**: connect the repo, set root directory to `backend`, add env vars
- **Frontend → Vercel**: connect the repo, set root directory to `frontend`, add `VITE_*` env vars
- Point the Twilio webhook URL to your Railway backend URL + `/webhooks/whatsapp`

### 5. Onboard as an Agent

1. Sign up at your deployed frontend URL
2. Add your WhatsApp number, then provision your agent number on **Setup**
3. Fill in your **Business Profile** (agency, areas served, hours, tone)
4. Put your agent number on your Bayut / Property Finder ads
5. A lead messages → the AI qualifies it → you watch the pipeline fill up

> **Sandbox mode**: with the Twilio WhatsApp sandbox you have one shared number, so you
> message it yourself to test (you play both the lead and the approving agent). Production
> needs a provisioned WhatsApp Business number per agent.

---

## Project Structure

```
replyai/
├── backend/
│   ├── schema.sql              # Run this in Supabase SQL editor
│   ├── src/
│   │   ├── index.js            # Express entry point
│   │   ├── db.js               # Supabase query layer (leads + agency)
│   │   ├── middleware/auth.js  # JWT verification
│   │   ├── routes/
│   │   │   ├── webhooks.js     # Twilio handler: qualify → auto-answer / escalate
│   │   │   ├── onboarding.js   # Number provisioning + personal number capture
│   │   │   ├── leads.js        # Lead pipeline list / detail / stage update
│   │   │   ├── agency.js       # Business profile get / update
│   │   │   ├── messages.js     # Draft send / dismiss
│   │   │   ├── settings.js     # Agent settings
│   │   │   └── billing.js      # Stripe checkout + webhooks
│   │   └── services/
│   │       ├── agent.js        # Claude qualification brain (structured output)
│   │       ├── twilio.js       # WhatsApp send helpers + lead alerts
│   │       └── queue.js        # Per-lead message debounce
└── frontend/
    └── src/
        ├── pages/
        │   ├── Login.jsx        # Email + Google SSO
        │   ├── Onboarding.jsx   # Setup flow
        │   ├── Dashboard.jsx    # Pipeline: stages, hot leads, escalations
        │   ├── Contacts.jsx     # Lead list with qualification data
        │   ├── Contact.jsx      # Lead detail: thread + qualification + stage
        │   ├── Persona.jsx      # Business profile
        │   └── Settings.jsx     # Toggles + command reference
        └── components/
            └── Layout.jsx       # Sidebar navigation
```
