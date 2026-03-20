/**
 * Auth helpers and token management
 * @author Lorin Luo
 * @description Authentication utilities: token apply/refresh, init, logout
 */
import axios, { type AxiosResponse, type InternalAxiosRequestConfig, type AxiosInstance } from 'axios'
import { DEFAULTS, AUTH_REASON, genId, safePublishAuth } from './shared'

const LEGACY_TOKEN_KEYS = {
  accessToken: 'portal_access_token',
  refreshToken: 'portal_refresh_token',
} as const

const GLOBAL_TOKEN_KEY = '__PORTAL_ACCESS_TOKEN__'

export const getToken = (): string => {
  return (window as any)[GLOBAL_TOKEN_KEY] || ''
}

export const setToken = (token: string): void => {
  (window as any)[GLOBAL_TOKEN_KEY] = String(token || '')
}

export const clearToken = (): void => {
  (window as any)[GLOBAL_TOKEN_KEY] = ''
}

export function clearLegacyTokens(): void {
  try {
    localStorage.removeItem(LEGACY_TOKEN_KEYS.accessToken)
    localStorage.removeItem(LEGACY_TOKEN_KEYS.refreshToken)
  } catch {}
}

type TokenPair = { accessToken: string; refreshToken?: string }

function pickString(obj: unknown, keys: string[]): string {
  if (!obj || typeof obj !== 'object') return ''
  for (const k of keys) {
    const v = (obj as Record<string, unknown>)?.[k]
    if (typeof v === 'string' && v) return v
  }
  return ''
}

function extractTokenPair(payload: unknown): TokenPair | null {
  if (!payload) return null
  const maybe = payload as { data?: unknown }
  const root = maybe?.data && typeof maybe.data === 'object' ? maybe.data : payload
  const accessToken = pickString(root, ['access_token', 'accessToken', 'token'])
  if (!accessToken) return null
  const refreshToken = pickString(root, ['refresh_token', 'refreshToken'])
  return refreshToken ? { accessToken, refreshToken } : { accessToken }
}

export function applyAccessToken(result: unknown, reason?: string): boolean {
  try {
    const payload = (result && typeof (result as AxiosResponse)?.data !== 'undefined') ? (result as AxiosResponse).data : result
    const pair = extractTokenPair(payload)
    const token = pair?.accessToken ?? ''
    if (!token) return false
    clearLegacyTokens()
    setToken(token)
    safePublishAuth(true, String(reason ?? AUTH_REASON.login))
    return true
  } catch {
    return false
  }
}

const refreshClient: AxiosInstance = axios.create({
  baseURL: DEFAULTS.baseURL,
  timeout: DEFAULTS.timeout,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: DEFAULTS.refreshWithCookie,
})

export async function refreshAccessToken(requestId: string): Promise<TokenPair | null> {
  try {
    const res = await refreshClient.post(DEFAULTS.refreshUrl, undefined, { headers: { 'X-Request-Id': requestId } })
    const pair = extractTokenPair(res?.data)
    return pair
  } catch {
    return null
  }
}

export async function initAuth(): Promise<boolean> {
  clearLegacyTokens()
  const pair = await refreshAccessToken(genId('r'))
  const token = pair?.accessToken ?? ''
  if (!token) {
    safePublishAuth(false, 'init_no_session')
    return false
  }
  setToken(token)
  safePublishAuth(true, AUTH_REASON.init_refreshed)
  return true
}

export async function exchangeAuthCode(code: string, redirectUri: string, codeVerifier?: string): Promise<boolean> {
  try {
    const res = await refreshClient.post(
      DEFAULTS.tokenUrl,
      { code, redirectUri, codeVerifier },
      { headers: { 'X-Request-Id': genId('r') } }
    )
    const pair = extractTokenPair(res?.data)
    const token = pair?.accessToken ?? ''
    if (!token) return false
    clearLegacyTokens()
    setToken(token)
    safePublishAuth(true, AUTH_REASON.login)
    return true
  } catch {
    return false
  }
}

export async function logout(postLogoutRedirectUri?: string): Promise<string> {
  try {
    const res = await refreshClient.post(
      DEFAULTS.logoutUrl,
      postLogoutRedirectUri ? { postLogoutRedirectUri } : undefined,
      { headers: { 'X-Request-Id': genId('r') } }
    )
    clearToken()
    safePublishAuth(false, 'logout')
    return pickLogoutUrl(res?.data)
  } catch {
    clearToken()
    safePublishAuth(false, 'logout_failed')
    return ''
  }
}

function pickLogoutUrl(payload: unknown): string {
  let v: any = payload
  for (let i = 0; i < 4; i += 1) {
    if (!v || typeof v !== 'object') return ''
    const direct = v.logout_url ?? v.logoutUrl
    if (typeof direct === 'string' && direct) return direct
    if (!('data' in v)) return ''
    v = v.data
  }
  return ''
}

export function setAuthHeader(original: InternalAxiosRequestConfig & import('axios').AxiosRequestConfig, token: string): void {
  type Headers = InternalAxiosRequestConfig['headers']
  const headers: Record<string, string> = (original.headers ? { ...(original.headers as unknown as Record<string, string>) } : {})
  original.headers = headers as unknown as Headers
  headers.Authorization = `Bearer ${token}`
}
