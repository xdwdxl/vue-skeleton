/**
 * Error i18n resolver
 * @author Lorin Luo
 * @description Resolves user message by BFF code -> i18n key -> fallback
 */

import bus from '../bus'
import { API } from '../api'
import { storage } from '../storage/singleton'
import type { StorageUpdatedPayload } from '../storage/types'

type ErrorMapItem = {
  i18nKey: string
  fallback?: string
}

type ErrorMapConfig = {
  map?: Record<string, ErrorMapItem>
}

type ErrorMessageBundle = Record<string, string>

const DEFAULTS = {
  locale: 'en',
  group: (import.meta.env.VITE_ERROR_I18N_GROUP as string) || 'PORTAL_GROUP',
  mapDataId: (import.meta.env.VITE_ERROR_I18N_MAP_DATA_ID as string) || 'portal.error.map.json',
  bundleTemplate: (import.meta.env.VITE_ERROR_I18N_BUNDLE_TEMPLATE as string) || 'portal.error.messages.{locale}.json',
  localeStorageKey: 'i18n.locale',
} as const

function buildBundleDataId(locale: string): string {
  return DEFAULTS.bundleTemplate.replace('{locale}', locale)
}

function pickLocale(): string {
  const v = storage.get<string>(DEFAULTS.localeStorageKey, { scope: 'user' })
  if (typeof v === 'string' && v) return v
  return DEFAULTS.locale
}

function safeString(v: unknown): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return ''
}

function normalizeItem(raw: unknown): ErrorMapItem | null {
  const obj = (raw ?? {}) as Record<string, unknown>
  const i18nKey = safeString(obj?.i18nKey ?? obj?.key ?? obj?.i18n_key)
  if (!i18nKey) return null
  const fallback = safeString(obj?.fallback ?? obj?.message)
  return fallback ? { i18nKey, fallback } : { i18nKey }
}

/**
 * Error message resolver
 * @author Lorin Luo
 * @description Loads mapping and message bundles from config center and supports hot reload
 */
export class ErrorI18nResolver {
  private locale = pickLocale()
  private map: Record<string, ErrorMapItem> = {}
  private bundle: ErrorMessageBundle = {}
  private initialized = false

  init(): void {
    if (this.initialized) return
    this.initialized = true
    this.loadAll()
    this.bindStorage()
    this.bindConfig()
  }

  resolve(code: string, fallback: string): string {
    const c = String(code || '').trim()
    if (!c) return fallback
    const item = this.map[c]
    if (!item) return fallback
    const msg = this.bundle[item.i18nKey]
    if (typeof msg === 'string' && msg) return msg
    if (item.fallback) return item.fallback
    return fallback
  }

  private bindStorage(): void {
    bus.subscribe('storage.updated', (msg) => {
      const p = msg?.payload as StorageUpdatedPayload | undefined
      if (!p) return
      if (p.key !== DEFAULTS.localeStorageKey) return
      const next = pickLocale()
      if (next === this.locale) return
      this.locale = next
      this.loadBundle()
    })
  }

  private bindConfig(): void {
    bus.subscribe('config.updated', (msg) => {
      const p = (msg?.payload ?? {}) as Record<string, unknown>
      const dataId = safeString(p?.dataId)
      const group = safeString(p?.group)
      if (!dataId || !group) return
      if (group !== DEFAULTS.group) return
      if (dataId === DEFAULTS.mapDataId) this.loadMap()
      if (dataId === buildBundleDataId(this.locale)) this.loadBundle()
    })
  }

  private async loadAll(): Promise<void> {
    await Promise.all([this.loadMap(), this.loadBundle()])
  }

  private async loadMap(): Promise<void> {
    try {
      const res = await API.GetConfig({ dataId: DEFAULTS.mapDataId, group: DEFAULTS.group })
      const data = res?.data as ErrorMapConfig | Record<string, unknown> | undefined
      const raw = (data && typeof data === 'object' && 'map' in data) ? (data as ErrorMapConfig).map : (data as unknown as { codes?: unknown })?.codes ?? data
      if (!raw || typeof raw !== 'object') return
      const rawMap = raw as Record<string, unknown>
      const next: Record<string, ErrorMapItem> = {}
      Object.entries(rawMap).forEach(([code, v]) => {
        const item = normalizeItem(v)
        if (item) next[String(code)] = item
      })
      this.map = next
    } catch {}
  }

  private async loadBundle(): Promise<void> {
    try {
      const dataId = buildBundleDataId(this.locale)
      const res = await API.GetConfig({ dataId, group: DEFAULTS.group })
      const data = res?.data as Record<string, unknown> | undefined
      if (!data || typeof data !== 'object') return
      const next: ErrorMessageBundle = {}
      Object.entries(data).forEach(([k, v]) => {
        const val = safeString(v)
        if (k && val) next[String(k)] = val
      })
      this.bundle = next
    } catch {}
  }
}
