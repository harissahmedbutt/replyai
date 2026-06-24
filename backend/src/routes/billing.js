import { Router } from 'express'
import Stripe from 'stripe'
import { db } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const router = Router()

const PLANS = {
  pro: { priceId: process.env.STRIPE_PRO_PRICE_ID, name: 'Pro', amount: 3900 },
  team: { priceId: process.env.STRIPE_TEAM_PRICE_ID, name: 'Team', amount: 9900 }
}

router.post('/checkout', requireAuth, async (req, res) => {
  const { plan } = req.body
  if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' })

  const user = await db.getUserById(req.user.id)
  let customerId = user.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } })
    customerId = customer.id
    await db.supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
    success_url: `${process.env.APP_URL}/settings?upgraded=1`,
    cancel_url: `${process.env.APP_URL}/settings`
  })

  res.json({ url: session.url })
})

router.post('/portal', requireAuth, async (req, res) => {
  const user = await db.getUserById(req.user.id)
  if (!user.stripe_customer_id) return res.status(400).json({ error: 'No billing account' })

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: `${process.env.APP_URL}/settings`
  })
  res.json({ url: session.url })
})

// Stripe webhook — update plan on subscription changes
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (e) {
    return res.status(400).send(`Webhook error: ${e.message}`)
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
    const sub = event.data.object
    const customer = await stripe.customers.retrieve(sub.customer)
    const userId = customer.metadata.user_id
    const plan = sub.status === 'active' ? (sub.items.data[0].price.id === PLANS.team?.priceId ? 'team' : 'pro') : 'free'
    if (userId) await db.supabase.from('users').update({ plan }).eq('id', userId)
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object
    const customer = await stripe.customers.retrieve(sub.customer)
    const userId = customer.metadata.user_id
    if (userId) await db.supabase.from('users').update({ plan: 'free' }).eq('id', userId)
  }

  res.json({ received: true })
})

router.get('/plan', requireAuth, async (req, res) => {
  const user = await db.getUserById(req.user.id)
  const draftCount = await db.getDraftCount(req.user.id)
  res.json({ plan: user.plan || 'free', draftCount, draftLimit: user.plan === 'free' ? 30 : null })
})

export default router
