import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export const db = {
  // Users
  async getUserByEmail(email) {
    const { data } = await supabase.from('users').select('*').eq('email', email).single()
    return data
  },
  async getUserById(id) {
    const { data } = await supabase.from('users').select('*').eq('id', id).single()
    return data
  },
  async getUserByAgentNumber(number) {
    const { data } = await supabase
      .from('wa_numbers').select('*, users(*)').eq('agent_number', number).single()
    return data
  },
  async getUserByControlNumber(number) {
    const { data } = await supabase
      .from('wa_numbers').select('*, users(*)').eq('control_number', number).single()
    return data
  },

  // WA Numbers
  async getWaNumbers(userId) {
    const { data } = await supabase.from('wa_numbers').select('*').eq('user_id', userId).single()
    return data
  },
  async saveWaNumbers(userId, agentNumber, controlNumber, agentSid, controlSid) {
    const { data } = await supabase.from('wa_numbers').upsert({
      user_id: userId, agent_number: agentNumber, control_number: controlNumber,
      twilio_sid_agent: agentSid, twilio_sid_control: controlSid, status: 'active'
    }).select().single()
    return data
  },

  // Contacts
  async getOrCreateContact(userId, waId, displayName) {
    const { data: existing } = await supabase
      .from('contacts').select('*').eq('user_id', userId).eq('wa_id', waId).single()
    if (existing) return existing
    const { data } = await supabase.from('contacts').insert({
      user_id: userId, wa_id: waId, display_name: displayName, key_facts: {}
    }).select().single()
    return data
  },
  async updateContact(contactId, updates) {
    const { data } = await supabase.from('contacts').update(updates).eq('id', contactId).select().single()
    return data
  },
  async getContacts(userId) {
    const { data } = await supabase.from('contacts').select('*')
      .eq('user_id', userId).order('last_message_at', { ascending: false })
    return data || []
  },
  async findContactByName(userId, name) {
    const { data } = await supabase.from('contacts').select('*')
      .eq('user_id', userId).ilike('display_name', `%${name}%`)
    return data || []
  },

  // Messages
  async saveMessage(userId, contactId, direction, body, waMessageId) {
    const { data } = await supabase.from('messages').insert({
      user_id: userId, contact_id: contactId, direction, body, wa_message_id: waMessageId,
      timestamp: new Date().toISOString()
    }).select().single()
    await supabase.from('contacts').update({ last_message_at: new Date().toISOString() }).eq('id', contactId)
    return data
  },
  async getRecentMessages(contactId, limit = 30) {
    const { data } = await supabase.from('messages').select('*')
      .eq('contact_id', contactId).order('timestamp', { ascending: false }).limit(limit)
    return (data || []).reverse()
  },
  async getMessagesForContact(userId, contactId) {
    const { data } = await supabase.from('messages').select('*')
      .eq('user_id', userId).eq('contact_id', contactId).order('timestamp', { ascending: true })
    return data || []
  },
  async getTodaysContacts(userId) {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const { data } = await supabase.from('messages').select('contact_id, contacts(display_name), body, timestamp')
      .eq('user_id', userId).eq('direction', 'inbound').gte('timestamp', today.toISOString())
      .order('timestamp', { ascending: false })
    return data || []
  },

  // Drafts
  async saveDraft(userId, contactId, draftText) {
    const { data } = await supabase.from('drafts').insert({
      user_id: userId, contact_id: contactId, draft_text: draftText, status: 'pending'
    }).select().single()
    return data
  },
  async getPendingDraft(userId, contactId) {
    const { data } = await supabase.from('drafts').select('*, contacts(display_name)')
      .eq('user_id', userId).eq('contact_id', contactId).eq('status', 'pending')
      .order('created_at', { ascending: false }).limit(1).single()
    return data
  },
  async getLatestPendingDraft(userId) {
    const { data } = await supabase.from('drafts').select('*, contacts(display_name)')
      .eq('user_id', userId).eq('status', 'pending')
      .order('created_at', { ascending: false }).limit(1).single()
    return data
  },
  async updateDraftStatus(draftId, status) {
    await supabase.from('drafts').update({ status, actioned_at: new Date().toISOString() }).eq('id', draftId)
  },
  async getPendingDrafts(userId) {
    const { data } = await supabase.from('drafts').select('*, contacts(display_name)')
      .eq('user_id', userId).eq('status', 'pending').order('created_at', { ascending: false })
    return data || []
  },
  async getPendingDraftById(id, userId) {
    const { data } = await supabase.from('drafts').select('*, contacts(display_name, wa_id)')
      .eq('id', id).eq('user_id', userId).single()
    return data
  },
  async getContactById(id) {
    const { data } = await supabase.from('contacts').select('*').eq('id', id).single()
    return data
  },

  // Persona
  async getPersona(userId) {
    const { data } = await supabase.from('personas').select('*').eq('user_id', userId).single()
    return data
  },
  async savePersona(userId, personaDoc) {
    const { data } = await supabase.from('personas').upsert({
      user_id: userId, persona_doc: personaDoc, last_built_at: new Date().toISOString()
    }).select().single()
    return data
  },

  // Settings
  async getSettings(userId) {
    const { data } = await supabase.from('settings').select('*').eq('user_id', userId).single()
    return data || { auto_reply: false, reply_groups: false, reply_unknown: true, active: true, draft_expiry_mins: 30 }
  },
  async updateSettings(userId, updates) {
    const { data } = await supabase.from('settings').upsert({ user_id: userId, ...updates }).select().single()
    return data
  },

  // Usage
  async incrementDraftCount(userId) {
    await supabase.rpc('increment_draft_count', { uid: userId })
  },
  async getDraftCount(userId) {
    const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0)
    const { count } = await supabase.from('drafts').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).gte('created_at', start.toISOString())
    return count || 0
  }
}
