/**
 * Error types for portal
 * @author Lorin Luo
 * @description Defines normalized error model for UI display and reporting
 */

export type ErrorLevel = 'info' | 'warn' | 'error' | 'fatal'
export type ErrorDisplay = 'toast' | 'notification' | 'dialog' | 'inline' | 'none'

export type NormalizedError = {
  code: string
  message: string
  level: ErrorLevel
  display: ErrorDisplay
  status?: number
  requestId?: string
  traceId?: string
  ts: number
  cause?: unknown
  tags?: Record<string, string>
}

export type SystemErrorPayload = {
  code?: string
  message?: string
  status?: number
  requestId?: string
  traceId?: string
  display?: ErrorDisplay
  level?: ErrorLevel
  silent?: boolean
}

