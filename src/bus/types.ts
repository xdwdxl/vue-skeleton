/**
 * Types for CIDS Bus
 * @author Lorin Luo
 */
export type Meta = {
  tenantId?: string
  userId?: string
  roles?: string[]
  origin?: string
  traceId?: string
  spanId?: string
  priority?: 'low' | 'normal' | 'high'
  ttl?: number
  version?: string
  ts?: number
  correlationId?: string
  replyTo?: string
}

export type Envelope<T = unknown> = {
  id: string
  topic: string
  payload: T
  meta?: Meta
  replyTo?: string
  ts: number
  version: string
}

export interface Bus {
  publish<T = unknown>(topic: string, payload: T, meta?: Meta): void
  subscribe(topic: string, handler: (msg: Envelope) => void, opts?: { once?: boolean; filter?: (m: Envelope) => boolean }): () => void
  request<T, R = unknown>(topic: string, payload: T, opts?: { timeout?: number }): Promise<R>
  reply<T, R = unknown>(topic: string, handler: (payload: T, meta?: Meta) => Promise<R> | R): () => void
  once(topic: string, handler: (msg: Envelope) => void): () => void
  unsubscribe(topic: string, handler?: (msg: Envelope) => void): void
  registerApp(appId: string, caps?: string[], opts?: { allowTopics?: string[]; denyTopics?: string[]; rateLimit?: number }): void
}

