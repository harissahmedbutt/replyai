import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const settings = await db.getSettings(req.user.id)
  res.json(settings)
})

router.patch('/', requireAuth, async (req, res) => {
  const allowed = ['auto_reply', 'reply_groups', 'reply_unknown', 'active', 'draft_expiry_mins']
  const updates = {}
  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key]
  }
  const updated = await db.updateSettings(req.user.id, updates)
  res.json(updated)
})

export default router
