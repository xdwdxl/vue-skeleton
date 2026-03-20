/**
 * Portal Application Entry Point (TypeScript)
 * @author Lorin Luo
 * @description Initializes Vue app, router, ElementPlus, and loads remote modules via manifest
 */
import { createApp } from 'vue'
import type { App as VueApp } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import App from './App.vue'
import type { Router } from 'vue-router'
import { createPortalRouter } from './router'
import ElementPlus, { ElNotification } from 'element-plus'
import 'element-plus/dist/index.css'
import '@fontsource/open-sans/400.css'
import '@fontsource/open-sans/500.css'
import '@fontsource/open-sans/600.css'
import '@fontsource/open-sans/700.css'
import 'flag-icons/css/flag-icons.min.css'
import '@formkit/themes/genesis'
import './styles/index.css'
import './theme'
import './audit'
import { plugin } from '@formkit/vue'
import * as VueModule from 'vue'
import * as VueRouterModule from 'vue-router'
import bus from './bus'
import { initNotifySseAdapter } from './bus'
import { API } from './api'
import { storage } from './storage'
import { genId } from './http/shared'
import { getToken, refreshAccessToken } from './http/auth'
import { installErrorCenter } from './error'

// Polyfill crypto.randomUUID if missing
if (typeof window !== 'undefined' && window.crypto && !window.crypto.randomUUID) {
  window.crypto.randomUUID = () => {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
      (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    ) as `${string}-${string}-${string}-${string}-${string}`;
  }
}

(window as any).__PORTAL_AUTH__ = {
  getToken,
  refreshToken: async () => {
    const pair = await refreshAccessToken(genId('r'))
    return pair?.accessToken ?? ''
  },
}
import { I18nPlugin } from './i18n'
import { getFormKitConfig } from './formkit'
import CidsCard from './components/CidsCard.vue'
import PortalIcon from './components/PortalIcon.vue'

function getQueryParam(key: string): string | null {
  try { return new URLSearchParams(window.location.search).get(key) } catch { return null }
}

function stripAuthQuery(): void {
  try {
    const url = new URL(window.location.href)
    url.searchParams.delete('code')
    url.searchParams.delete('state')
    url.searchParams.delete('session_state')
    history.replaceState({}, document.title, url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '') + url.hash)
  } catch {}
}

async function bootstrapAuth(): Promise<void> {
  const code = getQueryParam('code') ?? ''
  const redirectUri = `${window.location.origin}${window.location.pathname}`
  if (code) {
    const ok = await API.AuthHandleCallback({ code, redirectUri })
    stripAuthQuery()
    if (ok) {
      return
    }
  }
  const authed = await API.AuthInit()
  if (authed) {
    return
  }
}

async function loadManifest(): Promise<Record<string, string>> {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000
  const MF_MANIFEST_STORAGE_KEY = 'portal.mf_manifest_url'
  const MF_MANIFEST_LEGACY_KEY = '__MF_MANIFEST_URL__'
  const ENV_MANIFEST_URL = String(import.meta.env.VITE_MF_MANIFEST_URL || '')

  const isValid = (obj: unknown): obj is Record<string, string> => {
    try {
      const entries = Object.entries(obj ?? {})
      return entries.length > 0 && entries.some(([k, v]) => typeof k === 'string' && typeof v === 'string' && v.length > 0)
    } catch { return false }
  }

  try {
    const rt = (globalThis as any)?.window?.__PORTAL_RUNTIME__?.portal
    const registry = rt?.mf?.registry
    if (isValid(registry)) return registry
  } catch {}

  try {
    const rt = (globalThis as any)?.window?.__PORTAL_RUNTIME__?.portal
    const dataId = String(rt?.mf?.dataId || 'mf-registry.json')
    const group = String(rt?.mf?.group || 'PORTAL_GROUP')
    const res = await API.GetConfig({ dataId, group })
    const data = res?.data as Record<string, string> | undefined
    if (isValid(data)) return data
  } catch {}

  const override = getQueryParam('manifest') ?? getQueryParam('mf_manifest')
  const storedFromStorage = storage.get<string>(MF_MANIFEST_STORAGE_KEY, { scope: 'project' })
  const storedFromLegacy = localStorage.getItem(MF_MANIFEST_LEGACY_KEY)
  const stored = storedFromStorage ?? storedFromLegacy
  const candidates: string[] = []
  if (override) candidates.push(override)
  if (stored) candidates.push(stored)
  if (ENV_MANIFEST_URL) candidates.push(ENV_MANIFEST_URL)

  try {
    if (!storedFromStorage && storedFromLegacy) {
      storage.set(MF_MANIFEST_STORAGE_KEY, storedFromLegacy, { scope: 'project', ttl: 7 * ONE_DAY_MS, serialize: 'text' })
    }
    if (storedFromStorage && storedFromLegacy !== storedFromStorage) {
      localStorage.setItem(MF_MANIFEST_LEGACY_KEY, storedFromStorage)
    }
  } catch {}

  for (const url of candidates) {
    try {
      const json = await API.FetchJson(url) as Record<string, string> | undefined
      if (isValid(json)) return json
    } catch {}
  }
  return {}
}

