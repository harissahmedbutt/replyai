import { Router } from 'express'
import multer from 'multer'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { db } from '../db.js'
import { buildPersona } from '../services/persona.js'
import { parseExport } from '../services/parser.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

// Upload chat exports to build persona + populate contact history
router.post('/exports', requireAuth, upload.array('exports', 20), async (req, res) => {
  const userId = req.user.id
  const user = await db.getUserById(userId)
  const userName = user.name || 'Me'

  if (!req.files?.length) return res.status(400).json({ error: 'No files uploaded' })

  const tmpPaths = []
  try {
    // Write to temp files
    for (const file of req.files) {
      const tmpPath = join(tmpdir(), `replyai-${Date.now()}-${file.originalname}`)
      writeFileSync(tmpPath, file.buffer)
      tmpPaths.push(tmpPath)
    }

    // Import chat history into DB
    let totalMessages = 0
    for (const tmpPath of tmpPaths) {
      try {
        const { contactName, messages } = parseExport(tmpPath, userName)
        const contact = await db.getOrCreateContact(userId, `imported_${contactName}`, contactName)

        for (const msg of messages) {
          await db.saveMessage(userId, contact.id, msg.direction, msg.body, null)
        }
        totalMessages += messages.length
      } catch (e) {
        console.error(`Parse error for file:`, e.message)
      }
    }

    // Build persona from all user messages
    const personaDoc = await buildPersona(userId, tmpPaths, userName)

    res.json({
      success: true,
      totalMessages,
      personaBuilt: true,
      personaPreview: personaDoc.slice(0, 300) + '...'
    })
  } finally {
    tmpPaths.forEach(p => { try { unlinkSync(p) } catch {} })
  }
})

router.get('/persona', requireAuth, async (req, res) => {
  const persona = await db.getPersona(req.user.id)
  res.json({ persona: persona?.persona_doc || null, lastBuilt: persona?.last_built_at || null })
})

router.put('/persona', requireAuth, async (req, res) => {
  const { persona_doc } = req.body
  if (!persona_doc) return res.status(400).json({ error: 'persona_doc required' })
  const updated = await db.savePersona(req.user.id, persona_doc)
  res.json({ success: true, persona: updated })
})

export default router
