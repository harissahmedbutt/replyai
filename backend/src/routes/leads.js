import { Router } from 'express'
import { db } from '../db.js'
import { summarizeContact } from '../services/agent.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// List leads, optional ?stage= &score= &area= filters
router.get('/', requireAuth, async (req, res) => {
  const { stage, score, area } = req.query
  const leads = await db.getLeads(req.user.id, { stage, score, area })
  res.json(leads)
})

// Single lead with its full message thread
router.get('/:id', requireAuth, async (req, res) => {
  const lead = await db.getLeadById(req.user.id, req.params.id)
  if (!lead) return res.status(404).json({ error: 'Lead not found' })
  const messages = await db.getMessagesForContact(req.user.id, req.params.id)
  res.json({ lead, messages })
})

// Manual edits to a lead's pipeline fields
router.patch('/:id', requireAuth, async (req, res) => {
  const allowed = ['display_name', 'notes', 'stage', 'score', 'intent', 'budget_min', 'budget_max', 'areas', 'bedrooms', 'timeline', 'purpose', 'source']
  const updates = {}
  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key]
  }
  const updated = await db.updateContact(req.params.id, updates)
  res.json(updated)
})

// Generate a fresh AI summary for a lead
router.post('/:id/summarize', requireAuth, async (req, res) => {
  const lead = await db.getLeadById(req.user.id, req.params.id)
  if (!lead) return res.status(404).json({ error: 'Lead not found' })
  const summary = await summarizeContact(req.user.id, lead)
  await db.updateContact(lead.id, { profile_summary: summary })
  res.json({ summary })
})

export default router
