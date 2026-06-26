import Anthropic from '@anthropic-ai/sdk'
import { db } from '../db.js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MODEL = 'claude-opus-4-8'

// Structured output schema for the qualification brain.
// One call returns the reply to send AND the extracted lead data + routing decision.
const QUALIFY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    reply: { type: 'string', description: 'The WhatsApp message to send back to the lead, in the agency voice.' },
    intent: { type: 'string', enum: ['buy', 'rent', 'sell', 'unknown'] },
    budget_min: { type: ['number', 'null'], description: 'Lower budget in AED, or null if unknown.' },
    budget_max: { type: ['number', 'null'], description: 'Upper budget in AED, or null if unknown.' },
    areas: { type: 'array', items: { type: 'string' }, description: 'Dubai areas of interest, e.g. ["Dubai Marina","JLT"].' },
    bedrooms: { type: 'string', enum: ['studio', '1', '2', '3', '4+', 'unknown'] },
    timeline: { type: 'string', enum: ['asap', '1-3m', '3-6m', 'browsing', 'unknown'] },
    purpose: { type: 'string', enum: ['investment', 'end-use', 'unknown'] },
    stage: { type: 'string', enum: ['new', 'qualifying', 'qualified', 'viewing', 'negotiating'] },
    score: { type: 'string', enum: ['hot', 'warm', 'cold'] },
    escalate: { type: 'boolean', description: 'True if a human agent must handle this (negotiation, viewing confirmation, or anything you are unsure about).' },
    escalation_reason: { type: 'string', description: 'Short reason if escalate is true, else empty string.' }
  },
  required: ['reply', 'intent', 'budget_min', 'budget_max', 'areas', 'bedrooms', 'timeline', 'purpose', 'stage', 'score', 'escalate', 'escalation_reason']
}

// Qualify a lead and produce a reply + extracted fields + routing decision in one call.
export async function qualifyAndReply(userId, lead, incomingMessage) {
  const [agency, messages] = await Promise.all([
    db.getAgency(userId),
    db.getRecentMessages(lead.id, 30)
  ])

  const systemPrompt = buildSystemPrompt(agency, lead)

  const history = messages.map(m => ({
    role: m.direction === 'outbound' ? 'assistant' : 'user',
    content: m.body
  }))
  history.push({ role: 'user', content: incomingMessage })

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 800,
    system: systemPrompt,
    messages: history,
    output_config: { format: { type: 'json_schema', schema: QUALIFY_SCHEMA } }
  })

  const text = response.content.find(b => b.type === 'text')?.text || '{}'
  return JSON.parse(text)
}

function buildSystemPrompt(agency, lead) {
  const agentName = agency?.agent_name || 'the agent'
  const agencyName = agency?.agency_name || 'our agency'
  const areasServed = (agency?.areas_served && agency.areas_served.length)
    ? agency.areas_served.join(', ')
    : 'Dubai'
  const tone = agency?.tone || 'friendly, professional, and efficient'
  const hours = agency?.working_hours || 'standard business hours'
  const specialties = agency?.specialties ? `\nSpecialties: ${agency.specialties}` : ''

  let prompt = `You are the WhatsApp assistant for ${agentName} at ${agencyName}, a Dubai real-estate agent. You reply to incoming property leads on WhatsApp.

Your job on every incoming message:
1. Reply naturally in a ${tone} tone, as ${agentName} would. Keep it concise and WhatsApp-appropriate.
2. QUALIFY the lead by gathering, over the conversation: intent (buy or rent), preferred area(s), budget (in AED), number of bedrooms, timeline to move, and purpose (investment vs living). Ask for at most 1-2 missing details per message — never interrogate.
3. Answer routine questions (availability, general pricing ranges, area info, process) helpfully.

Market context: Dubai. Areas served: ${areasServed}. Currency is AED — interpret "k" as thousands and figures like "1.2m" as 1,200,000 AED; rents are usually quoted per year.${specialties}
Working hours: ${hours}.

ESCALATION — set escalate=true (and do NOT commit on the agent's behalf) when:
- The lead wants to negotiate price or make an offer.
- The lead wants to confirm a specific viewing time/date.
- The message needs a judgment call, legal/financial specifics, or anything you are unsure about.
When escalate=true, still write a warm holding reply (e.g. that ${agentName} will confirm shortly) — do not invent availability, prices, or appointment times.

LEAD SCORING:
- hot = qualified (clear intent + area + budget) AND ready soon (asap or 1-3m).
- warm = engaged and partially qualified.
- cold = vague, just browsing, or barely responsive.

STAGE: new (first contact) → qualifying (gathering details) → qualified (key details known) → viewing (a viewing is being arranged) → negotiating (discussing price/offer).

Extract every field you can infer from the whole conversation so far. Use null/"unknown" only when truly unknown. Output the reply plus all fields in the required JSON shape.`

  // Inject what we already know so the model doesn't re-ask.
  const known = []
  if (lead.intent && lead.intent !== 'unknown') known.push(`intent: ${lead.intent}`)
  if (lead.budget_min || lead.budget_max) known.push(`budget: ${lead.budget_min || '?'}–${lead.budget_max || '?'} AED`)
  if (lead.areas && lead.areas.length) known.push(`areas: ${lead.areas.join(', ')}`)
  if (lead.bedrooms) known.push(`bedrooms: ${lead.bedrooms}`)
  if (lead.timeline && lead.timeline !== 'unknown') known.push(`timeline: ${lead.timeline}`)
  if (lead.purpose && lead.purpose !== 'unknown') known.push(`purpose: ${lead.purpose}`)
  if (known.length) {
    prompt += `\n\nALREADY KNOWN about this lead (do not re-ask): ${known.join(' · ')}`
  }
  return prompt
}

