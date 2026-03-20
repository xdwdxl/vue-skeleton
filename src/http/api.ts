/**
 * Axios instance and helpers
 * @author Lorin Luo
 * @description Configured Axios client with interceptors and helpers
 */
import axios, { type AxiosInstance, type AxiosResponse, type AxiosRequestConfig } from 'axios'
import { setupCacheInterceptor } from '../cache/interceptors'
import { DEFAULTS } from './shared'
import { installInterceptors } from './interceptors'
import { setHttpClientForMetrics, loadHttpAuditConfig, loadHttpMetricsConfig } from './metrics'

export const api: AxiosInstance = (() => {
  const globalKey = '__PORTAL_AXIOS__'
  const globalApi = (window as any)[globalKey] as AxiosInstance | undefined
  if (globalApi) return globalApi

  const instance = axios.create({
    baseURL: DEFAULTS.baseURL,
    timeout: DEFAULTS.timeout,
    headers: { 'Content-Type': 'application/json' },
    validateStatus: (status) => (status >= 200 && status < 300) || status === 304,
  })

  ;(window as any)[globalKey] = instance
  
  installInterceptors(instance)
  setHttpClientForMetrics(instance)
  loadHttpMetricsConfig()
  loadHttpAuditConfig()
  setupCacheInterceptor(instance)

  return instance
})()

export type BffEnvelope<T = unknown> = {
  success?: boolean
  code?: string
  message?: string
  data?: T
  request_id?: string
  trace_id?: string
}

declare module 'axios' {
  export interface AxiosRequestConfig {
    silent?: boolean
    bizSilent?: boolean
    startTime?: number
    _retry500?: boolean
    _retry401?: boolean
  }
}



export const isRequestSuccess = (result: unknown): boolean => {
  const maybe = (result ?? {}) as { isAxiosError?: boolean; status?: number }
  return !maybe.isAxiosError && typeof maybe.status === 'number' && maybe.status >= 200 && maybe.status < 300
}

export const getResultData = <T = unknown>(result: any): T | undefined => (isRequestSuccess(result) ? (result as AxiosResponse<T>).data : undefined)

export const isBffSuccess = (result: unknown): boolean => {
  if (!isRequestSuccess(result)) return false
  const data = (result as AxiosResponse)?.data as BffEnvelope | undefined
  if (!data || typeof data !== 'object') return true
  if (typeof data.success !== 'boolean') return true
  return data.success
}

export const getBffData = <T = unknown>(result: any): T | undefined => {
  if (!isRequestSuccess(result)) return undefined
  const env = (result as AxiosResponse)?.data as BffEnvelope<T> | undefined
  if (!env || typeof env !== 'object') return (result as AxiosResponse)?.data as unknown as T
  if (typeof env.success !== 'boolean') return env as unknown as T
  return env.success ? env.data : undefined
}

export const unwrapBffData = <T = unknown>(input: any, maxDepth = 3): T | undefined => {
  let data = input
  if (data && typeof data === 'object' && 'status' in data && 'data' in data) {
    data = (data as AxiosResponse).data
  }
  let depth = Math.max(0, Math.floor(Number(maxDepth) || 0))
  while (depth > 0 && data && typeof data === 'object' && typeof (data as any).success === 'boolean') {
    if ((data as any).success === false) return undefined
    data = (data as any).data
    depth -= 1
  }
  return data as T
}

export const getBffErrorCode = (result: any): string | undefined => {
  if (!isRequestSuccess(result)) return undefined
  const env = (result as AxiosResponse)?.data as BffEnvelope | undefined
  if (!env || typeof env !== 'object') return undefined
  if (typeof env.success !== 'boolean') return undefined
  return env.success ? undefined : (env.code ?? 'BIZ_ERROR')
}

/**
 * Unified API result
 * @author Lorin Luo
 */
export type ApiResult<T = unknown> = {
  ok: boolean
  status: number
  data?: T
  code?: string
  error?: string
  requestId?: string
  traceId?: string
}

/**
 * Convert Axios response or error to ApiResult
 * @author Lorin Luo
 * @param {any} result - Axios response or error
 * @returns {ApiResult<T>}
 */
export function toResult<T = unknown>(result: any): ApiResult<T> {
  const isOk = isRequestSuccess(result)
  if (isOk) {
    const res = result as AxiosResponse<BffEnvelope<T>>
    const okBff = isBffSuccess(res)
    const data = okBff ? getBffData<T>(res) : undefined
    const code = okBff ? undefined : getBffErrorCode(res) ?? 'BIZ_ERROR'
    const headers = (res?.config?.headers as unknown as Record<string, string>) || {}
    return {
      ok: okBff,
      status: Number(res.status || 0),
      data,
      code,
      requestId: String(headers['X-Request-Id'] || ''),
      traceId: typeof (res?.data as unknown as BffEnvelope)?.trace_id === 'string' ? (res?.data as unknown as BffEnvelope).trace_id : undefined,
    }
  }
  const err = result as { response?: AxiosResponse; message?: string; config?: AxiosRequestConfig }
  const status = Number(err?.response?.status ?? 0)
  const headers = (err?.config?.headers as unknown as Record<string, string>) || {}
  return {
    ok: false,
    status,
    error: String(err?.message ?? 'request failed'),
    requestId: String(headers['X-Request-Id'] || ''),
  }
}

