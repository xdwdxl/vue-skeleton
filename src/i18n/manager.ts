/**
 * I18n Manager
 * @author Lorin Luo
 * @description Manages locale state, loads messages locally, and handles formatting
 */

import { reactive } from 'vue'
import bus from '../bus'
import { storage } from '../storage/singleton'
import { API } from '../api'
import type { I18nInstance, I18nMessageTree, I18nMessages, I18nOptions, I18nParams } from './types'
import { formatCurrency, formatDateTime, formatNumber, getPluralCategory } from '../regionalization'

const DEFAULT_OPTIONS: Required<I18nOptions> = {
  locale: 'en-US',
  fallbackLocale: 'en-US',
  appId: 'portal',
  group: 'I18N_GROUP',
  storageKey: 'i18n.locale',
  supportedLocales: ['en-US', 'de-DE'],
  loadMessages: async (locale: string, appId: string) => {
    const dataId = `${locale}-${appId}.json`
    const res = await API.GetConfig({ dataId, group: 'I18N_GROUP' })
    return res?.data
  },
  initialMessages: {},
}

export class I18nManager implements I18nInstance {
  private readonly state = reactive({
    locale: DEFAULT_OPTIONS.locale,
    messages: {} as Record<string, I18nMessages>,
  })
  private readonly options: Required<I18nOptions>
  private readonly explicitLocale: boolean
  private readonly META_DATA_ID: string

  constructor(options?: I18nOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
    this.META_DATA_ID = `${this.options.appId}-meta.json`
    this.explicitLocale = !!options && Object.prototype.hasOwnProperty.call(options, 'locale')
    try {
      const initial = this.options.initialMessages ?? {}
      for (const [rawLocale, msgs] of Object.entries(initial)) {
        const normalized = this.normalizeLocale(rawLocale)
        if (msgs && typeof msgs === 'object') {
          this.state.messages[normalized] = msgs
        }
      }
    } catch {}
    this.init()
  }

  private init() {
    // 1. Load meta config (available/default/timezone/currency)
    this.loadMeta().catch(() => {})

    // 2. Load initial locale from storage or browser
    const stored = storage.get<string>(this.options.storageKey, { scope: 'user' })
    if (stored) {
      this.state.locale = this.normalizeLocale(stored)
    } else if (this.explicitLocale && this.options.locale) {
      this.state.locale = this.normalizeLocale(this.options.locale)
    } else {
      // Simple browser locale detection
      const browser = navigator.language
      this.state.locale = this.normalizeLocale(browser)
    }

    // 3. Load messages for current locale, and ensure fallback is available
    const force = Object.keys(this.options.initialMessages ?? {}).length > 0
    this.loadLocale(this.state.locale, force ? { force: true } : undefined)
    const fallback = this.options.fallbackLocale
    if (fallback && fallback !== this.state.locale) {
      this.loadLocale(fallback, force ? { force: true } : undefined).catch(() => {})
    }

    // 4. Listen to bus events
    this.bindBus()
  }

  public get locale(): string {
    return this.state.locale
  }

  public set locale(v: string) {
    this.setLocale(v)
  }

  public getLocale(): string {
    return this.state.locale
  }

  public async setLocale(locale: string): Promise<void> {
    const normalized = this.normalizeLocale(locale)
    if (this.state.locale === normalized) return
    this.state.locale = normalized
    storage.set(this.options.storageKey, normalized, { scope: 'user' })
    await this.loadLocale(normalized)
    const fallback = this.options.fallbackLocale
    if (fallback && fallback !== normalized) {
      await this.loadLocale(fallback).catch(() => {})
    }
    bus.publish('i18n.locale.changed', { locale: normalized })
  }

  public t(key: string, params?: I18nParams): string {
    const { locale, messages } = this.state
    const { fallbackLocale } = this.options

    let msg = this.resolveMessage(messages[locale], key)

    // Fallback
    if (!msg && locale !== fallbackLocale) {
      // Try to load fallback if not loaded (optional, maybe too aggressive?)
      // For now assume fallback is loaded or we just check existing
      msg = this.resolveMessage(messages[fallbackLocale], key)
    }

    if (!msg) return key

    return this.format(msg, params)
  }

  public async loadLocale(locale: string, opts?: { force?: boolean }): Promise<void> {
    const normalized = this.normalizeLocale(locale)
    if (!opts?.force && this.state.messages[normalized]) return

    const local = await this.safeLoadLocal(normalized)
    this.state.messages[normalized] = local || {}
  }