// Full relationship summary for a lead (used by "summarize <name>").
export async function summarizeContact(userId, lead) {
  const messages = await db.getMessagesForContact(userId, lead.id)
  if (messages.length === 0) return 'No conversation history yet.'

  const transcript = messages.map(m =>
    `[${m.direction === 'outbound' ? 'You' : (lead.display_name || 'Lead')}]: ${m.body}`
  ).join('\n')

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `This is a WhatsApp conversation between a Dubai real-estate agent and a property lead. Give a tight summary: who the lead is, what they want (intent, area, budget AED, bedrooms, timeline, purpose), where the conversation stands, and the best next action for the agent.\n\n${transcript}`
    }]
  })

  return response.content.find(b => b.type === 'text')?.text.trim() || 'No summary available.'
}

// WhatsApp control-number queries about the pipeline.
export async function handleQuery(userId, query, waNumbers) {
  const lower = query.toLowerCase().trim()

  // "summarize [name]"
  const summarizeMatch = lower.match(/^summarize\s+(.+)/)
  if (summarizeMatch) {
    const name = summarizeMatch[1].trim()
    const contacts = await db.findContactByName(userId, name)
    if (!contacts.length) return `No lead found matching "${name}".`
    const lead = contacts[0]
    const summary = await summarizeContact(userId, lead)
    return `*${lead.display_name}*\n\n${summary}`
  }

  // "hot leads"
  if (lower.includes('hot')) {
    const leads = await db.getLeads(userId, { score: 'hot' })
    if (!leads.length) return 'No hot leads right now.'
    return `🔥 *Hot leads* (${leads.length}):\n\n` + leads.map(formatLeadLine).join('\n')
  }

  // "new leads" / "today"
  if (lower.includes('new') || lower === 'today') {
    const leads = await db.getLeads(userId, { stage: 'new' })
    const todays = await db.getTodaysContacts(userId)
    if (!leads.length && !todays.length) return 'No new leads today.'
    const seen = new Set()
    const lines = todays.filter(r => { if (seen.has(r.contact_id)) return false; seen.add(r.contact_id); return true })
      .map(r => `• *${r.contacts.display_name}*: "${r.body.slice(0, 50)}${r.body.length > 50 ? '…' : ''}"`)
    return `🆕 *Today's leads*:\n\n${lines.join('\n') || 'None'}`
  }

  // "follow up" / "follow ups"
  if (lower.includes('follow')) {
    const leads = await db.getLeads(userId, { stage: 'qualifying' })
    if (!leads.length) return 'No leads waiting on follow-up.'
    return `📋 *Needs follow-up* (${leads.length}):\n\n` + leads.map(formatLeadLine).join('\n')
  }

  // "leads in <area>"
  const areaMatch = lower.match(/leads?\s+(?:in|at)\s+(.+)/)
  if (areaMatch) {
    const area = areaMatch[1].trim()
    const leads = await db.getLeads(userId, { area })
    if (!leads.length) return `No leads looking in "${area}".`
    return `📍 *Leads in ${area}* (${leads.length}):\n\n` + leads.map(formatLeadLine).join('\n')
  }

  // Fallback: ask Claude
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: 'You are a helpful assistant for a Dubai real-estate agent managing WhatsApp leads. Answer the question concisely.',
    messages: [{ role: 'user', content: query }]
  })
  return response.content.find(b => b.type === 'text')?.text.trim() || 'Sorry, I could not process that.'
}

function formatLeadLine(l) {
  const bits = []
  if (l.intent && l.intent !== 'unknown') bits.push(l.intent)
  if (l.bedrooms) bits.push(`${l.bedrooms}BR`)
  if (l.areas && l.areas.length) bits.push(l.areas.join('/'))
  if (l.budget_max) bits.push(`≤${Math.round(l.budget_max / 1000)}k AED`)
  const detail = bits.length ? ` — ${bits.join(', ')}` : ''
  return `• *${l.display_name}*${detail} [${l.stage}]`
}
