/**
 * Shared HTTP constants and utilities
 * @author Lorin Luo
 * @description Common constants and helper functions for HTTP modules
 */
import config from '../config'
import { storage } from '../storage/singleton'
import bus from '../bus'

export const STORAGE_KEYS = {
  visitorId: 'portal_visitor_id',
  legacyLanguage: 'appLanguage',
  legacyTimezone: 'timezone',
  legacyCurrency: 'currency',
} as const

export const STORAGE_PREF_KEYS = {
  locale: 'i18n.locale',
  timezone: 'i18n.timezone',
  currency: 'i18n.currency',
} as const

export const ONE_DAY_MS = 24 * 60 * 60 * 1000
export const ONE_MINUTE_MS = 60 * 1000

export const DEFAULTS = {
  language: (globalThis as any)?.window?.__PORTAL_RUNTIME__?.portal?.defaults?.language || 'en',
  timezone: (globalThis as any)?.window?.__PORTAL_RUNTIME__?.portal?.defaults?.timezone || 'UTC',
  currency: (globalThis as any)?.window?.__PORTAL_RUNTIME__?.portal?.defaults?.currency || 'EUR',
  appId: (globalThis as any)?.window?.__PORTAL_RUNTIME__?.portal?.defaults?.appId || (import.meta.env.VITE_APP_ID as string) || 'portal',
  appVersion: (globalThis as any)?.window?.__PORTAL_RUNTIME__?.portal?.defaults?.appVersion || (import.meta.env.VITE_APP_VERSION as string) || '',
  tokenUrl: (globalThis as any)?.window?.__PORTAL_RUNTIME__?.portal?.auth?.tokenUrl || (import.meta.env.VITE_AUTH_TOKEN_URL as string) || '/auth/token',
  refreshUrl: (globalThis as any)?.window?.__PORTAL_RUNTIME__?.portal?.auth?.refreshUrl || (import.meta.env.VITE_AUTH_REFRESH_URL as string) || '/auth/refresh',
  logoutUrl: (globalThis as any)?.window?.__PORTAL_RUNTIME__?.portal?.auth?.logoutUrl || (import.meta.env.VITE_AUTH_LOGOUT_URL as string) || '/auth/logout',
  refreshWithCookie: String((globalThis as any)?.window?.__PORTAL_RUNTIME__?.portal?.auth?.refreshWithCookie ?? import.meta.env.VITE_AUTH_REFRESH_WITH_COOKIE ?? 'true') !== 'false',
  retry500DelayMs: Math.max(0, Number((globalThis as any)?.window?.__PORTAL_RUNTIME__?.portal?.http?.retry500DelayMs ?? (import.meta.env.VITE_HTTP_RETRY_500_MS as string | undefined) ?? 200)),
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
} as const

export const AUTH_REASON = {
  login: 'login',
  init_refreshed: 'init_refreshed',
  token_refreshed: 'token_refreshed',
  unauthorized: 'unauthorized',
  refresh_failed: 'refresh_failed',
} as const

/**
 * Generate request or entity IDs
 * @author Lorin Luo
 * @param {string} prefix - ID prefix
 * @returns {string} - Generated ID
 */
export function genId(prefix: string): string {
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

/**
 * Sleep helper
 * @author Lorin Luo
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Get or create visitor ID (machine ID)
 * @author Lorin Luo
 * @returns {string} - Visitor ID
 */
export function getOrCreateVisitorId(): string {
  const key = STORAGE_KEYS.visitorId
  const val = storage.get<string>(key, { scope: 'global', serialize: 'text' })
  if (val) return val

  const legacy = localStorage.getItem(key)
  if (legacy) {
    storage.set(key, legacy, { scope: 'global', ttl: 0, serialize: 'text' })
    localStorage.removeItem(key)
    return legacy
  }

  const id = genId('v')
  storage.set(key, id, { scope: 'global', ttl: 0, serialize: 'text' })
  return id
}

/**
 * Get preference from storage or migrate from legacy
 * @author Lorin Luo
 * @param {string} storageKey - New storage key
 * @param {string} legacyKey - Legacy localStorage key
 * @param {string} fallback - Fallback value
 * @returns {string} - Preference value
 */
export function getOrMigrateTextPref(storageKey: string, legacyKey: string, fallback: string): string {
  const fromStorage = storage.get<string>(storageKey, { scope: 'user' })
  if (typeof fromStorage === 'string' && fromStorage) {
    return fromStorage
  }

  const legacy = localStorage.getItem(legacyKey)
  if (legacy) {
    try {
      storage.set(storageKey, legacy, { scope: 'user', ttl: 365 * ONE_DAY_MS, serialize: 'text' })
      localStorage.removeItem(legacyKey)
    } catch {}
    return legacy
  }

  return fallback
}

/**
 * Publish auth status change safely
 * @author Lorin Luo
 * @param {boolean} isAuthenticated - Authenticated flag
 * @param {string} reason - Change reason
 */
export function safePublishAuth(isAuthenticated: boolean, reason: string): void {
  try { bus.publish('auth.status.changed', { isAuthenticated, reason }) } catch {}
}

declare module 'axios' {
  export interface AxiosRequestConfig {
    startTime?: number
    _retry500?: boolean
    _retry401?: boolean
    authProvider?: 'keycloak' | 'youtrack' | 'none'
  }
}
