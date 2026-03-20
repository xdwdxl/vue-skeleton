import config from '../config'
import * as VueModule from 'vue'
import * as VueRouterModule from 'vue-router'

const PORTAL_RUNTIME_DATA_ID = 'portal-runtime.json'
const PORTAL_RUNTIME_GROUP = 'PORTAL_GROUP'
const PORTAL_RUNTIME_CACHE_BUSTER_KEY = '_ts'
const PORTAL_RUNTIME_TTL_MS = 5 * 60 * 1000

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

let portalRuntimePromise: Promise<void> | null = null
let portalRuntimeLoadedAt = 0

function isPortalRuntimeUsable(rt: unknown): boolean {
  if (!rt || typeof rt !== 'object') return false
  const mf = (rt as any)?.portal?.mf?.registry
  if (mf && typeof mf === 'object' && Object.keys(mf).length) return true
  const dashboard = (rt as any)?.dashboard
  if (dashboard && typeof dashboard === 'object') return true
  return false
}

async function ensurePortalRuntimeLoaded(options: { force?: boolean } = {}): Promise<void> {
  const force = options.force === true
  try {
    if (typeof window === 'undefined') return
    if (typeof fetch !== 'function') return

    const existing = (window as any).__PORTAL_RUNTIME__
    const freshEnough = Date.now() - portalRuntimeLoadedAt < PORTAL_RUNTIME_TTL_MS
    if (!force && isPortalRuntimeUsable(existing) && freshEnough) return

    if (!force && portalRuntimePromise) return await portalRuntimePromise

    const baseURL = String(config?.api?.baseURL || '/api').trim().replace(/\/$/, '') || '/api'
    const hasCacheBuster = force || !isPortalRuntimeUsable(existing)
    const url = hasCacheBuster
      ? `${baseURL}/config/${encodeURIComponent(PORTAL_RUNTIME_DATA_ID)}?group=${encodeURIComponent(PORTAL_RUNTIME_GROUP)}&${PORTAL_RUNTIME_CACHE_BUSTER_KEY}=${Date.now()}`
      : `${baseURL}/config/${encodeURIComponent(PORTAL_RUNTIME_DATA_ID)}?group=${encodeURIComponent(PORTAL_RUNTIME_GROUP)}`

    portalRuntimePromise = fetch(url, { credentials: 'include', cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) return
        const json = await res.json()
        ;(window as any).__PORTAL_RUNTIME__ = json
        portalRuntimeLoadedAt = Date.now()
      })
      .finally(() => {
        portalRuntimePromise = null
      })

    return await portalRuntimePromise
  } catch {
    portalRuntimePromise = null
  }
}

const containerCache = new Map<string, Promise<RemoteContainer>>()
const containerInited = new WeakMap<RemoteContainer, boolean>()
const moduleCache = new Map<string, Promise<any>>()
let dashboardPreloaded = false

function normalizeRemoteEntryUrl(url: string): string[] {
  const raw = String(url || '').trim()
  if (!raw) return []

  const out = new Set<string>()

  const tryAdd = (u: URL, pathname: string) => {
    const next = new URL(u.toString())
    next.pathname = pathname
    if (raw.startsWith('http://') || raw.startsWith('https://')) out.add(next.toString())
    else out.add(`${next.pathname}${next.search}${next.hash}`)
  }

  const addRawAndVariants = (candidateRaw: string) => {
    const base = (raw.startsWith('http://') || raw.startsWith('https://'))
      ? undefined
      : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
    let u: URL
    try {
      u = new URL(candidateRaw, base)
    } catch {
      out.add(candidateRaw)
      return
    }

    const p = u.pathname || ''
    out.add(candidateRaw)

    if (p.includes('/assets/assets/')) {
      tryAdd(u, p.replace('/assets/assets/', '/assets/'))
    }

    if (p.endsWith('/remoteEntry.js') && !p.endsWith('/assets/remoteEntry.js')) {
      tryAdd(u, p.replace(/\/remoteEntry\.js$/, '/assets/remoteEntry.js'))
    }

    if (p.endsWith('/assets/remoteEntry.js')) {
      tryAdd(u, p.replace(/\/assets\/remoteEntry\.js$/, '/remoteEntry.js'))
    }

    if (p.startsWith('/assets/') && !p.startsWith('/mf/')) {
      tryAdd(u, `/mf/dashboard${p}`)
      tryAdd(u, '/mf/dashboard/remoteEntry.js')
      tryAdd(u, '/mf/dashboard/assets/remoteEntry.js')
    }
  }

  addRawAndVariants(raw)

  return Array.from(out)
    .map((s) => String(s || '').trim())
    .filter(Boolean)
}

function resolveRemoteEntry(remoteName: string): string {
  const fromManifest = String((window as Window).__MF_MANIFEST__?.[remoteName] || '').trim()
  if (fromManifest) return fromManifest
  const fromRuntime = String((window as any)?.__PORTAL_RUNTIME__?.portal?.mf?.registry?.[remoteName] || '').trim()
  return fromRuntime
}