type RemoteFactory<T = unknown> = () => T
type RemoteContainer = {
  init: (scope: unknown) => Promise<void> | void
  get: (path: string) => Promise<RemoteFactory>
}

declare global {
  interface Window {
    __MF_MANIFEST__?: Record<string, string>
  }
}

async function initRemoteContainer(container: RemoteContainer) {
  const vueVersion = (VueModule as { version?: string }).version ?? '3'
  const routerVersion = (VueRouterModule as { version?: string }).version ?? '4'
  const shareScope: unknown = {
    vue: {
      [vueVersion]: {
        get: () => Promise.resolve(() => VueModule),
        loaded: true,
        from: 'portal',
        eager: true,
        scope: 'default',
      },
    },
    'vue-router': {
      [routerVersion]: {
        get: () => Promise.resolve(() => VueRouterModule),
        loaded: true,
        from: 'portal',
        eager: true,
        scope: 'default',
      },
    },
  }
  await container.init(shareScope)
}

async function registerRemoteRoutes(container: RemoteContainer, prefix: string, router: Router) {
  try {
    const placeholders = router
      .getRoutes()
      .filter((r) => {
        const name = typeof r.name === 'string' ? r.name : ''
        const path = String((r as any)?.path ?? '')
        if (!name.startsWith('remote-')) return false
        if (!path) return false
        return path === prefix || path.startsWith(`${prefix}/`)
      })

    for (const r of placeholders) {
      const name = typeof r.name === 'string' ? r.name : ''
      if (!name) continue
      try {
        const rtr = router as unknown as { removeRoute?: (name: string) => void }
        rtr.removeRoute?.(name)
      } catch {}
    }
  } catch {}

  const factory = await container.get('./routes')
  const mod = factory()
  const m = mod as Record<string, unknown>
  const register = m.default ?? m.registerRoutes
  if (typeof register === 'function') {
    (register as (r: Router, p: string) => void)(router, prefix)
  } else {
    const getRoutes = m.getRoutes as ((p: string) => unknown[]) | undefined
    const defaults = Array.isArray(m.default) ? (m.default as unknown[]) : []
    const routes = getRoutes?.(prefix) || defaults
    ;(routes || []).forEach((r) => router.addRoute(r as RouteRecordRaw))
  }
  const placeholderName = `remote-${prefix.slice(1)}`
  try {
    const rtr = router as unknown as { removeRoute?: (name: string) => void }
    rtr.removeRoute?.(placeholderName)
  } catch {}
  try {
    const current = String((router as any)?.currentRoute?.value?.fullPath ?? (router as any)?.currentRoute?.value?.path ?? '')
    if (current === prefix || current.startsWith(`${prefix}/`)) {
      await router.replace(current)
    }
  } catch {}
}

