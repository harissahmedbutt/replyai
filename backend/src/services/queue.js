// Per-contact debounced message queue
// Batches rapid messages from the same contact before processing
const queues = new Map()
const DEBOUNCE_MS = 3000

export function enqueue(key, handler) {
  if (queues.has(key)) {
    clearTimeout(queues.get(key).timer)
  }
  const timer = setTimeout(async () => {
    queues.delete(key)
    try {
      await handler()
    } catch (e) {
      console.error(`Queue handler error for ${key}:`, e.message)
    }
  }, DEBOUNCE_MS)
  queues.set(key, { timer })
}
