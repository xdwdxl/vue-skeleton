import { API } from './api'
import { storage } from './storage'
import { genId } from './http/shared'
import { getToken, refreshAccessToken } from './http/auth'
import { initNotifySseAdapter } from './bus'
import config from './config'
 
declare global {
  interface Window {
    __MF_MANIFEST__?: Record<string, string>
  }
}
 
let runtimeInited = false
let stylesInited = false
let stylesInFlight: Promise<void> | null = null
 
function safeString(v: unknown): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return ''
}
 
async function ensurePortalStylesLoaded(): Promise<void> {
  if (stylesInited) return
  if (stylesInFlight) return await stylesInFlight
  stylesInFlight = (async () => {
    try {
      await import('./styles/index.css')
    } catch {
    } finally {
      stylesInited = true
      stylesInFlight = null
    }
  })()
  return await stylesInFlight
}

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
 
  const getQueryParam = (key: string): string | null => {
    try { return new URLSearchParams(window.location.search).get(key) } catch { return null }
  }
 
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
 
export type PortalRuntimeInitOptions = {
  manifest?: Record<string, string>
  enableAuthInit?: boolean
  enableNotifySse?: boolean
}
 
export async function initPortalRuntime(options: PortalRuntimeInitOptions = {}): Promise<void> {
  if (typeof window === 'undefined') return
  if (runtimeInited) return
  runtimeInited = true

  try { await ensurePortalStylesLoaded() } catch {}
 
  (window as any).__PORTAL_AUTH__ = {
    getToken,
    refreshToken: async () => {
      const pair = await refreshAccessToken(genId('r'))
      return pair?.accessToken ?? ''
    },
  }
 
  await ensurePortalRuntimeLoaded()
 
  if (options.enableAuthInit !== false) {
    try { await API.AuthInit() } catch {}
  }
 
  const mf = options.manifest ?? await loadManifest()
  if (mf && typeof mf === 'object') {
    (window as Window).__MF_MANIFEST__ = mf
  }
 
  if (options.enableNotifySse && (config as any).enableNotifySse) {
    try {
      const base = String(config.api.baseURL || '/api').replace(/\/+$/, '')
      initNotifySseAdapter(async () => {
        try {
          const res = await API.NotifySseTicket()
          const ticket = safeString((res as any)?.data?.data?.ticket).trim()
          if (ticket) return `${base}/notify/events?ticket=${encodeURIComponent(ticket)}`
        } catch {}
        return `${base}/notify/events`
      })
    } catch {}
  }
}
