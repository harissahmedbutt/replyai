import { Router } from 'express'
import { db } from '../db.js'
import { qualifyAndReply, handleQuery } from '../services/agent.js'
import { sendWhatsApp, sendDraftNotification, sendControl, sendLeadAlert } from '../services/twilio.js'
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
    // Sandbox mode: single number acts as both agent and control
    // Commands (ok/edit/skip/summarize etc) → control flow
    // Everything else → agent flow (generate draft)
    const SANDBOX_NUMBER = process.env.TWILIO_SANDBOX_NUMBER
    const isSandbox = SANDBOX_NUMBER && (To === `whatsapp:${SANDBOX_NUMBER}` || To === SANDBOX_NUMBER)

    if (isSandbox) {
      // Find user by their personal WA number
      const { data: user } = await db.supabase
        .from('users').select('*').eq('personal_wa_number', fromNumber).single()
      if (!user) {
        console.log(`No user found for number ${fromNumber}`)
        return
      }
      const waRecord = await db.getWaNumbers(user.id)
      const isCommand = /^(ok|send|edit|skip|summarize|today|catch me up|auto|pause|resume|groups)/i.test(body)
      if (isCommand) {
        await handleControlMessage({ users: user, ...waRecord, control_number: To, agent_number: To }, fromNumber, body)
      } else {
        await handleAgentMessage({ users: user, agent_number: To, control_number: To }, fromNumber, body, MessageSid)
      }
      return
    }

    // Production: two-number architecture
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
    // Re-fetch the lead so we carry forward already-extracted fields
    const lead = await db.getContactById(contact.id)
    const result = await qualifyAndReply(user.id, lead, body)

    // Merge the newly extracted qualification fields into the lead
    const updates = {
      intent: result.intent,
      budget_min: result.budget_min,
      budget_max: result.budget_max,
      areas: result.areas || [],
      bedrooms: result.bedrooms && result.bedrooms !== 'unknown' ? result.bedrooms : null,
      timeline: result.timeline,
      purpose: result.purpose,
      stage: result.stage,
      score: result.score
    }
    await db.updateContact(lead.id, updates)

    // settings.auto_reply = "auto-answer routine" mode (the default autonomy).
    // When off, the agent wants to approve EVERY message → escalate all.
    const escalate = result.escalate || !settings.auto_reply

    if (escalate) {
      // Draft the suggested reply for the agent to approve / edit / skip
      await db.saveDraft(user.id, lead.id, result.reply)
      await sendDraftNotification(
        waRecord.control_number,
        user.personal_wa_number,
        lead.display_name,
        body,
        result.reply
      )
    } else {
      // Routine → auto-send the reply to the lead immediately
      await sendWhatsApp(fromNumber, waRecord.agent_number, result.reply)
      await db.saveMessage(user.id, lead.id, 'outbound', result.reply, null)
    }

    // Fire a hot-lead alert the moment a lead turns hot (cold/warm → hot)
    if (result.score === 'hot' && lead.score !== 'hot') {
      await sendLeadAlert(waRecord.control_number, user.personal_wa_number, { ...lead, ...updates, display_name: lead.display_name })
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

  const contact = await db.getContactById(draft.contact_id)
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

  const contact = await db.getContactById(draft.contact_id)
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
