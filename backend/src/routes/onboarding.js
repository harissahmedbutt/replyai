import { Router } from 'express'
import { db } from '../db.js'
import { provisionNumbers, sendControl } from '../services/twilio.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Save the user's own WhatsApp number (where draft notifications are sent)
router.post('/personal-number', requireAuth, async (req, res) => {
  try {
    const { number } = req.body
    // Normalize to E.164: strip spaces/dashes/parens, ensure leading +
    const cleaned = (number || '').replace(/[\s\-()]/g, '')
    if (!/^\+[1-9]\d{7,14}$/.test(cleaned)) {
      return res.status(400).json({ error: 'Enter a valid number in international format, e.g. +14155551234' })
    }
    const user = await db.updateUser(req.user.id, { personal_wa_number: cleaned })
    res.json({ success: true, personalNumber: user.personal_wa_number })
  } catch (e) {
    console.error('Personal number error:', e.message)
    res.status(500).json({ error: e.message })
  }
})

router.post('/provision', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    const user0 = await db.getUserById(userId)
    if (!user0?.personal_wa_number) {
      return res.status(400).json({ error: 'Add your WhatsApp number first.' })
    }
    const existing = await db.getWaNumbers(userId)
    if (existing) return res.json({ success: true, numbers: existing })

    const { agentNumber, controlNumber, agentSid, controlSid } = await provisionNumbers()
    const numbers = await db.saveWaNumbers(userId, agentNumber, controlNumber, agentSid, controlSid)

    const user = await db.getUserById(userId)
    await db.updateSettings(userId, {
      auto_reply: false, reply_groups: false, reply_unknown: true,
      active: true, draft_expiry_mins: 30
    })

    // Welcome message to user's personal WhatsApp
    await sendControl(
      controlNumber,
      user.personal_wa_number,
      `✅ *ReplyAI connected!*\n\nSave this number as "ReplyAI" in your contacts.\n\nYour agent number (share with contacts):\n${agentNumber.replace('whatsapp:', '')}\n\nSend *help* anytime to see commands.`
    )

    res.json({ success: true, numbers })
  } catch (e) {
    console.error('Provision error:', e.message)
    res.status(500).json({ error: e.message })
  }
})

router.get('/status', requireAuth, async (req, res) => {
  const user = await db.getUserById(req.user.id)
  const numbers = await db.getWaNumbers(req.user.id)
  const persona = await db.getPersona(req.user.id)
  res.json({
    hasPersonalNumber: !!user?.personal_wa_number,
    personalNumber: user?.personal_wa_number || null,
    hasNumbers: !!numbers,
    hasPersona: !!persona,
    numbers: numbers || null
  })
})

export default router