  /** Load i18n meta info and persist preferences */
  public async loadMeta(): Promise<void> {
    try {
      const res = await API.GetConfig({ dataId: this.META_DATA_ID, group: this.options.group })
      const meta = res?.data

      const available = this.options.supportedLocales
      const def = meta?.default || this.options.locale
      const timezone = meta?.timezone
      const currency = meta?.currency

      bus.publish('i18n.meta.updated', {
        available,
        default: def,
        timezone,
        currency,
      })

      // Persist timezone if missing
      if (timezone && !storage.get('i18n.timezone', { scope: 'user' })) {
        storage.set('i18n.timezone', timezone, { scope: 'user' })
      }
    } catch (e) {
      console.warn('[I18n] Failed to load meta', e)
      const available = this.options.supportedLocales
      const def = this.options.locale
      bus.publish('i18n.meta.updated', {
        available,
        default: def,
        timezone: undefined,
        currency: undefined,
      })
    }
  }

  private normalizeLocale(locale: string | undefined | null): string {
    const raw = String(locale ?? '').trim()
    const supported = this.options.supportedLocales
    const supportedSet = new Set(supported)
    const fallback = supportedSet.has(this.options.fallbackLocale)
      ? this.options.fallbackLocale
      : supported[0] || DEFAULT_OPTIONS.fallbackLocale

    if (!raw) return fallback
    if (supportedSet.has(raw)) return raw

    const lower = raw.toLowerCase()
    if (lower.startsWith('de')) return supportedSet.has('de-DE') ? 'de-DE' : fallback
    if (lower.startsWith('en')) return supportedSet.has('en-US') ? 'en-US' : fallback
    return fallback
  }

  private async safeLoadLocal(locale: string): Promise<I18nMessages | undefined> {
    try {
      const res = await this.options.loadMessages(locale, this.options.appId)
      if (!res || typeof res !== 'object') {
        console.warn('[I18n] Invalid message data for', locale)
        return undefined
      }
      return res
    } catch (e) {
      console.error('[I18n] Failed to load messages for', locale, e)
      return undefined
    }
  }

  private resolveMessage(
    bundle: I18nMessages | undefined,
    key: string,
  ): I18nMessageTree | undefined {
    if (!bundle) return undefined

    if (Object.hasOwn(bundle, key)) {
      return bundle[key]
    }

    const parts = key.split('.')
    let current: unknown = bundle

    for (const part of parts) {
      if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[part]
      } else {
        return undefined
      }
    }

