import { Router } from 'express'
import { db } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  const agency = await db.getAgency(req.user.id)
  res.json(agency || null)
})

router.put('/', requireAuth, async (req, res) => {
  const allowed = ['agent_name', 'agency_name', 'areas_served', 'specialties', 'working_hours', 'tone', 'greeting', 'about', 'currency']
  const fields = {}
  for (const key of allowed) {
    if (key in req.body) fields[key] = req.body[key]
  }
  const updated = await db.saveAgency(req.user.id, fields)
  res.json(updated)
})

export default router
