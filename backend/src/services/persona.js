import Anthropic from '@anthropic-ai/sdk'
import { extractUserMessages } from './parser.js'
import { db } from '../db.js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function buildPersona(userId, filePaths, userName) {
  const allMessages = []
  for (const fp of filePaths) {
    try {
      const msgs = extractUserMessages(fp, userName)
      allMessages.push(...msgs)
    } catch (e) {
      console.error(`Failed to parse ${fp}:`, e.message)
    }
  }

  if (allMessages.length < 20) {
    throw new Error('Not enough messages to build a persona. Upload more chat exports.')
  }

  // Sample up to 300 messages for the prompt (avoid token overload)
  const sample = allMessages.length > 300
    ? allMessages.sort(() => Math.random() - 0.5).slice(0, 300)
    : allMessages

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `Analyze the following WhatsApp messages written by one person and build a persona document that captures their unique communication style. Cover:
- Writing style (formal vs casual, sentence structure)
- Vocabulary and common phrases/expressions
- Emoji usage patterns (which ones, how often, where in messages)
- Message length patterns (short punchy vs long explanatory)
- How they open and close conversations
- Tone shifts (how they talk to close friends vs professional contacts, if evident)
- Any notable quirks or patterns

Be specific and use real examples from the messages. This will be used to make an AI sound exactly like this person.

MESSAGES:
${sample.map((m, i) => `${i + 1}. ${m}`).join('\n')}`
    }]
  })

  const personaDoc = response.content[0].text.trim()
  await db.savePersona(userId, personaDoc)
  return personaDoc
}
