import { readFileSync } from 'fs'

// Handles both WhatsApp export date formats:
// US:            [6/24/26, 10:30:15 AM] Name: message
// International: [24/06/2026, 22:30:15] Name: message
const LINE_REGEX = /^\[(\d{1,2})[\/.](\d{1,2})[\/.](\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\]\s*([^:]+):\s*(.+)$/

const MEDIA_PLACEHOLDERS = [
  '<Media omitted>', 'image omitted', 'video omitted', 'audio omitted',
  'document omitted', 'sticker omitted', 'GIF omitted', 'Contact card omitted',
  'This message was deleted', 'You deleted this message'
]

export function parseExport(filePath, userName) {
  const content = readFileSync(filePath, 'utf8')
  const lines = content.split('\n')
  const messages = []
  let currentMsg = null

  for (const line of lines) {
    const match = line.match(LINE_REGEX)
    if (match) {
      if (currentMsg) messages.push(currentMsg)
      const [, , , , , sender, body] = match
      const trimmedBody = body.trim()
      if (MEDIA_PLACEHOLDERS.some(p => trimmedBody.includes(p))) {
        currentMsg = null
        continue
      }
      const isUser = sender.trim().toLowerCase().startsWith(userName.toLowerCase())
      currentMsg = {
        sender: sender.trim(),
        body: trimmedBody,
        direction: isUser ? 'outbound' : 'inbound',
        contactName: isUser ? null : sender.trim()
      }
    } else if (currentMsg && line.trim()) {
      // Multi-line message continuation
      currentMsg.body += '\n' + line.trim()
    }
  }
  if (currentMsg) messages.push(currentMsg)

  // Extract contact name from the filename or inbound messages
  const contactName = messages.find(m => m.direction === 'inbound')?.contactName || 'Unknown'

  return { contactName, messages }
}

export function extractUserMessages(filePath, userName) {
  const { messages } = parseExport(filePath, userName)
  return messages.filter(m => m.direction === 'outbound').map(m => m.body)
}
