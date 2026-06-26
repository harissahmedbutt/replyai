import twilio from 'twilio'
import 'dotenv/config'

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

export async function provisionNumbers() {
  const webhookUrl = process.env.TWILIO_WEBHOOK_URL + '/webhooks/whatsapp'

  const [agentNum, controlNum] = await Promise.all([
    client.incomingPhoneNumbers.create({
      areaCode: '415',
      smsMethod: 'POST',
      smsUrl: webhookUrl,
    }),
    client.incomingPhoneNumbers.create({
      areaCode: '415',
      smsMethod: 'POST',
      smsUrl: webhookUrl,
    })
  ])

  return {
    agentNumber: `whatsapp:${agentNum.phoneNumber}`,
    controlNumber: `whatsapp:${controlNum.phoneNumber}`,
    agentSid: agentNum.sid,
    controlSid: controlNum.sid
  }
}

export async function sendWhatsApp(to, from, body) {
  const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`
  const fromFormatted = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`
  return client.messages.create({ to: toFormatted, from: fromFormatted, body })
}

export async function sendDraftNotification(controlNumber, userPersonalNumber, contactName, theirMessage, draftText) {
  const body =
    `📩 *${contactName}*\n"${theirMessage}"\n\n` +
    `Draft reply:\n_${draftText}_\n\n` +
    `Reply *ok* to send · *edit [your text]* to change · *skip* to dismiss`

  return sendWhatsApp(userPersonalNumber, controlNumber, body)
}

export async function sendControl(controlNumber, userPersonalNumber, message) {
  return sendWhatsApp(userPersonalNumber, controlNumber, message)
}

// Hot-lead alert pushed to the agent's personal WhatsApp.
export async function sendLeadAlert(controlNumber, userPersonalNumber, lead) {
  const bits = []
  if (lead.intent && lead.intent !== 'unknown') bits.push(lead.intent)
  if (lead.bedrooms && lead.bedrooms !== 'unknown') bits.push(`${lead.bedrooms} BR`)
  if (lead.areas && lead.areas.length) bits.push(lead.areas.join(', '))
  if (lead.budget_max) bits.push(`≤ ${Math.round(lead.budget_max / 1000)}k AED`)
  if (lead.timeline && lead.timeline !== 'unknown') bits.push(`timeline ${lead.timeline}`)
  const summary = bits.length ? bits.join(' · ') : 'details still coming in'
  const body =
    `🔥 *Hot lead* — ${lead.display_name}\n` +
    `${summary}\n\n` +
    `They're qualified and ready. Jump in to close it.`
  return sendWhatsApp(userPersonalNumber, controlNumber, body)
}