function warmupRemoteOrigin(entry: string): void {
  try {
    const raw = String(entry || '').trim()
    if (!raw) return
    if (typeof document === 'undefined') return
    const base = raw.startsWith('http://') || raw.startsWith('https://') ? undefined : window.location.origin
    const u = new URL(raw, base)
    const origin = u.origin
    const existing = document.querySelector(`link[rel="preconnect"][href="${origin}"]`)
    if (existing) return
    const preconnect = document.createElement('link')
    preconnect.rel = 'preconnect'
    preconnect.href = origin
    preconnect.crossOrigin = 'anonymous'
    document.head.appendChild(preconnect)
    const dns = document.createElement('link')
    dns.rel = 'dns-prefetch'
    dns.href = origin
    document.head.appendChild(dns)
  } catch {}
}

async function importRemoteContainer(url: string): Promise<RemoteContainer> {
  const variants = normalizeRemoteEntryUrl(url)
  let lastError: unknown
  for (const candidate of variants) {
    try {
      return (await import(/* @vite-ignore */ candidate)) as unknown as RemoteContainer
    } catch (e) {
      lastError = e
    }
  }
  throw lastError
}

async function initRemoteContainer(container: RemoteContainer): Promise<void> {
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

async function loadRemoteModule(remoteName: string, exposedModule: string): Promise<any> {
  const entry = resolveRemoteEntry(remoteName)
  if (!entry) {
    throw new Error(`Missing remote entry for ${remoteName}`)
  }
  warmupRemoteOrigin(entry)

  let containerPromise = containerCache.get(entry)
  if (!containerPromise) {
    containerPromise = importRemoteContainer(entry).catch((e) => {
      containerCache.delete(entry)
      throw e
    })
    containerCache.set(entry, containerPromise)
  }
  const container = await containerPromise

  if (container && typeof container.init === 'function' && !containerInited.get(container)) {
    await initRemoteContainer(container)
    containerInited.set(container, true)
  }

  const request = exposedModule.startsWith('./') ? exposedModule : `./${exposedModule}`
  const cacheKey = `${entry}::${request}`
  let modPromise = moduleCache.get(cacheKey)
  if (!modPromise) {
    modPromise = container.get(request).then((factory) => {
      const mod = factory()
      return (mod as any)?.default ?? mod
    }).catch((e) => {
      moduleCache.delete(cacheKey)
      throw e
    })
    moduleCache.set(cacheKey, modPromise)
  }
  return await modPromise
}

export async function preloadDashboardModules(): Promise<void> {
  if (dashboardPreloaded) return
  dashboardPreloaded = true
  try {
    await ensurePortalRuntimeLoaded()
    await Promise.allSettled([
      loadRemoteModule('dashboardApp', './bootstrap'),
      loadRemoteModule('dashboardApp', './Dashboard'),
      loadRemoteModule('dashboardApp', './Helpdesk'),
      loadRemoteModule('dashboardApp', './Invoices'),
      loadRemoteModule('dashboardApp', './AgileBoards'),
    ])
  } catch {}
}

export const REMOTE_LOADERS: Record<string, () => Promise<any>> = {
  '/loadtest': async () => {
    await ensurePortalRuntimeLoaded()
    const candidates = ['./LoadTest', './App']
    let lastError: unknown
    for (const exposed of candidates) {
      try {
        const page = await loadRemoteModule('loadtestApp', exposed)
        return { default: page }
      } catch (e) {
        lastError = e
      }
    }
    throw lastError
  },
  '/dashboard': async () => {
    await ensurePortalRuntimeLoaded()
    try {
      const bootstrap = await loadRemoteModule('dashboardApp', './bootstrap')
      if (typeof (bootstrap as any)?.initDashboardRuntime === 'function') {
        await (bootstrap as any).initDashboardRuntime()
      }
    } catch {}
    void preloadDashboardModules()
    const page = await loadRemoteModule('dashboardApp', './Dashboard')
    return { default: page }
  },
  '/dashboard/helpdesk': async () => {
    await ensurePortalRuntimeLoaded()
    try {
      const bootstrap = await loadRemoteModule('dashboardApp', './bootstrap')
      if (typeof (bootstrap as any)?.initDashboardRuntime === 'function') {
        await (bootstrap as any).initDashboardRuntime()
      }
    } catch {}
    void preloadDashboardModules()
    const page = await loadRemoteModule('dashboardApp', './Helpdesk')
    return { default: page }
  },
  '/dashboard/invoices': async () => {
    await ensurePortalRuntimeLoaded()
    try {
      const bootstrap = await loadRemoteModule('dashboardApp', './bootstrap')
      if (typeof (bootstrap as any)?.initDashboardRuntime === 'function') {
        await (bootstrap as any).initDashboardRuntime()
      }
    } catch {}
    void preloadDashboardModules()
    const page = await loadRemoteModule('dashboardApp', './Invoices')
    return { default: page }
  },
  '/dashboard/agiles': async () => {
    await ensurePortalRuntimeLoaded()
    try {
      const bootstrap = await loadRemoteModule('dashboardApp', './bootstrap')
      if (typeof (bootstrap as any)?.initDashboardRuntime === 'function') {
        await (bootstrap as any).initDashboardRuntime()
      }
    } catch {}
    void preloadDashboardModules()
    const page = await loadRemoteModule('dashboardApp', './AgileBoards')
    return { default: page }
  },
}
