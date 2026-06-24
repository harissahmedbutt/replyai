# ReplyAI

A WhatsApp Business SaaS agent that reads your incoming messages, drafts replies in your voice using Claude, and sends you the draft on WhatsApp for approval — all without leaving WhatsApp.

---

## How It Works

1. Sign up → get two WhatsApp Business numbers provisioned instantly
2. Upload your existing chat exports → AI learns your writing style
3. Contact messages your agent number → Claude drafts a reply
4. You get a WhatsApp notification on your personal number:

```
📩 Sarah Chen
"are we still on for Thursday?"

Draft reply:
"yeah! 7pm still works, see you then 👍"

Reply ok · edit [text] · skip
```

5. Reply **ok** → message sent. Done.

Everything stays in WhatsApp. No extra apps.

---

## Architecture

```
Contact → Agent Number (Twilio)
               ↓
         Node.js Backend
               ↓
    Claude claude-opus-4-8 (draft)
               ↓
    Control Number → Your Personal WhatsApp
               ↓
         You reply "ok"
               ↓
    Agent Number sends reply to contact
```

Each user gets two Twilio WhatsApp numbers:
- **Agent number** — the public number your contacts message
- **Control number** — your private assistant that sends drafts and takes commands

---

## Features

- **Draft + approve** — agent never sends without your sign-off (or enable auto-reply)
- **Persona builder** — upload WhatsApp chat exports, Claude extracts your writing style
- **Full contact context** — stores every message, auto-summarizes long histories
- **Query interface** — ask "summarize Sarah", "who messaged me today?", "catch me up"
- **WhatsApp commands** — control everything from your phone, no dashboard needed
- **Per-contact settings** — mute specific contacts, enable auto-reply for others
- **Web dashboard** — view history, manage contacts, edit persona, billing

---

## WhatsApp Commands

Send these to your control number from your personal WhatsApp:

| Command | Action |
|---------|--------|
| `ok` | Send the latest pending draft |
| `ok [name]` | Send draft for a specific contact |
| `edit [your text]` | Replace draft and send your version |
| `skip` | Dismiss the latest draft |
| `skip [name]` | Dismiss draft for a specific contact |
| `summarize [name]` | Full relationship summary for a contact |
| `today` | Who messaged you today + previews |
| `catch me up` | All pending conversations |
| `auto on / off` | Toggle auto-reply globally |
| `pause / resume` | Stop or restart the agent |
| `groups on / off` | Toggle group chat handling |

---

## Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js + Express |
| Frontend | React + Vite |
| Database | PostgreSQL (Supabase) |
| WhatsApp | Twilio WhatsApp Business API |
| AI | Claude `claude-opus-4-8` (Anthropic) |
| Auth | Supabase Auth |
| Billing | Stripe |
| Deployment | Railway |

---

## Setup

### Prerequisites
- [Supabase](https://supabase.com) account
- [Twilio](https://twilio.com) account with WhatsApp Business API access
- [Anthropic](https://console.anthropic.com) API key
- [Stripe](https://stripe.com) account
- [Railway](https://railway.app) account

### 1. Database

Create a Supabase project and run `backend/schema.sql` in the SQL editor.

### 2. Environment Variables

Copy and fill both env files:

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
TWILIO_WEBHOOK_URL=https://your-backend.up.railway.app
ANTHROPIC_API_KEY=sk-ant-your-key
STRIPE_SECRET_KEY=sk_live_or_test_key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_TEAM_PRICE_ID=price_xxx
APP_URL=https://your-frontend.up.railway.app
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

### 4. Deploy to Railway

1. Push to GitHub
2. Create two Railway services — one for `backend/`, one for `frontend/`
3. Set env vars in Railway dashboard
4. Point Twilio webhook URL to your Railway backend URL + `/webhooks/whatsapp`

### 5. Onboard as a User

1. Sign up at your deployed frontend URL
2. Go to **Setup** → click **Provision My Numbers**
3. Save the control number as "ReplyAI" in your WhatsApp contacts
4. Export 3+ WhatsApp chats (WhatsApp → Settings → Chats → Export Chat → Without Media) and upload them on the **Persona** page
5. Share your agent number with your contacts
6. First message arrives → approve it on WhatsApp → you're live

---


---

## Project Structure

```
replyai/
├── backend/
│   ├── schema.sql              # Run this in Supabase SQL editor
│   ├── src/
│   │   ├── index.js            # Express entry point
│   │   ├── db.js               # Supabase query layer
│   │   ├── middleware/auth.js  # JWT verification
│   │   ├── routes/
│   │   │   ├── webhooks.js     # Twilio message handler (core logic)
│   │   │   ├── onboarding.js   # Number provisioning
│   │   │   ├── imports.js      # Chat export upload + persona build
│   │   │   ├── contacts.js     # Contact CRUD + summaries
│   │   │   ├── messages.js     # Draft send/dismiss
│   │   │   ├── settings.js     # User settings
│   │   │   └── billing.js      # Stripe checkout + webhooks
│   │   └── services/
│   │       ├── agent.js        # Claude draft generation + queries
│   │       ├── persona.js      # Persona extraction from exports
│   │       ├── parser.js       # WhatsApp .txt export parser
│   │       ├── twilio.js       # WhatsApp send helpers
│   │       └── queue.js        # Per-contact message debounce
└── frontend/
    └── src/
        ├── pages/
        │   ├── Login.jsx
        │   ├── Onboarding.jsx  # 5-step setup flow
        │   ├── Dashboard.jsx   # Pending drafts + recent contacts
        │   ├── Contacts.jsx    # Contact list + search
        │   ├── Contact.jsx     # History, notes, AI summary
        │   ├── Persona.jsx     # Export upload + persona editor
        │   └── Settings.jsx    # Toggles + command reference
        └── components/
            └── Layout.jsx      # Sidebar navigation
```
