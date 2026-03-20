/**
 * Error center
 * @author Lorin Luo
 * @description Centralized error normalization and user prompt strategy
 */

import type { App, ComponentPublicInstance } from 'vue'
import bus from '../bus'
import { ErrorDeduper } from './dedupe'
import { ErrorI18nResolver } from './i18n'
import { ErrorNotifier } from './notifier'
import type { ErrorDisplay, ErrorLevel, NormalizedError, SystemErrorPayload } from './types'

const DEFAULTS: Record<string, { level: ErrorLevel; display: ErrorDisplay; message: string }> = {
  NETWORK_ERROR: { level: 'error', display: 'toast', message: 'Network error. Please try again.' },
  TIMEOUT: { level: 'error', display: 'toast', message: 'Request timeout. Please try again.' },
  SERVER_ERROR: { level: 'error', display: 'toast', message: 'Server error. Please try again later.' },
  REQUEST_ERROR: { level: 'warn', display: 'toast', message: 'Request failed. Please check and retry.' },
  UNAUTHORIZED: { level: 'warn', display: 'toast', message: 'Unauthorized. Please login.' },
  FORBIDDEN: { level: 'warn', display: 'toast', message: 'Forbidden. Insufficient permission.' },
  UNHANDLED: { level: 'error', display: 'notification', message: 'Unexpected error occurred.' },
}

const SUPPRESSED_UNKNOWN_ERROR_TEXT = 'ResizeObserver loop'

function safeString(v: unknown): string {
  try {
    if (typeof v === 'string') return v
    if (typeof v === 'number' || typeof v === 'boolean') return String(v)
    if (v && typeof v === 'object') return JSON.stringify(v)
    return ''
  } catch {
    return ''
  }
}

/**
 * Normalize system error payload to normalized error
 * @param {SystemErrorPayload} payload - System error payload
 * @returns {NormalizedError} - Normalized error object
 */
function normalizeFromSystemPayload(payload: SystemErrorPayload): NormalizedError {
  const code = String(payload?.code ?? 'UNHANDLED')
  const preset = DEFAULTS[code] || DEFAULTS.UNHANDLED
  const level = (payload?.level ?? preset.level)
  const display = (payload?.display ?? preset.display)
  const message = String(payload?.message ?? preset.message)
  return {
    code,
    message,
    level,
    display,
    status: typeof payload?.status === 'number' ? payload.status : undefined,
    requestId: payload?.requestId,
    traceId: payload?.traceId,
    ts: Date.now(),
    tags: {},
  }
}

/**
 * Generate deduplication key for error
 * @param {NormalizedError} err - Error object
 * @returns {string} - Deduplication key
 */
function makeDedupeKey(err: NormalizedError): string {
  const parts = [err.code, err.message, String(err.status ?? ''), String(err.requestId ?? '')]
  return parts.join('|')
}

export class ErrorCenter {
  private readonly notifier = new ErrorNotifier()
  private readonly deduper = new ErrorDeduper({ windowMs: 3000, maxSize: 2000 })
  private readonly i18n = new ErrorI18nResolver()
  private initialized = false

  /**
   * Initialize error center
   * @param {Object} [opts] - Options
   */
  init(opts?: { app?: App }): void {
    if (this.initialized) return
    this.initialized = true
    this.i18n.init()
    this.bindBus()
    this.bindWindow()
    if (opts?.app) this.bindVue(opts.app)
  }

  /**
   * Handle system error
   * @param {SystemErrorPayload | unknown} payload - Error payload
   * @param {Object} [ctx] - Context
   */
  handle(payload: unknown, ctx?: { source?: string }): void {
    const p = (payload ?? {}) as SystemErrorPayload
    if (p.silent) return
    const err = normalizeFromSystemPayload(p)
    err.message = this.i18n.resolve(err.code, err.message)
    if (ctx?.source) err.tags = { ...(err.tags || {}), source: ctx.source }
    this.show(err)
  }

  /**
   * Handle unknown error
   * @param {unknown} e - Unknown error
   * @param {Object} [ctx] - Context
   */
  handleUnknown(e: unknown, ctx?: { source?: string; display?: ErrorDisplay; level?: ErrorLevel }): void {
    const rawMessage = safeString((e as { message?: unknown })?.message) || safeString(e)
    if (rawMessage.includes(SUPPRESSED_UNKNOWN_ERROR_TEXT)) return
    const payload: SystemErrorPayload = {
      code: 'UNHANDLED',
      message: rawMessage || DEFAULTS.UNHANDLED.message,
      display: ctx?.display,
      level: ctx?.level,
    }
    this.handle(payload, ctx)
  }

  /**
   * Show error notification
   * @param {NormalizedError} err - Error object
   */
  private show(err: NormalizedError): void {
    const key = makeDedupeKey(err)
    if (!this.deduper.shouldShow(key)) return
    this.notifier.notify(err)
  }

  private bindBus(): void {
    bus.subscribe('system.error', (msg) => {
      const payload = (msg?.payload ?? {}) as SystemErrorPayload
      this.handle(payload, { source: 'bus' })
    })
  }

  private bindWindow(): void {
    window.addEventListener('error', (ev) => {
      const err = (ev as unknown as { error?: unknown }).error ?? ev
      this.handleUnknown(err, { source: 'window.error', level: 'error', display: 'notification' })
    })
    window.addEventListener('unhandledrejection', (ev) => {
      const reason = (ev as unknown as { reason?: unknown }).reason
      this.handleUnknown(reason, { source: 'window.unhandledrejection', level: 'error', display: 'notification' })
    })
  }

  private bindVue(app: App): void {
    app.config.errorHandler = (err: unknown, _instance: ComponentPublicInstance | null, info: string) => {
      this.handleUnknown(err, { source: `vue:${info || 'errorHandler'}`, level: 'error', display: 'notification' })
    }
  }
}
