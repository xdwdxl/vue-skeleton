/**
 * HTTP metrics instrumentation
 * @author Lorin Luo
 * @description Sampling, burst limiting, and metric building/publishing
 */
import type { AxiosInstance, AxiosResponse } from 'axios'
import bus from '../bus'
import { DEFAULTS, ONE_MINUTE_MS } from './shared'

type MetricsConfig = {
  sampling: number
  slow_threshold_ms: number
  burst_limit: number
  routes?: { include?: string[]; exclude?: string[] }
  fields?: { resourceTiming?: boolean; serverTiming?: boolean; sizes?: boolean }
}

const METRICS_GROUP = (import.meta.env.VITE_HTTP_METRICS_GROUP as string) || 'PORTAL_GROUP'
const METRICS_DATA_ID = (import.meta.env.VITE_HTTP_METRICS_DATA_ID as string) || 'portal.http.metrics.json'
const AUDIT_GROUP = (import.meta.env.VITE_HTTP_AUDIT_GROUP as string) || 'PORTAL_GROUP'
const AUDIT_DATA_ID = (import.meta.env.VITE_HTTP_AUDIT_DATA_ID as string) || 'portal.audit.http.json'

type AuditHttpConfig = {
  mode?: 'whitelist' | 'disabled' | 'all'
  routes?: { include?: string[]; exclude?: string[] }
  default?: {
    enabled?: boolean
    sample?: number
    minDurationMs?: number
    onlyError?: boolean
    action_code?: string
    object_type?: string
  }
  rules?: Record<string, {
    enabled?: boolean
    sample?: number
    minDurationMs?: number
    onlyError?: boolean
    action_code?: string
    object_type?: string
  }>
}

const AUDIT_DEFAULTS: AuditHttpConfig = {
  mode: 'whitelist',
  routes: { include: [], exclude: [] },
  default: { enabled: true, sample: 1, minDurationMs: 0, onlyError: false, action_code: 'http.request' },
  rules: {},
}
const METRICS_DEFAULTS: MetricsConfig = {
  sampling: Math.min(1, Math.max(0, Number(import.meta.env.VITE_HTTP_METRICS_SAMPLING ?? 0.2))),
  slow_threshold_ms: Math.max(0, Number(import.meta.env.VITE_HTTP_METRICS_SLOW_MS ?? 2000)),
  burst_limit: Math.max(1, Number(import.meta.env.VITE_HTTP_METRICS_BURST ?? 120)),
  routes: { include: [], exclude: [] },
  fields: { resourceTiming: false, serverTiming: true, sizes: false },
}

let metricsCfg: MetricsConfig = { ...METRICS_DEFAULTS }
let windowStart = Math.floor(Date.now() / ONE_MINUTE_MS)
let auditCfg: AuditHttpConfig = { ...AUDIT_DEFAULTS }
let windowCount = 0
let httpClient: AxiosInstance | null = null


export function setHttpClientForMetrics(client: AxiosInstance): void {
  httpClient = client
}

/**
 * Normalize URL path with optional base
 * @author Lorin Luo
 * @param {string | undefined} url - The URL to normalize
 * @param {string} [base] - Optional base path
 * @returns {string} - Normalized path
 */
