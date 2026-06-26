import 'dotenv/config'
import express from 'express'
import webhookRoutes from './routes/webhooks.js'
import onboardingRoutes from './routes/onboarding.js'
import settingsRoutes from './routes/settings.js'
import leadRoutes from './routes/leads.js'
import agencyRoutes from './routes/agency.js'
import messageRoutes from './routes/messages.js'
import billingRoutes from './routes/billing.js'

const app = express()
const PORT = process.env.PORT || 4000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// CORS for frontend — allow local dev, the configured app URL, and any Vercel deployment
const allowedOrigins = [process.env.APP_URL, 'http://localhost:5173'].filter(Boolean)
app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app'))) {
    res.header('Access-Control-Allow-Origin', origin)
  }
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

// Stripe webhook needs raw body
app.use('/billing/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  req.rawBody = req.body; next()
})

app.use('/webhooks', webhookRoutes)
app.use('/onboarding', onboardingRoutes)
app.use('/settings', settingsRoutes)
app.use('/leads', leadRoutes)
app.use('/agency', agencyRoutes)
app.use('/messages', messageRoutes)
app.use('/billing', billingRoutes)

app.get('/health', (_, res) => res.json({ status: 'ok', version: process.env.RAILWAY_GIT_COMMIT_SHA || 'local' }))

app.listen(PORT, () => console.log(`ReplyAI backend running on port ${PORT}`))
