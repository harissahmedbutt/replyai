import Anthropic from '@anthropic-ai/sdk'
import { db } from '../db.js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function generateDraft(userId, contact, incomingMessage) {
  const [persona, messages] = await Promise.all([
    db.getPersona(userId),
    db.getRecentMessages(contact.id, 30)
  ])

  const systemPrompt = buildSystemPrompt(persona?.persona_doc, contact)

  const history = messages.map(m => ({
    role: m.direction === 'outbound' ? 'assistant' : 'user',
    content: m.body
  }))

  history.push({ role: 'user', content: incomingMessage })

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 500,
    system: systemPrompt,
    messages: history
  })

  return response.content[0].text.trim()
}

export async function summarizeContact(userId, contact) {
  const messages = await db.getMessagesForContact(userId, contact.id)
  if (messages.length === 0) return 'No conversation history yet.'

  const transcript = messages.map(m =>
    `[${m.direction === 'outbound' ? 'You' : contact.display_name}]: ${m.body}`
  ).join('\n')

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `Here is a WhatsApp conversation history. Give a concise summary covering: who this person is, what you've discussed, any open threads or commitments, and the overall relationship tone.\n\n${transcript}`
    }]
  })

  return response.content[0].text.trim()
}

export async function handleQuery(userId, query, waNumbers) {
  const lowerQuery = query.toLowerCase().trim()

  // "summarize [name]"
  const summarizeMatch = lowerQuery.match(/^summarize\s+(.+)/)
  if (summarizeMatch) {
    const name = summarizeMatch[1].trim()
    const contacts = await db.findContactByName(userId, name)
    if (!contacts.length) return `No contact found matching "${name}".`
    const contact = contacts[0]
    const summary = await summarizeContact(userId, contact)
    return `*${contact.display_name}*\n\n${summary}`
  }

  // "today"
  if (lowerQuery === 'today') {
    const rows = await db.getTodaysContacts(userId)
    if (!rows.length) return 'No messages received today.'
    const seen = new Set()
    const lines = rows.filter(r => {
      if (seen.has(r.contact_id)) return false
      seen.add(r.contact_id); return true
    }).map(r => `• *${r.contacts.display_name}*: "${r.body.slice(0, 60)}${r.body.length > 60 ? '…' : ''}"`)
    return `Messages today:\n\n${lines.join('\n')}`
  }

  // "catch me up"
  if (lowerQuery === 'catch me up') {
    const pending = await db.getPendingDrafts(userId)
    if (!pending.length) return 'No pending conversations.'
    const lines = pending.map(d => `• *${d.contacts.display_name}* — draft ready`)
    return `${pending.length} conversations waiting:\n\n${lines.join('\n')}\n\nReply *ok [name]* to send a draft.`
  }

  // "who messaged me today?" — alias
  if (lowerQuery.includes('messaged') && lowerQuery.includes('today')) {
    const rows = await db.getTodaysContacts(userId)
    if (!rows.length) return 'No messages received today.'
    const seen = new Set()
    const names = rows.filter(r => {
      if (seen.has(r.contact_id)) return false
      seen.add(r.contact_id); return true
    }).map(r => r.contacts.display_name)
    return `Today's messages from: ${names.join(', ')}`
  }

  // Fallback: ask Claude
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 400,
    system: 'You are a helpful WhatsApp assistant. Answer the user\'s question about their messages concisely.',
    messages: [{ role: 'user', content: query }]
  })
  return response.content[0].text.trim()
}

export async function updateContactSummary(userId, contact) {
  const summary = await summarizeContact(userId, contact)
  await db.updateContact(contact.id, { profile_summary: summary })
  return summary
}

function buildSystemPrompt(personaDoc, contact) {
  let prompt = `You are a WhatsApp messaging assistant writing on behalf of the user. Your job is to draft a natural, authentic reply that sounds exactly like the user.\n\n`

  if (personaDoc) {
    prompt += `USER'S COMMUNICATION STYLE:\n${personaDoc}\n\n`
  } else {
    prompt += `Write in a natural, conversational tone. Keep replies concise and to the point.\n\n`
  }

  if (contact.profile_summary) {
    prompt += `CONTEXT ABOUT ${contact.display_name.toUpperCase()}:\n${contact.profile_summary}\n\n`
  }

  if (contact.notes) {
    prompt += `NOTES: ${contact.notes}\n\n`
  }

  prompt += `Write only the reply text. No quotes, no explanation, no preamble. Just the message itself.`
  return prompt
}