async function loadRemoteApps(router: Router) {
  const entries = Object.entries((window as Window).__MF_MANIFEST__ || {}).filter(
    ([k, v]) => k.endsWith('App') && typeof v === 'string' && v
  )

  for (const [name, url] of entries) {
    const prefix = `/${String(name).replace(/App$/i, '').toLowerCase()}`
    try {
      const container: RemoteContainer = await import(/* @vite-ignore */ url) as unknown as RemoteContainer
      if (container && typeof container.init === 'function') {
        await initRemoteContainer(container)
      }
      if (container && typeof container.get === 'function') {
        await registerRemoteRoutes(container, prefix, router)
      }
    } catch {}
  }
}

function safeString(v: unknown): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return ''
}

const DEFAULT_UNREAD_SYNC_POLL_INTERVAL_MS = 60000
const UNREAD_SYNC_POLL_INTERVAL_MS = Math.max(
  5000,
  Number(
    (globalThis as any)?.window?.__PORTAL_RUNTIME__?.portal?.notify?.unreadPollIntervalMs
    ?? (import.meta as any)?.env?.VITE_NOTIFY_UNREAD_POLL_MS
    ?? DEFAULT_UNREAD_SYNC_POLL_INTERVAL_MS
  ) || DEFAULT_UNREAD_SYNC_POLL_INTERVAL_MS
)
const UNREAD_SYNC_DEBOUNCE_MS = 400
const UNREAD_SYNC_MIN_INTERVAL_MS = 1200
const UNREAD_SYNC_POLL_MAX_BACKOFF_MS = 5 * 60 * 1000
const UNREAD_SYNC_POLL_TIMEOUT_MS = 4000

let unreadSyncTimer: number | undefined
let unreadSyncInFlight = false
let unreadSyncPending = false
let lastUnreadSyncAtMs = 0
let unreadPollTimer: number | undefined
let unreadPollFailures = 0
let unreadPollEnabled = true

function setupBridges(app: VueApp, router: Router) {
  // Notification bridge: render received notifications
  bus.subscribe('notify.received', (msg) => {
    const p = (msg?.payload ?? {}) as Record<string, unknown>
    const item = (p?.item && typeof p.item === 'object') ? (p.item as Record<string, unknown>) : p
    const scopes = Array.isArray((item as any)?.scopes) ? ((item as any).scopes as unknown[]).map((x) => String(x ?? '').trim()).filter(Boolean) : []
    const isScoped = scopes.length > 0 && !scopes.includes('ALL') && !scopes.includes('*')
    const t = (app.config.globalProperties as unknown as { $t?: (key: string, params?: Record<string, unknown>) => string })?.$t
    const params = (item?.params ?? {}) as Record<string, unknown>
    const title = typeof item?.titleKey === 'string' ? t?.(item.titleKey as string, params) : ''
    const body = typeof item?.bodyKey === 'string' ? t?.(item.bodyKey as string, params) : ''
    const level = safeString(item?.level) || 'info'
    let type: 'success' | 'warning' | 'info' | 'error' = 'info'
    if (level === 'warn') {
      type = 'warning'
    } else if (level === 'error') {
      type = 'error'
    }
    try { requestUnreadSync() } catch {}
    if (isScoped) return
    try {
      const fallbackTitle = t?.('notify.toast.fallbackTitle') ?? 'Notification'
      ElNotification({ type, title: title || fallbackTitle, message: body ?? '' })
    } catch {}
  })

  bus.subscribe('notify.unread.count.changed', (msg) => {
    const payload = (msg?.payload ?? {}) as Record<string, unknown>
    if (!('unread' in payload)) return
    const unread = Number((payload as any).unread)
    if (!Number.isFinite(unread)) return
    try { storage.set('notify.unread', unread, { scope: 'user' }) } catch {}
  })

  bus.subscribe('route.navigate', (msg) => {
    try {
      const path = safeString(((msg?.payload ?? {}) as Record<string, unknown>).path)
      if (path) router.push(path)
    } catch {}
  })

  bus.subscribe('i18n.locale.changed', (msg) => {
    try {
      const next = safeString(((msg?.payload ?? {}) as Record<string, unknown>).locale)
      const localeKey = next.startsWith('de') ? 'de' : 'en'
      ;(app.config.globalProperties as unknown as { $formkit?: { setLocale?: (l: string) => void } }).$formkit?.setLocale?.(localeKey)
    } catch {}
  })
}