export const normalizePath = (url: string | undefined, base?: string): string => {
  const path = String(url ?? '').split('?')[0]

  if (!base || /^https?:\/\//.test(path) || path.startsWith(base)) {
    return path
  }
  
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${cleanBase}${cleanPath}`
}

function matchRoute(path: string): boolean {
  const inc = metricsCfg.routes?.include || []
  const exc = metricsCfg.routes?.exclude || []
  for (const e of exc) if (e && path.startsWith(e)) return false
  if (inc.length === 0) return true
  for (const i of inc) if (i && path.startsWith(i)) return true
  return false
}

function allowBurst(): boolean {
  const nowWindow = Math.floor(Date.now() / ONE_MINUTE_MS)
  if (nowWindow !== windowStart) {
    windowStart = nowWindow
    windowCount = 0
  }
  if (windowCount >= metricsCfg.burst_limit) return false
  windowCount++
  return true
}

function secureRandom(): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    return array[0] / (0xffffffff + 1)
  }
  // Return 1 to force sampling (safe default) or 0 to disable? 
  // Returning 0 means we never sample if crypto is missing.
  return 0
}

export function shouldSample(path: string): boolean {
  if (!matchRoute(path)) return false
  const r = secureRandom()
  return r < (metricsCfg.sampling ?? 0)
}

function matchAuditRoute(path: string): boolean {
  const mode = auditCfg.mode || 'whitelist'
  if (mode === 'disabled') return false
  const inc = auditCfg.routes?.include || []
  const exc = auditCfg.routes?.exclude || []
  for (const e of exc) if (e && path.startsWith(e)) return false
  if (mode === 'all') return true
  if (inc.length === 0) return false
  for (const i of inc) if (i && path.startsWith(i)) return true
  return false
}

function pickAuditRule(path: string): NonNullable<AuditHttpConfig['default']> {
  const base = auditCfg.default || {}
  const rules = auditCfg.rules || {}
  let bestKey = ''
  for (const k of Object.keys(rules)) {
    if (!k) continue
    if (!path.startsWith(k)) continue
    if (k.length > bestKey.length) bestKey = k
  }
  const picked = bestKey ? (rules[bestKey] || {}) : {}
  return { ...base, ...picked }
}

function shouldAuditHttp(metric: Record<string, unknown>, ok: boolean): { action_code: string; object_type?: string } | null {
  const path = String(metric?.path_template ?? '').trim()
  if (!path) return null
  if (!matchAuditRoute(path)) return null

  const rule = pickAuditRule(path)
  if (rule.enabled === false) return null

  const sample = Math.min(1, Math.max(0, Number(rule.sample ?? 1)))
  if (sample <= 0) return null
  if (sample < 1 && secureRandom() >= sample) return null

  if (rule.onlyError && ok) return null

  const minDurationMs = Math.max(0, Number(rule.minDurationMs ?? 0))
  const durationMs = Number(metric?.duration_ms ?? 0)
  if (minDurationMs > 0 && Number.isFinite(durationMs) && durationMs < minDurationMs) return null

  const action = String(rule.action_code ?? 'http.request').trim() || 'http.request'
  const objectType = String(rule.object_type ?? '').trim() || undefined
  return { action_code: action, object_type: objectType }
}

export function parseServerTiming(header: string | undefined): Record<string, number> | undefined {
  const h = String(header ?? '').trim()
  if (!h) return undefined
  const out: Record<string, number> = {}
  for (const part of h.split(',')) {
    const seg = part.trim()
    if (!seg) continue
    const parts = seg.split(';').map(s => s.trim())
    const name = parts[0]
    if (!name) continue
    
    let durVal = NaN
    for (let i = 1; i < parts.length; i++) {
      const kv = parts[i].split('=')
      if (kv[0] === 'dur') {
        durVal = Number(kv[1])
        break
      }
    }
    
    if (!Number.isNaN(durVal)) out[name] = durVal
  }
  return Object.keys(out).length ? out : undefined
}

export function getResourceTiming(fullUrl: string): PerformanceResourceTiming | undefined {
  try {
    const entries = performance.getEntriesByName(fullUrl, 'resource') as PerformanceResourceTiming[]
    return entries?.length ? entries[entries.length - 1] : undefined
  } catch {
    return undefined
  }
}

export async function loadHttpMetricsConfig(): Promise<void> {
  try {
    if (!httpClient) return
    const res = await httpClient.get(`/config/${METRICS_DATA_ID}`, { params: { group: METRICS_GROUP } })
    const cfg = res?.data as Partial<MetricsConfig> | undefined
    if (cfg && typeof cfg === 'object') {
      metricsCfg = {
        ...metricsCfg,
        ...(cfg),
        routes: { ...(metricsCfg.routes || {}), ...(cfg.routes || {}) },
        fields: { ...(metricsCfg.fields || {}), ...(cfg.fields || {}) },
      }
    }
  } catch {}
}

export async function loadHttpAuditConfig(): Promise<void> {
  try {
    if (!httpClient) return
    const res = await httpClient.get(`/config/${AUDIT_DATA_ID}`, { params: { group: AUDIT_GROUP } })
    const cfg = res?.data as Partial<AuditHttpConfig> | undefined
    if (cfg && typeof cfg === 'object') {
      auditCfg = {
        ...auditCfg,
        ...(cfg),
        routes: { ...(auditCfg.routes || {}), ...(cfg.routes || {}) },
        default: { ...(auditCfg.default || {}), ...(cfg.default || {}) },
        rules: { ...(auditCfg.rules || {}), ...(cfg.rules || {}) },
      }
    }
  } catch {}
}

bus.subscribe('config.updated', (msg) => {
  const p = (msg?.payload ?? {}) as Record<string, unknown>
  const dataId = typeof p?.dataId === 'string' ? p.dataId : ''
  const group = typeof p?.group === 'string' ? p.group : ''
  if (!dataId || !group) return
  if (group === METRICS_GROUP && dataId === METRICS_DATA_ID) loadHttpMetricsConfig()
  if (group === AUDIT_GROUP && dataId === AUDIT_DATA_ID) loadHttpAuditConfig()
})

export function shouldRecord(path: string): boolean {
  return allowBurst() && shouldSample(path)
}

export function durationFromConfig(cfg: import('axios').AxiosRequestConfig): number {
  const started = Number(cfg?.startTime ?? 0)
  return started ? Date.now() - started : 0
}

export function methodFromConfig(cfg: import('axios').AxiosRequestConfig): string {
  return String(cfg?.method ?? 'GET').toUpperCase()
}

export function cacheModeFromConfigStatus(cfg: import('axios').AxiosRequestConfig, status: number): string {
  const hadInm = Boolean((cfg?.headers as unknown as Record<string, string>)?.['If-None-Match'])
  if (hadInm) {
    return status === 304 ? 'etag_hit' : 'etag_miss'
  }
  return 'none'
}

export function serverTimingFromError(err: { response?: AxiosResponse }): Record<string, number> | undefined {
  const headers = (err?.response?.headers as unknown as Record<string, string>) || {}
  return metricsCfg.fields?.serverTiming ? parseServerTiming(headers['server-timing']) : undefined
}

export function sizesFromUrl(fullUrl: string): { transfer_size: number; encoded_body_size: number; decoded_body_size: number } | undefined {
  if (!metricsCfg.fields?.sizes) return undefined
  const rt = metricsCfg.fields?.resourceTiming ? getResourceTiming(fullUrl) : undefined
  if (!rt) return undefined
  return {
    transfer_size: Number(rt.transferSize || 0),
    encoded_body_size: Number(rt.encodedBodySize || 0),
    decoded_body_size: Number(rt.decodedBodySize || 0),
  }
}

export function buildMetric(input: {
  request_id: string
  trace_id?: string
  method: string
  path_template: string
  status: number
  duration_ms: number
  retry_count: number
  cache_mode: string
  server_timing?: Record<string, number>
  sizes?: { transfer_size: number; encoded_body_size: number; decoded_body_size: number }
}): Record<string, unknown> {
  return {
    ts: Date.now(),
    app_id: DEFAULTS.appId,
    env: (import.meta.env.MODE) || 'dev',
    request_id: input.request_id,
    trace_id: input.trace_id,
    method: input.method,
    path_template: input.path_template,
    status: input.status,
    duration_ms: input.duration_ms,
    retry_count: input.retry_count,
    cache_mode: input.cache_mode,
    server_timing: input.server_timing,
    ...(input.sizes ? { sizes: input.sizes } : {}),
  }
}

export function publishMetricAndAudit(metric: Record<string, unknown>, ok: boolean): void {
  try { bus.publish('metrics.http', metric) } catch {}
  try {
    const picked = shouldAuditHttp(metric, ok)
    if (!picked) return
    bus.publish('audit.event', {
      action_code: picked.action_code,
      result_code: ok ? 'OK' : 'ERROR',
      request_id: metric.request_id as string,
      trace_id: metric.trace_id as string | undefined,
      ...(picked.object_type ? { object_type: picked.object_type } : {}),
      params: metric,
      service: DEFAULTS.appId,
      env: metric.env as string,
    })
  } catch {}
}

