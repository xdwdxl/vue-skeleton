/**
 * CIDS Bus core implementation
 * @author Lorin Luo
 */
import type { Bus, Envelope, Meta } from './types'
import { BroadcastAdapter } from './adapters/broadcast'

type HandlerEntry = { fn: (msg: Envelope) => void; once?: boolean; filter?: (m: Envelope) => boolean }

function genId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const rnd = new Uint8Array(8)
      crypto.getRandomValues(rnd)
      const hex = Array.from(rnd, (b) => b.toString(16).padStart(2, '0')).join('')
      return `m_${Date.now()}_${hex}`
    }
    throw new Error('Secure random number generator not available')
  }
}

export class CoreBus implements Bus {
  private readonly subs = new Map<string, Set<HandlerEntry>>()
  private readonly bc?: BroadcastAdapter
  private readonly version = '1.0.0'
  private appId = 'portal'
  private allowTopics?: string[]
  private denyTopics?: string[]

  constructor(opts?: { broadcastChannel?: string }) {
    if (opts?.broadcastChannel) {
      this.bc = new BroadcastAdapter(opts.broadcastChannel, (env) => {
        this.deliver(env)
      })
    }
  }

  /**
   * Register application capabilities
   * @param {string} appId - Application ID
   * @param {string[]} [_caps] - Capabilities (optional)
   * @param {Object} [opts] - Options
   */
  registerApp(appId: string, _caps?: string[], opts?: { allowTopics?: string[]; denyTopics?: string[] }): void {
    this.appId = appId
    this.allowTopics = opts?.allowTopics
    this.denyTopics = opts?.denyTopics
  }

  /**
   * Publish message to topic
   * @param {string} topic - Target topic
   * @param {any} payload - Message payload
   * @param {Meta} [meta] - Metadata
   */
  publish<T = unknown>(topic: string, payload: T, meta?: Meta): void {
    if (this.denyTopics?.some((p) => this.matchTopic(topic, p))) return
    if (!topic.startsWith('reply:') && this.allowTopics && !this.allowTopics.some((p) => this.matchTopic(topic, p))) return
    const origin = (meta?.origin ?? 'local')
    const env: Envelope<T> = {
      id: genId(),
      topic,
      payload,
      meta: { ...(meta || {}), origin, ts: Date.now() },
      ts: Date.now(),
      version: this.version,
    }
    this.deliver(env)
    if (origin !== 'sse') {
      this.bc?.publish({ ...env, meta: { ...(env.meta || {}), origin: 'broadcast' } })
    }
  }

  /**
   * Subscribe to topic
   * @param {string} topic - Topic to subscribe
   * @param {Function} handler - Message handler
   * @param {Object} [opts] - Options
   * @returns {Function} - Unsubscribe function
   */
  subscribe(topic: string, handler: (msg: Envelope) => void, opts?: { once?: boolean; filter?: (m: Envelope) => boolean }): () => void {
    const set = this.subs.get(topic) || new Set<HandlerEntry>()
    const entry: HandlerEntry = { fn: handler, once: !!opts?.once, filter: opts?.filter }
    set.add(entry)
    this.subs.set(topic, set)
    return () => set.delete(entry)
  }

  /**
   * Subscribe once
   * @param {string} topic - Topic
   * @param {Function} handler - Handler
   * @returns {Function} - Unsubscribe function
   */
  once(topic: string, handler: (msg: Envelope) => void): () => void {
    return this.subscribe(topic, handler, { once: true })
  }

  /**
   * Unsubscribe handler
   * @param {string} topic - Topic
   * @param {(msg: Envelope) => void} [handler] - Handler to remove (if omitted, clears all for topic)
   */
  unsubscribe(topic: string, handler?: (msg: Envelope) => void): void {
    const set = this.subs.get(topic)
    if (!set) return
    if (!handler) { set.clear(); return }
    for (const entry of set) { if (entry.fn === handler) { set.delete(entry); break } }
  }

  /**
   * Request-Reply pattern
   * @param {string} topic - Topic
   * @param {any} payload - Payload
   * @param {Object} [opts] - Options
   * @returns {Promise<any>} - Response payload
   */
  async request<T, R = unknown>(topic: string, payload: T, opts?: { timeout?: number }): Promise<R> {
    const replyTo = `reply:${genId()}`
    const timeout = Math.max(0, Number(opts?.timeout ?? 5000))
    return new Promise<R>((resolve, reject) => {
      const off = this.once(replyTo, (msg) => { off(); resolve(msg.payload as R) })
      const timer = setTimeout(() => { off(); reject(new Error('timeout')) }, timeout)
      try {
        this.publish<T>(topic, payload, { replyTo, correlationId: replyTo })
      } catch (e) {
        clearTimeout(timer)
        off()
        reject(e instanceof Error ? e : new Error(String(e)))
      }
    })
  }

  /**
   * Handle request and reply
   * @param {string} topic - Topic
   * @param {Function} handler - Request handler
   * @returns {Function} - Unsubscribe function
   */
  reply<T, R = unknown>(topic: string, handler: (payload: T, meta?: Meta) => Promise<R> | R): () => void {
    const off = this.subscribe(topic, async (msg) => {
      const rt = msg.replyTo ?? msg.meta?.replyTo
      if (!rt) return
      try {
        const result = await handler(msg.payload as T, msg.meta)
        this.publish<R>(rt, result, { correlationId: msg.meta?.correlationId })
      } catch {}
    })
    return off
  }

  private deliver(env: Envelope): void {
    // Exact match
    this.dispatch(env, this.subs.get(env.topic))

    // Wildcard match
    for (const [pattern, set] of this.subs) {
      if (pattern.includes('*') && pattern !== env.topic && this.matchTopic(env.topic, pattern)) {
        this.dispatch(env, set)
      }
    }
  }

  private dispatch(env: Envelope, set?: Set<HandlerEntry>): void {
    if (!set || set.size === 0) return
    for (const entry of Array.from(set)) {
      try {
        if (entry.filter && !entry.filter(env)) continue
        entry.fn(env)
      } finally {
        if (entry.once) set.delete(entry)
      }
    }
  }

  private matchTopic(topic: string, pattern: string): boolean {
    if (pattern === topic) return true
    if (pattern.endsWith('*')) return topic.startsWith(pattern.slice(0, -1))
    return false
  }
}
