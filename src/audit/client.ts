import bus from '../bus'
import { storage } from '../storage/singleton'
import type { AuditEvent, AuditQueueStatus } from './types'
import { API } from '../api'

type AuditClientConfig = {
  endpoint: string
  batchSize: number
  flushIntervalMs: number
  maxQueueSize: number
  storageKey: string
  storageTtlMs: number
}

const DEFAULTS: AuditClientConfig = {
  endpoint: (import.meta.env.VITE_AUDIT_ENDPOINT as string) || '/audit/events',
  batchSize: Math.max(1, Number(import.meta.env.VITE_AUDIT_BATCH_SIZE ?? 50)),
  flushIntervalMs: Math.max(1000, Number(import.meta.env.VITE_AUDIT_FLUSH_INTERVAL_MS ?? 3000)),
  maxQueueSize: Math.max(100, Number(import.meta.env.VITE_AUDIT_MAX_QUEUE_SIZE ?? 5000)),
  storageKey: 'audit.queue',
  storageTtlMs: Math.max(60_000, Number(import.meta.env.VITE_AUDIT_QUEUE_TTL_MS ?? 7 * 24 * 60 * 60 * 1000)),
}

function genId(prefix: string): string {
  try {
    return `${prefix}_${crypto.randomUUID()}`
  } catch {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const rnd = new Uint8Array(8)
      crypto.getRandomValues(rnd)
      const hex = Array.from(rnd, (b) => b.toString(16).padStart(2, '0')).join('')
      return `${prefix}_${Date.now()}_${hex}`
    }
    throw new Error('Secure random number generator not available')
  }
}

function now(): number {
  return Date.now()
}

function safeString(v: unknown): string {
  try {
    if (typeof v === 'string') return v
    if (typeof v === 'number' || typeof v === 'boolean') return String(v)
    return ''
  } catch {
    return ''
  }
}

function numberOr(v: unknown, def: number): number {
  return typeof v === 'number' ? v : def
}

function objectOrUndefined<T extends object>(v: unknown): T | undefined {
  return v && typeof v === 'object' ? (v as T) : undefined
}

function strWithDefault(v: unknown, def: string): string {
  const s = safeString(v)
  return s || def
}

function strOrUndef(v: unknown): string | undefined {
  const s = safeString(v)
  return s || undefined
}

export class AuditClient {
  private readonly cfg: AuditClientConfig
  private queue: AuditEvent[] = []
  private flushing = false
  private timer?: number
  private status: AuditQueueStatus = { pending: 0 }
  private bound = false

  constructor(cfg?: Partial<AuditClientConfig>) {
    this.cfg = { ...DEFAULTS, ...(cfg || {}) }
  }

  init(): void {
    if (this.bound) return
    this.bound = true
    this.restore()
    this.bindTimers()
    this.bindBus()
    this.bindLifecycle()
    this.publishStatus()
  }

  log(event: Partial<AuditEvent>): void {
    const enriched = this.normalizeEvent(event)

    this.queue.push(enriched)
    if (this.queue.length > this.cfg.maxQueueSize) {
      this.queue.splice(0, Math.max(0, this.queue.length - this.cfg.maxQueueSize))
    }
    this.persist()
    this.publishStatus()
  }

  getStatus(): AuditQueueStatus {
    return { ...this.status, pending: this.queue.length }
  }

  async flush(reason?: string): Promise<boolean> {
    if (this.flushing) return false
    if (this.queue.length === 0) return true
    this.flushing = true
    const startedAt = now()
    try {
      let ok = true
      while (this.queue.length > 0) {
        const batch = this.queue.slice(0, this.cfg.batchSize)
        const res = await API.PostAuditEvents({ events: batch as Array<Record<string, unknown>>, reason, endpoint: this.cfg.endpoint })
        const is2xx = Number(res?.status || 0) >= 200 && Number(res?.status || 0) < 300
        if (!is2xx) { ok = false; break }
        this.queue.splice(0, batch.length)
        this.persist()
      }
      this.status = {
        pending: this.queue.length,
        lastFlushAt: startedAt,
        lastFlushOk: ok,
        lastError: ok ? undefined : this.status.lastError,
      }
      this.publishStatus()
      return ok
    } catch (e) {
      this.status = {
        pending: this.queue.length,
        lastFlushAt: startedAt,
        lastFlushOk: false,
        lastError: safeString((e as { message?: unknown })?.message) || 'flush failed',
      }
      this.publishStatus()
      return false
    } finally {
      this.flushing = false
    }
  }

  private bindTimers(): void {
    if (this.timer) window.clearInterval(this.timer)
    this.timer = window.setInterval(() => {
      this.flush('interval').catch(() => {})
    }, this.cfg.flushIntervalMs)
  }

  private bindLifecycle(): void {
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flush('hidden').catch(() => {})
    })
    window.addEventListener('beforeunload', () => {
      this.persist()
    })
  }

  private bindBus(): void {
    bus.subscribe('audit.event', (msg) => {
      const payload = (msg?.payload ?? {}) as Partial<AuditEvent>
      this.log(payload)
    })

    bus.reply('audit.status', async () => {
      return this.getStatus()
    })

    bus.reply('audit.flush', async () => {
      const ok = await this.flush('manual')
      return { ok, status: this.getStatus() }
    })
  }

  private publishStatus(): void {
    try {
      bus.publish('audit.status.changed', this.getStatus())
    } catch {}
  }

  private persist(): void {
    try {
      storage.set(this.cfg.storageKey, this.queue, { scope: 'user', ttl: this.cfg.storageTtlMs })
    } catch {}
  }

  private restore(): void {
    try {
      const q = storage.get<AuditEvent[]>(this.cfg.storageKey, { scope: 'user' })
      if (Array.isArray(q)) this.queue = q.filter((e) => e && typeof e === 'object' && typeof (e as { event_id?: unknown }).event_id === 'string')
    } catch {
      this.queue = []
    }
  }
  
  private normalizeEvent(event: Partial<AuditEvent>): AuditEvent {
    return {
      event_id: strWithDefault(event.event_id, genId('a')),
      timestamp: numberOr(event.timestamp, now()),
      action_code: strWithDefault(event.action_code, 'unknown'),
      action_i18n_key: strOrUndef(event.action_i18n_key),
      object_type: strOrUndef(event.object_type),
      object_id: strOrUndef(event.object_id),
      object_i18n_key: strOrUndef(event.object_i18n_key),
      result_code: strOrUndef(event.result_code),
      result_i18n_key: strOrUndef(event.result_i18n_key),
      params: objectOrUndefined<Record<string, unknown>>(event.params),
      operator: event.operator,
      visitor_id: strOrUndef(event.visitor_id),
      tenant_id: strOrUndef(event.tenant_id),
      project_id: strOrUndef(event.project_id),
      request_id: strOrUndef(event.request_id),
      trace_id: strOrUndef(event.trace_id),
      user_agent: strOrUndef(event.user_agent) ?? (typeof navigator !== 'undefined' ? navigator.userAgent : undefined),
      service: strOrUndef(event.service),
      env: strOrUndef(event.env),
    }
  }
}