    return current as I18nMessageTree
  }

  private format(msg: I18nMessageTree, params?: I18nParams): string {
    if (typeof msg !== 'string' && typeof msg !== 'object') return ''
    const text = typeof msg === 'string' ? msg : ((msg as { text?: string }).text ?? '')
    const fmt =
      typeof msg === 'object' ? ((msg as { fmt?: 'plain' | 'icu' }).fmt ?? 'plain') : 'plain'

    if (!text) return ''
    if (!params) return text

    if (fmt === 'icu') {
      return this.formatICU(text, params)
    }

    // Simple interpolation for plain format (legacy support)
    return text.replace(/\{(\w+)(?:,\s*(\w+))?\}/g, (_, k, type) => {
      const val = params[k]
      if (val === undefined || val === null) return ''

      if (type === 'number') {
        return formatNumber(Number(val), { locale: this.state.locale })
      }
      if (type === 'date') {
        return formatDateTime(val as Date | number | string, { locale: this.state.locale })
      }
      if (type === 'currency') {
        return formatCurrency(Number(val), { locale: this.state.locale })
      }

      return this.serializeValue(val)
    })
  }

  private formatICU(text: string, params: I18nParams): string {
    let result = ''
    let i = 0
    const len = text.length

    while (i < len) {
      const char = text[i]
      if (char === '{') {
        const { segment, nextIndex } = this.handleOpeningBrace(text, i, params)
        result += segment
        i = nextIndex
      } else {
        result += char
        i++
      }
    }
    return result
  }

  private handleOpeningBrace(
    text: string,
    startIndex: number,
    params: I18nParams,
  ): { segment: string; nextIndex: number } {
    const end = this.findMatchingBrace(text, startIndex)
    if (end === -1) {
      return { segment: '{', nextIndex: startIndex + 1 }
    }

    const content = text.substring(startIndex + 1, end)
    const parts = content.split(',')
    const key = parts[0].trim()
    const type = parts[1] ? parts[1].trim() : undefined

    if (type === 'plural' || type === 'select') {
      const startSearch = parts[0].length
      const typeIndex = content.indexOf(type, startSearch)
      const body = content.substring(typeIndex + type.length).trim()
      const optionsBody = body.replace(/^,\s*/, '')
      return {
        segment: this.processPluralOrSelect(key, type, optionsBody, params),
        nextIndex: end + 1,
      }
    }

    return {
      segment: this.formatSimpleVariable(key, type, params),
      nextIndex: end + 1,
    }
  }

  private formatSimpleVariable(key: string, type: string | undefined, params: I18nParams): string {
    const val = params[key]
    if (val === undefined || val === null) {
      return ''
    }

    if (type === 'number') {
      return formatNumber(Number(val), { locale: this.state.locale })
    }
    if (type === 'date') {
      return formatDateTime(val as Date | number | string, { locale: this.state.locale })
    }
    if (type === 'currency') {
      return formatCurrency(Number(val), { locale: this.state.locale })
    }

    return this.serializeValue(val)
  }

  private serializeValue(val: unknown): string {
    if (typeof val === 'object' && val !== null) {
      const v = val as any
      if (
        typeof v.toString === 'function' &&
        v.toString !== Object.prototype.toString &&
        !Array.isArray(v)
      ) {
        return String(v)
      }
      try {
        return JSON.stringify(v)
      } catch {
        return '[Unable to serialize]'
      }
    }
    return String(val)
  }

  private findMatchingBrace(text: string, start: number): number {
    let depth = 0
    for (let i = start; i < text.length; i++) {
      if (text[i] === '{') depth++
      else if (text[i] === '}') depth--

      if (depth === 0) return i
    }
    return -1
  }

  private processPluralOrSelect(
    key: string,
    type: 'plural' | 'select',
    body: string,
    params: I18nParams,
  ): string {
    const value = params[key]
    const options = this.parsePluralSelectOptions(body)
    if (type === 'plural') {
      const n = Number(value)
      const cat = getPluralCategory(n, { locale: this.state.locale })
      const tpl = options[cat] || options.other || ''
      const hash = new Intl.NumberFormat(this.state.locale).format(n)
      return this.formatICU(this.replaceHash(tpl, hash), params)
    }
    const tpl = options[this.serializeValue(value)] || options.other || ''
    return this.formatICU(tpl, params)
  }

  private parsePluralSelectOptions(body: string): Record<string, string> {
    const options: Record<string, string> = {}
    let i = 0
    while (i < body.length) {
      if (/\s/.test(body[i])) {
        i++
        continue
      }
      const keyStart = i
      while (i < body.length && body[i] !== '{' && !/\s/.test(body[i])) {
        i++
      }
      const optKey = body.substring(keyStart, i).trim()
      while (i < body.length && body[i] !== '{') i++
      if (i >= body.length) break
      const valEnd = this.findMatchingBrace(body, i)
      if (valEnd === -1) break
      const optVal = body.substring(i + 1, valEnd)
      options[optKey] = optVal
      i = valEnd + 1
    }
    return options
  }

  private replaceHash(text: string, replacement: string): string {
    // Replace # with replacement, but skip anything inside {}
    let result = ''
    let depth = 0
    for (const char of text) {
      if (char === '{') {
        depth++
        result += char
      } else if (char === '}') {
        depth--
        result += char
      } else if (char === '#' && depth === 0) {
        result += replacement
      } else {
        result += char
      }
    }
    return result
  }

  private bindBus() {
    // Listen for locale sync from other apps (e.g. Haiberg)
    bus.subscribe('i18n.locale.sync', (msg) => {
      const payload = msg.payload as { locale?: string }
      if (payload?.locale && payload.locale !== this.state.locale) {
        this.setLocale(payload.locale)
      }
    })

    // Listen for config updates (hot reload)
    bus.subscribe('i18n.updated', (msg) => {
      const payload = msg.payload as Record<string, unknown>
      const locale = typeof payload?.locale === 'string' ? payload.locale : undefined
      const app = typeof payload?.app === 'string' ? payload.app : undefined
      if (locale && app === this.options.appId) {
        // Force reload
        const dataId = `${locale}-${this.options.appId}.json`
        API.GetConfig({ dataId, group: this.options.group }).then((res: any) => {
          if (res?.data) {
            // We need to reactively update the map
            // Since this.state.messages is reactive, simple assignment should work
            this.state.messages[locale] = res.data as I18nMessages
            console.log(`[I18n] Hot reloaded ${locale}`)
          }
        })
      }
    })

    // Listen for general config updates (fallback if i18n.updated is not used)
    bus.subscribe('config.updated', (msg) => {
      const p = msg.payload as Record<string, unknown>
      const group = typeof p?.group === 'string' ? p.group : undefined
      const dataId = typeof p?.dataId === 'string' ? p.dataId : undefined
      if (group === this.options.group) {
        // Check if it matches any loaded locale
        const currentDataId = `${this.state.locale}-${this.options.appId}.json`
        if (dataId === currentDataId) {
          this.loadLocale(this.state.locale, { force: true })
        }
        if (dataId === this.META_DATA_ID) {
          this.loadMeta().catch(() => {})
        }
      }
    })
  }
}