async function initNotifySse(): Promise<void> {
  const conf = (await import('./config')).default
  if (!(conf as any).enableNotifySse) return

  const base = String(conf.api.baseURL || '/api').replace(/\/+$/, '')

  initNotifySseAdapter(async () => {
    try {
      const res = await API.NotifySseTicket()
      const ticket = String((res as any)?.data?.data?.ticket ?? '').trim()
      if (ticket) return `${base}/notify/events?ticket=${encodeURIComponent(ticket)}`
    } catch {}
    return `${base}/notify/events`
  })
}

async function syncUnreadOnce(): Promise<boolean> {
  if (unreadSyncInFlight) {
    unreadSyncPending = true
    return true
  }
  unreadSyncInFlight = true
  let ok = false
  try {
    const { unwrapBffData, get } = await import('./http/api')
    const res = await get(
      '/notify/inbox',
      { limit: 1 },
      undefined,
      { silent: true, bizSilent: true, timeout: UNREAD_SYNC_POLL_TIMEOUT_MS },
    )
    const data = unwrapBffData<Record<string, unknown> | undefined>(res)
    const payload = (data ?? {}) as Record<string, unknown>
    if (!('unread' in payload)) {
      ok = true
      return ok
    }
    const unread = Number((payload as any).unread)
    if (!Number.isFinite(unread)) {
      ok = true
      return ok
    }
    storage.set('notify.unread', unread, { scope: 'user' })
    ok = true
  } catch {
    ok = false
  }
  finally {
    unreadSyncInFlight = false
    lastUnreadSyncAtMs = Date.now()
    if (unreadSyncPending) {
      unreadSyncPending = false
      requestUnreadSync()
    }
  }
  return ok
}

function requestUnreadSync(): void {
  if (unreadSyncTimer) return
  const now = Date.now()
  const delta = now - lastUnreadSyncAtMs
  const waitMs = delta < UNREAD_SYNC_MIN_INTERVAL_MS ? Math.max(UNREAD_SYNC_DEBOUNCE_MS, UNREAD_SYNC_MIN_INTERVAL_MS - delta) : UNREAD_SYNC_DEBOUNCE_MS
  unreadSyncTimer = window.setTimeout(() => {
    unreadSyncTimer = undefined
    void syncUnreadOnce()
  }, waitMs)
}

function computeUnreadPollDelayMs(ok: boolean): number {
  if (ok) unreadPollFailures = 0
  else unreadPollFailures += 1
  const base = UNREAD_SYNC_POLL_INTERVAL_MS
  if (unreadPollFailures <= 0) return base
  const exp = Math.min(5, unreadPollFailures)
  const backoff = Math.min(UNREAD_SYNC_POLL_MAX_BACKOFF_MS, base * Math.pow(2, exp))
  return Math.max(base, backoff)
}

function stopUnreadPoll(): void {
  unreadPollEnabled = false
  if (unreadPollTimer) {
    try { clearTimeout(unreadPollTimer) } catch {}
    unreadPollTimer = undefined
  }
}

function scheduleUnreadPoll(delayMs: number): void {
  if (!unreadPollEnabled) return
  if (unreadPollTimer) return
  const d = Math.max(0, Math.floor(Number(delayMs || 0)))
  unreadPollTimer = window.setTimeout(async () => {
    unreadPollTimer = undefined
    if (!unreadPollEnabled) return
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      scheduleUnreadPoll(computeUnreadPollDelayMs(false))
      return
    }
    if (typeof document !== 'undefined' && document.hidden) {
      scheduleUnreadPoll(UNREAD_SYNC_POLL_INTERVAL_MS)
      return
    }
    const ok = await syncUnreadOnce()
    scheduleUnreadPoll(computeUnreadPollDelayMs(ok))
  }, d)
}

