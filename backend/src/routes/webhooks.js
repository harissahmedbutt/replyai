import { Router } from 'express'
import { db } from '../db.js'
import { generateDraft, handleQuery } from '../services/agent.js'
import { sendWhatsApp, sendDraftNotification, sendControl } from '../services/twilio.js'
import { enqueue } from '../services/queue.js'

const router = Router()

// All Twilio WhatsApp messages hit this endpoint
router.post('/whatsapp', async (req, res) => {
  res.sendStatus(200) // Acknowledge immediately

  const { To, From, Body, MessageSid } = req.body
  if (!To || !From || !Body) return

  const toNumber = To.replace('whatsapp:', '')
  const fromNumber = From.replace('whatsapp:', '')
  const body = Body.trim()

  try {
    // Determine if this is an agent number or control number message
    const [agentMatch, controlMatch] = await Promise.all([
      db.getUserByAgentNumber(To),
      db.getUserByControlNumber(To)
    ])

    if (agentMatch) {
      await handleAgentMessage(agentMatch, fromNumber, body, MessageSid)
    } else if (controlMatch) {
      await handleControlMessage(controlMatch, fromNumber, body)
    }
  } catch (e) {
    console.error('Webhook error:', e.message)
  }
})

async function handleAgentMessage(waRecord, fromNumber, body, messageSid) {
  const user = waRecord.users
  const settings = await db.getSettings(user.id)

  if (!settings.active) return

  // Filter groups (group JIDs contain @g.us)
  if (fromNumber.includes('@g.us') && !settings.reply_groups) return

  const contact = await db.getOrCreateContact(user.id, fromNumber, fromNumber)
  await db.saveMessage(user.id, contact.id, 'inbound', body, messageSid)

  const queueKey = `${user.id}:${contact.id}`
  enqueue(queueKey, async () => {
    const draft = await generateDraft(user.id, contact, body)
    const savedDraft = await db.saveDraft(user.id, contact.id, draft)

    if (settings.auto_reply) {
      await sendWhatsApp(fromNumber, waRecord.agent_number, draft)
      await db.saveMessage(user.id, contact.id, 'outbound', draft, null)
      await db.updateDraftStatus(savedDraft.id, 'sent')
    } else {
      await sendDraftNotification(
        waRecord.control_number,
        user.personal_wa_number,
        contact.display_name,
        body,
        draft
      )
    }
  })
}

async function handleControlMessage(waRecord, fromNumber, body) {
  const user = waRecord.users
  const waNumbers = waRecord
  const lower = body.toLowerCase().trim()

  // Settings commands
  if (lower === 'auto on') {
    await db.updateSettings(user.id, { auto_reply: true })
    return sendControl(waNumbers.control_number, user.personal_wa_number, '✅ Auto-reply enabled. Agent will reply immediately without asking you.')
  }
  if (lower === 'auto off') {
    await db.updateSettings(user.id, { auto_reply: false })
    return sendControl(waNumbers.control_number, user.personal_wa_number, '✅ Draft mode on. I\'ll ask before sending.')
  }
  if (lower === 'pause') {
    await db.updateSettings(user.id, { active: false })
    return sendControl(waNumbers.control_number, user.personal_wa_number, '⏸ Agent paused. Send *resume* to re-enable.')
  }
  if (lower === 'resume') {
    await db.updateSettings(user.id, { active: true })
    return sendControl(waNumbers.control_number, user.personal_wa_number, '▶️ Agent resumed.')
  }
  if (lower === 'groups on') {
    await db.updateSettings(user.id, { reply_groups: true })
    return sendControl(waNumbers.control_number, user.personal_wa_number, '✅ Group replies enabled.')
  }
  if (lower === 'groups off') {
    await db.updateSettings(user.id, { reply_groups: false })
    return sendControl(waNumbers.control_number, user.personal_wa_number, '✅ Group replies disabled.')
  }

  // Draft commands
  if (lower === 'ok' || lower === 'send') {
    return handleSendCommand(user, waNumbers, null)
  }
  const okNameMatch = lower.match(/^ok\s+(.+)/) || lower.match(/^send\s+(.+)/)
  if (okNameMatch) {
    return handleSendCommand(user, waNumbers, okNameMatch[1].trim())
  }

  const editMatch = body.match(/^edit\s+(.+)/i)
  if (editMatch) {
    return handleEditCommand(user, waNumbers, editMatch[1].trim(), null)
  }

  if (lower === 'skip') {
    return handleSkipCommand(user, waNumbers, null)
  }
  const skipNameMatch = lower.match(/^skip\s+(.+)/)
  if (skipNameMatch) {
    return handleSkipCommand(user, waNumbers, skipNameMatch[1].trim())
  }

  // Query interface
  const queryResult = await handleQuery(user.id, body, waNumbers)
  return sendControl(waNumbers.control_number, user.personal_wa_number, queryResult)
}

async function handleSendCommand(user, waNumbers, contactName) {
  const draft = contactName
    ? await getDraftByName(user.id, contactName)
    : await db.getLatestPendingDraft(user.id)

  if (!draft) {
    const msg = contactName ? `No pending draft for "${contactName}".` : 'No pending drafts.'
    return sendControl(waNumbers.control_number, user.personal_wa_number, msg)
  }

  const contact = await db.getOrCreateContact(user.id, draft.contact_id, draft.contacts.display_name)
  await sendWhatsApp(contact.wa_id, waNumbers.agent_number, draft.draft_text)
  await db.saveMessage(user.id, contact.id, 'outbound', draft.draft_text, null)
  await db.updateDraftStatus(draft.id, 'sent')
  return sendControl(waNumbers.control_number, user.personal_wa_number, `✅ Sent to ${draft.contacts.display_name}.`)
}

async function handleEditCommand(user, waNumbers, newText, contactName) {
  const draft = contactName
    ? await getDraftByName(user.id, contactName)
    : await db.getLatestPendingDraft(user.id)

  if (!draft) return sendControl(waNumbers.control_number, user.personal_wa_number, 'No pending draft to edit.')

  const contact = await db.getOrCreateContact(user.id, draft.contact_id, draft.contacts.display_name)
  await sendWhatsApp(contact.wa_id, waNumbers.agent_number, newText)
  await db.saveMessage(user.id, contact.id, 'outbound', newText, null)
  await db.updateDraftStatus(draft.id, 'edited')
  return sendControl(waNumbers.control_number, user.personal_wa_number, `✅ Your version sent to ${draft.contacts.display_name}.`)
}

async function handleSkipCommand(user, waNumbers, contactName) {
  const draft = contactName
    ? await getDraftByName(user.id, contactName)
    : await db.getLatestPendingDraft(user.id)

  if (!draft) return sendControl(waNumbers.control_number, user.personal_wa_number, 'No pending draft to skip.')

  await db.updateDraftStatus(draft.id, 'dismissed')
  return sendControl(waNumbers.control_number, user.personal_wa_number, `⏭ Skipped ${draft.contacts.display_name}.`)
}

async function getDraftByName(userId, name) {
  const contacts = await db.findContactByName(userId, name)
  if (!contacts.length) return null
  for (const c of contacts) {
    const draft = await db.getPendingDraft(userId, c.id)
    if (draft) return draft
  }
  return null
}

export default router
