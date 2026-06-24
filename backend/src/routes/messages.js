import { Router } from 'express'
import { db } from '../db.js'
import { sendWhatsApp } from '../services/twilio.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/drafts', requireAuth, async (req, res) => {
  const drafts = await db.getPendingDrafts(req.user.id)
  res.json(drafts)
})

router.post('/drafts/:id/send', requireAuth, async (req, res) => {
  const draft = await db.getPendingDraftById(req.params.id, req.user.id)
  if (!draft) return res.status(404).json({ error: 'Draft not found' })

  const waNumbers = await db.getWaNumbers(req.user.id)
  const contact = await db.getContactById(draft.contact_id)

  await sendWhatsApp(contact.wa_id, waNumbers.agent_number, draft.draft_text)
  await db.saveMessage(req.user.id, contact.id, 'outbound', draft.draft_text, null)
  await db.updateDraftStatus(draft.id, 'sent')

  res.json({ success: true })
})

router.post('/drafts/:id/dismiss', requireAuth, async (req, res) => {
  await db.updateDraftStatus(req.params.id, 'dismissed')
  res.json({ success: true })
})

router.get('/today', requireAuth, async (req, res) => {
  const rows = await db.getTodaysContacts(req.user.id)
  res.json(rows)
})

export default router