function startUnreadPoll(): void {
  stopUnreadPoll()
  unreadPollEnabled = true
  unreadPollFailures = 0
  scheduleUnreadPoll(UNREAD_SYNC_POLL_INTERVAL_MS)
}

type PortalMountOptions = {
  container?: HTMLElement | string
  base?: string
  path?: string
  manifest?: Record<string, string>
}

const DEFAULT_CONTAINER_SELECTOR = '#app'

let appInstance: VueApp | undefined
let mountedElement: HTMLElement | undefined

async function ensurePortalRuntimeLoaded(): Promise<void> {
  try {
    if (typeof window === 'undefined') return
    if ((window as any).__PORTAL_RUNTIME__) return
    const dataId = 'portal-runtime.json'
    const group = 'PORTAL_GROUP'
    const url = `/api/config/${encodeURIComponent(dataId)}?group=${encodeURIComponent(group)}`
    const res = await fetch(url, { credentials: 'include' })
    if (!res.ok) return
    const json = await res.json()
    ;(window as any).__PORTAL_RUNTIME__ = json
  } catch {}
}

function resolveContainer(target?: HTMLElement | string): HTMLElement | undefined {
  if (!target) return document.querySelector(DEFAULT_CONTAINER_SELECTOR) as HTMLElement | undefined
  if (typeof target === 'string') return document.querySelector(target) as HTMLElement | undefined
  return target
}

async function createPortalApp(base?: string) {
  const router = createPortalRouter(base)
  const app = createApp(App)

  app.use(router)
  app.use(ElementPlus)
  app.use(plugin, getFormKitConfig())
  installErrorCenter(app)
  app.use(I18nPlugin, {
    loadMessages: async (locale: string) => {
      if (locale === 'de-DE') return import('./i18n/locales/de-DE-portal.json').then(m => m.default)
      return import('./i18n/locales/en-US-portal.json').then(m => m.default)
    }
  })
  app.component('CidsCard', CidsCard)
  app.component('PortalIcon', PortalIcon)

  setupBridges(app, router)

  bus.registerApp('portal', ['publish', 'subscribe', 'request', 'reply'], {
    allowTopics: ['*']
  })
  bus.publish('portal.ready', { ok: true })

  // Listen for global navigation events (e.g. from PortalHeader in Host)
  window.addEventListener('portal:navigate', (event) => {
    const path = (event as CustomEvent).detail?.path
    if (path) {
      console.log('[Portal] Received portal:navigate', path)
      router.push(path)
    }
  })

  return { app, router }
}

async function bootstrap(options: PortalMountOptions = {}): Promise<void> {
  if (appInstance) return
  await ensurePortalRuntimeLoaded()
  await bootstrapAuth()
  await initNotifySse()
  await syncUnreadOnce()
  try {
    startUnreadPoll()
    document.addEventListener('visibilitychange', () => { if (!document.hidden) void syncUnreadOnce() })
    window.addEventListener('online', () => { void syncUnreadOnce() })
    bus.subscribe('auth.status.changed', (msg) => {
      const payload = (msg?.payload ?? {}) as Record<string, unknown>
      if ((payload as any)?.isAuthenticated === false) stopUnreadPoll()
    })
  } catch {}
  const manifest = options.manifest ?? await loadManifest()
  ;(window as Window).__MF_MANIFEST__ = manifest
  const { app, router } = await createPortalApp(options.base)
  await loadRemoteApps(router)
  const el = resolveContainer(options.container)
  if (!el) return
  app.mount(el)
  appInstance = app
  mountedElement = el
  if (options.path) {
    try { await router.replace(options.path) } catch {}
  }
}

export async function mount(container: HTMLElement | string, options: PortalMountOptions = {}): Promise<void> {
  await bootstrap({ ...options, container })
}

export async function unmount(): Promise<void> {
  if (!appInstance || !mountedElement) return
  appInstance.unmount()
  mountedElement.innerHTML = ''
  appInstance = undefined
  mountedElement = undefined
}

void bootstrap({ container: DEFAULT_CONTAINER_SELECTOR })