/**
 * GET request with unified ApiResult
 * @author Lorin Luo
 */
export async function getR<T = unknown>(url: string, params?: Record<string, unknown>, extraCfg?: AxiosRequestConfig): Promise<ApiResult<T>> {
  try {
    const res = await api.get(url, { params, ...(extraCfg || {}) })
    return toResult<T>(res as AxiosResponse<BffEnvelope<T>>)
  } catch (e) {
    return toResult<T>(e)
  }
}

/**
 * POST request with unified ApiResult
 * @author Lorin Luo
 */
export async function postR<T = unknown>(url: string, data?: unknown, extraCfg?: AxiosRequestConfig): Promise<ApiResult<T>> {
  try {
    const res = await api.post(url, data, extraCfg)
    return toResult<T>(res as AxiosResponse<BffEnvelope<T>>)
  } catch (e) {
    return toResult<T>(e)
  }
}

/**
 * PUT request with unified ApiResult
 * @author Lorin Luo
 */
export async function putR<T = unknown>(url: string, data?: unknown, extraCfg?: AxiosRequestConfig): Promise<ApiResult<T>> {
  try {
    const res = await api.put(url, data, extraCfg)
    return toResult<T>(res as AxiosResponse<BffEnvelope<T>>)
  } catch (e) {
    return toResult<T>(e)
  }
}

/**
 * PATCH request with unified ApiResult
 * @author Lorin Luo
 */
export async function patchR<T = unknown>(url: string, data?: unknown, extraCfg?: AxiosRequestConfig): Promise<ApiResult<T>> {
  try {
    const res = await api.patch(url, data, extraCfg)
    return toResult<T>(res as AxiosResponse<BffEnvelope<T>>)
  } catch (e) {
    return toResult<T>(e)
  }
}

/**
 * DELETE request with unified ApiResult
 * @author Lorin Luo
 */
export async function delR<T = unknown>(url: string, data?: unknown, extraCfg?: AxiosRequestConfig): Promise<ApiResult<T>> {
  try {
    const res = await api.delete(url, { ...(extraCfg || {}), data })
    return toResult<T>(res as AxiosResponse<BffEnvelope<T>>)
  } catch (e) {
    return toResult<T>(e)
  }
}

/**
 * GET request (Promise preferred; callback optional for side effects)
 * @author Lorin Luo
 */
export function get(url: string, params?: Record<string, unknown>, callback?: (res: any) => void, extraCfg?: AxiosRequestConfig): Promise<AxiosResponse> {
  const p = api.get(url, { params, ...(extraCfg || {}) })
  p.then((r) => callback && callback(r)).catch((e) => callback && callback(e))
  return p
}

/**
 * POST request (Promise preferred; callback optional for side effects)
 * @author Lorin Luo
 */
export function post(url: string, data?: unknown, callback?: (res: any) => void, extraCfg?: AxiosRequestConfig): Promise<AxiosResponse> {
  const p = api.post(url, data, extraCfg)
  p.then((r) => callback && callback(r)).catch((e) => callback && callback(e))
  return p
}

/**
 * PUT request (Promise preferred; callback optional for side effects)
 * @author Lorin Luo
 */
export function put(url: string, data?: unknown, callback?: (res: any) => void, extraCfg?: AxiosRequestConfig): Promise<AxiosResponse> {
  const p = api.put(url, data, extraCfg)
  p.then((r) => callback && callback(r)).catch((e) => callback && callback(e))
  return p
}

/**
 * PATCH request (Promise preferred; callback optional for side effects)
 * @author Lorin Luo
 */
export function patch(url: string, data?: unknown, callback?: (res: any) => void, extraCfg?: AxiosRequestConfig): Promise<AxiosResponse> {
  const p = api.patch(url, data, extraCfg)
  p.then((r) => callback && callback(r)).catch((e) => callback && callback(e))
  return p
}

/**
 * DELETE request (Promise preferred; callback optional for side effects)
 * @author Lorin Luo
 */
export function del(url: string, data?: unknown, callback?: (res: any) => void, extraCfg?: AxiosRequestConfig): Promise<AxiosResponse> {
  const p = api.delete(url, { ...(extraCfg || {}), data })
  p.then((r) => callback && callback(r)).catch((e) => callback && callback(e))
  return p
}

export default api

export { applyAccessToken, initAuth, exchangeAuthCode, logout } from './auth'
