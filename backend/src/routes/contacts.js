import { Router } from 'express'
import { db } from '../db.js'
import { summarizeContact } from '../services/agent.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const contacts = await db.getContacts(req.user.id)
  res.json(contacts)
})

router.patch('/:id', requireAuth, async (req, res) => {
  const allowed = ['display_name', 'notes', 'key_facts']
  const updates = {}
  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key]
  }
  const updated = await db.updateContact(req.params.id, updates)
  res.json(updated)
})

router.get('/:id/messages', requireAuth, async (req, res) => {
  const messages = await db.getMessagesForContact(req.user.id, req.params.id)
  res.json(messages)
})

router.post('/:id/summarize', requireAuth, async (req, res) => {
  const contacts = await db.getContacts(req.user.id)
  const contact = contacts.find(c => c.id === req.params.id)
  if (!contact) return res.status(404).json({ error: 'Contact not found' })
  const summary = await summarizeContact(req.user.id, contact)
  await db.updateContact(contact.id, { profile_summary: summary })
  res.json({ summary })
})

export default router
