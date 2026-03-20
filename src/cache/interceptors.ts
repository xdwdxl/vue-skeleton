/**
 * Basic ETag cache interceptors
 * @author Lorin Luo
 * @description Adds If-None-Match on GET and stores response ETag
 */
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

const etagCache = new Map<string, { etag: string; data: unknown }>()

export function setupCacheInterceptor(api: AxiosInstance): void {
  api.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
    if ((cfg.method ?? 'get').toLowerCase() === 'get') {
      const key = buildKey(cfg)
      const cached = etagCache.get(key)
      type Headers = InternalAxiosRequestConfig['headers']
      const headers: Record<string, string> = (cfg.headers ? { ...(cfg.headers as unknown as Record<string, string>) } : {})
      cfg.headers = headers as unknown as Headers
      if (cached?.etag) headers['If-None-Match'] = cached.etag
      headers['Cache-Control'] = 'no-cache'
    }
    return cfg
  })

  api.interceptors.response.use((res: AxiosResponse) => {
    const key = buildKey(res.config as unknown as InternalAxiosRequestConfig)
    
    if (res.status === 304) {
      const cached = etagCache.get(key)
      if (cached?.data) {
        res.data = cached.data
      }
      return res
    }

    const etag = (res.headers as unknown as Record<string, string>)?.etag
    if (key && etag) etagCache.set(key, { etag, data: res.data })
    return res
  })
}

/**
 * Build ETag cache key with localization dimensions
 * @author Lorin Luo
 * @param {InternalAxiosRequestConfig} cfg - Axios request config
 * @returns {string} - Cache key
 */
function buildKey(cfg: InternalAxiosRequestConfig): string {
  const base = cfg.baseURL ? `${cfg.baseURL}${cfg.url ?? ''}` : (cfg.url ?? '')
  const params = normalizeParams((cfg as unknown as { params?: unknown })?.params)
  const headers = (cfg.headers as unknown as Record<string, string>) || {}
  const lang = String(headers['Accept-Language'] || '')
  const tz = String(headers['X-Timezone'] || '')
  const cur = String(headers['X-Currency'] || '')
  const uid = String(headers['X-User-Id'] || '')
  return `${base}?${params}|lang=${lang}|tz=${tz}|cur=${cur}|uid=${uid}`
}

function normalizeParams(params: unknown): string {
  if (!params || typeof params !== 'object') return ''
  try {
    const obj = params as Record<string, unknown>
    const keys = Object.keys(obj).sort()
    const sp = new URLSearchParams()
    for (const k of keys) {
      const v = obj[k]
      if (v === undefined || v === null) continue
      if (Array.isArray(v)) {
        for (const it of v) {
          if (it === undefined || it === null) continue
          sp.append(k, String(it))
        }
        continue
      }
      sp.set(k, String(v))
    }
    return sp.toString()
  } catch {
    return ''
  }
}
