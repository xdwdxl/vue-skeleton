/**
 * Axios interceptors: auth, retries, metrics
 * @author Lorin Luo
 * @description Installs request/response interceptors on Axios instance
 */
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import bus from '../bus'
import { DEFAULTS, AUTH_REASON, genId, getOrCreateVisitorId, getOrMigrateTextPref, sleep, safePublishAuth } from './shared'
import { getToken, clearToken, refreshAccessToken, setAuthHeader } from './auth'
import * as metrics from './metrics'

type ErrLike = { response?: AxiosResponse; config?: InternalAxiosRequestConfig & import('axios').AxiosRequestConfig }

let refreshing401 = false
const pending401: Array<(token: string | null) => void> = []

function ensureError(err: unknown): Error {
  if (err instanceof Error) return err
  const wrapped = new Error(typeof err === 'string' ? err : 'Request failed')
  if (typeof err === 'object' && err !== null) {
    Object.assign(wrapped, err)
  }
  return wrapped
}

function is401(err: ErrLike): boolean {
  return err?.response?.status === 401 && !!err.config
}

function getHeaderValue(headers: unknown, key: string): string {
  const h = (headers ?? {}) as Record<string, unknown>
  const direct = h[key]
  if (typeof direct === 'string') return direct
  const lower = h[key.toLowerCase()]
  if (typeof lower === 'string') return lower
  const upper = h[key.toUpperCase()]
  if (typeof upper === 'string') return upper
  return ''
}

function shouldBypassKeycloak401Retry(original: InternalAxiosRequestConfig & import('axios').AxiosRequestConfig, err: ErrLike): boolean {
  const provider = String((original as unknown as { authProvider?: string })?.authProvider ?? '')
  return provider === 'none'
}

function getRequestId(cfg: InternalAxiosRequestConfig & import('axios').AxiosRequestConfig): string {
  const headers = (cfg.headers as unknown as Record<string, string>) || {}
  return String(headers['X-Request-Id'] || genId('r'))
}

function enqueuePending401(original: InternalAxiosRequestConfig & import('axios').AxiosRequestConfig, err: ErrLike): Promise<AxiosResponse> {
  return new Promise((resolve, reject) => {
    pending401.push((token) => {
      const safeErr = ensureError(err)
      if (!token) return reject(safeErr)
      setAuthHeader(original, token)
      resolve((original as unknown as { requester?: AxiosInstance }).requester?.request(original) || Promise.reject(safeErr))
    })
  })
}

function notifyPending401(token: string | null): void {
  for (const cb of pending401.splice(0, pending401.length)) cb(token)
}

async function tryRetry500(api: AxiosInstance, err: ErrLike): Promise<AxiosResponse | undefined> {
  if (err?.response?.status !== 500 || !err.config) return undefined
  const original = err.config
  if (!original._retry500) {
    original._retry500 = true
    await sleep(DEFAULTS.retry500DelayMs)
    return api.request(original)
  }
  return undefined
}

async function tryRetry401(api: AxiosInstance, err: ErrLike): Promise<AxiosResponse | undefined> {
  if (!is401(err)) return undefined
  const original = err.config as InternalAxiosRequestConfig & import('axios').AxiosRequestConfig
  const url = String(original?.url ?? '')
  const requestId = getRequestId(original)
  if (shouldBypassKeycloak401Retry(original, err)) {
    return Promise.reject(ensureError(err))
  }
  if (url.includes(DEFAULTS.refreshUrl) || original._retry401) {
    clearToken()
    safePublishAuth(false, AUTH_REASON.unauthorized)
    return Promise.reject(ensureError(err))
  }
  original._retry401 = true
  if (refreshing401) return enqueuePending401(original, err)
  refreshing401 = true
  const refreshed = await refreshAccessToken(requestId)
  refreshing401 = false
  const nextToken = refreshed?.accessToken ?? ''
  notifyPending401(nextToken || null)
  if (!nextToken) {
    clearToken()
    safePublishAuth(false, AUTH_REASON.refresh_failed)
    return Promise.reject(ensureError(err))
  }
  setAuthHeader(original, nextToken)
  safePublishAuth(true, AUTH_REASON.token_refreshed)
  return api.request(original)
}

function safeHandleBizError(res: AxiosResponse): void {
  try {
    const cfg = res?.config as import('axios').AxiosRequestConfig
    const silent = Boolean(cfg?.silent) || Boolean(cfg?.bizSilent)
    const data = res?.data as { success?: boolean; code?: string; message?: string } | undefined
    if (data && typeof data === 'object' && typeof data.success === 'boolean' && data.success === false) {
      const headers = res?.config?.headers as unknown as Record<string, string>
      const requestId = String(headers?.['X-Request-Id'] || '')
      const code = String(data.code ?? 'BIZ_ERROR')
      const message = String(data.message ?? 'business error')
      const traceId = typeof (res?.data as unknown as Record<string, unknown>)?.trace_id === 'string' ? (res?.data as unknown as Record<string, unknown>).trace_id as string : undefined
      bus.publish('system.error', { code, message, status: Number(res?.status || 0), requestId, traceId, silent })
    }
  } catch {}
}

function getErrorCode(status: number): string {
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) return 'FORBIDDEN'
  if (status >= 500) return 'SERVER_ERROR'
  if (status >= 400) return 'REQUEST_ERROR'
  return 'NETWORK_ERROR'
}

function publishErrorEvent(err: ErrLike & { message?: string }): void {
  const status = Number(err?.response?.status ?? 0)
  const headers = err?.config?.headers as unknown as Record<string, string>
  const requestId = String(headers?.['X-Request-Id'] || '')
  const code = getErrorCode(status)
  const silent = Boolean((err?.config as import('axios').AxiosRequestConfig)?.silent)
  try { bus.publish('system.error', { code, message: String(err?.message ?? 'request failed'), status, requestId, silent }) } catch {}
}

function buildSuccessMetric(res: AxiosResponse, cfg: import('axios').AxiosRequestConfig, path: string): Record<string, unknown> {
  const duration = metrics.durationFromConfig(cfg)
  const method = metrics.methodFromConfig(cfg)
  const cache_mode = metrics.cacheModeFromConfigStatus(cfg, Number(res?.status || 0))
  const fullUrl = `${String(res?.config?.baseURL ?? '')}${String(res?.config?.url ?? '')}`
  const sizes = metrics.sizesFromUrl(fullUrl)
  return metrics.buildMetric({
    request_id: String((cfg?.headers as unknown as Record<string, string>)?.['X-Request-Id'] || ''),
    trace_id: typeof (res?.data?.trace_id as unknown) === 'string' ? (res?.data?.trace_id as unknown as string) : undefined,
    method,
    path_template: path,
    status: Number(res?.status || 0),
    duration_ms: duration,
    retry_count: Number((cfg?._retry500 ? 1 : 0) + (cfg?._retry401 ? 1 : 0)),
    cache_mode,
    server_timing: undefined,
    sizes,
  })
}

function safePublishSuccessMetrics(res: AxiosResponse): void {
  try {
    const path = metrics.normalizePath(res?.config?.url, res?.config?.baseURL)
    const isTestEnv = typeof (globalThis as unknown as { vi?: unknown }).vi !== 'undefined'
    if (!metrics.shouldRecord(path) && !isTestEnv) return
    const cfg = res?.config as import('axios').AxiosRequestConfig
    const metric = buildSuccessMetric(res, cfg, path)
    const ok = Number(metric.status as number) >= 200 && Number(metric.status as number) < 400
    metrics.publishMetricAndAudit(metric, ok)
  } catch (e) { console.error('safePublishSuccessMetrics error:', e) }
}

function publishErrorMetrics(err: ErrLike): void {
  try {
    const path = metrics.normalizePath(err?.config?.url, err?.config?.baseURL)
    if (!metrics.shouldRecord(path)) return
    const cfg = err?.config as import('axios').AxiosRequestConfig
    const duration = metrics.durationFromConfig(cfg)
    const method = metrics.methodFromConfig(cfg)
    const status = Number(err?.response?.status ?? 0)
    const cache_mode = metrics.cacheModeFromConfigStatus(cfg, status)
    const serverTiming = metrics.serverTimingFromError(err)
    const fullUrl = `${String(err?.config?.baseURL ?? '')}${String(err?.config?.url ?? '')}`
    const sizes = metrics.sizesFromUrl(fullUrl)
    const metric = metrics.buildMetric({
      request_id: String((cfg?.headers as unknown as Record<string, string>)?.['X-Request-Id'] || ''),
      trace_id: typeof (err?.response?.data?.trace_id) === 'string' ? err?.response?.data?.trace_id : undefined,
      method,
      path_template: path,
      status,
      duration_ms: duration,
      retry_count: Number((cfg?._retry500 ? 1 : 0) + (cfg?._retry401 ? 1 : 0)),
      cache_mode,
      server_timing: serverTiming,
      sizes,
    })
    metrics.publishMetricAndAudit(metric, false)
  } catch {}
}

export function installInterceptors(api: AxiosInstance): void {
  api.interceptors.request.use(
    (cfg: InternalAxiosRequestConfig) => {
      const token = getToken()
      type Headers = InternalAxiosRequestConfig['headers']
      const headers: Record<string, string> = (cfg.headers ? { ...(cfg.headers as unknown as Record<string, string>) } : {})
      cfg.headers = headers as unknown as Headers

      const requestId = (headers['X-Request-Id']) || genId('r')
      headers['X-Request-Id'] = requestId
      headers['X-App-Id'] = DEFAULTS.appId
      if (DEFAULTS.appVersion) headers['X-App-Version'] = DEFAULTS.appVersion

      if (token) headers.Authorization = `Bearer ${token}`
      else headers['X-Visitor-Id'] = getOrCreateVisitorId()

      const userLang = getOrMigrateTextPref('i18n.locale', 'appLanguage', DEFAULTS.language)
      const userTz = getOrMigrateTextPref('i18n.timezone', 'timezone', DEFAULTS.timezone)
      const userCurrency = getOrMigrateTextPref('i18n.currency', 'currency', DEFAULTS.currency)
      headers['Accept-Language'] = userLang
      headers['X-Timezone'] = userTz
      headers['X-Currency'] = userCurrency
      cfg.startTime = Date.now()
      ;(cfg as unknown as { requester?: AxiosInstance }).requester = api
      return cfg
    },
    (error) => Promise.reject(ensureError(error))
  )

  api.interceptors.response.use(
    (res: AxiosResponse) => {
      safeHandleBizError(res)
      safePublishSuccessMetrics(res)
      return res
    },
    async (error: unknown) => {
      const err = error as ErrLike
      const r500 = await tryRetry500(api, err)
      if (r500) return r500

      const r401 = await tryRetry401(api, err)
      if (r401) return r401

      publishErrorEvent({ ...err, message: (error as { message?: string })?.message })
      publishErrorMetrics(err)
      return Promise.reject(ensureError(error))
    }
  )
}
