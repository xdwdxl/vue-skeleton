/**
 * @file index.ts
 * @author Lorin Luo
 * @description Centralized API definitions for the Portal application
 */

import { exchangeAuthCode, initAuth, logout, applyAccessToken, get, post, put, del } from '../http/api'
import { getToken as getPortalAccessToken } from '../http/auth'
import { DEFAULTS } from '../http/shared'
import config from '../config'

function getPortalRuntime(): any {
  return (globalThis as any)?.window?.__PORTAL_RUNTIME__?.portal
}

type PermMeResponse = {
  userId: string
  groups: string[]
  permissions: string[]
  ts: number
}

type UserSettingResponse = {
  key: string
  value?: string | null
}

type PermCatalogItem = {
  key: string
  name: string
  appId: string
  path?: string[]
  action?: string
  moduleLabel?: string
  domainLabel?: string
  actionLabel?: string
}

type PermKeycloakUserItem = {
  id: string
  username?: string
  email?: string
  displayName?: string
}

function nowMs(): number {
  return Date.now()
}

function safeJsonParse<T>(text: string): T | null {
  try { return JSON.parse(text) as T } catch { return null }
}

function safeJsonStringify(v: unknown): string {
  try { return JSON.stringify(v) } catch { return '' }
}

function base64UrlDecode(text: string): string {
  const raw = String(text || '').replace(/-/g, '+').replace(/_/g, '/')
  const pad = raw.length % 4 ? '='.repeat(4 - (raw.length % 4)) : ''
  try { return atob(raw + pad) } catch { return '' }
}

function pickJwtPayload(token: string): Record<string, unknown> | null {
  const t = String(token || '').trim()
  const parts = t.split('.')
  if (parts.length < 2) return null
  const json = base64UrlDecode(parts[1])
  if (!json) return null
  return safeJsonParse<Record<string, unknown>>(json)
}

export const API = {
  /**
   * Fetch configuration from Nacos via BFF
   * @param {Record<string, any>} params - { dataId, group }
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<AxiosResponse>}
   */
  GetConfig(params: { dataId: string; group: string }, callback?: (res: any) => void) {
    return get(`/config/${params.dataId}`, { group: params.group }, callback)
  },

  /**
   * Ingest audit events
   * @param {Record<string, any>} params - { events: AuditEvent[], reason?: string, endpoint?: string }
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<AxiosResponse>}
   */
  PostAuditEvents(params: { events: Array<Record<string, unknown>>; reason?: string; endpoint?: string }, callback?: (res: any) => void) {
    const { events, reason, endpoint } = params
    return post(endpoint ?? '/audit/events', { events, reason }, callback, { silent: true })
  },

  /**
   * Get audit system status
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<AxiosResponse>}
   */
  GetAuditStatus(callback?: (res: any) => void) {
    return get('/audit/status', undefined, callback)
  },

  /**
   * Query audit events
   * @param {Record<string, any>} [params] - Filters
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<AxiosResponse>}
   */
  GetAuditEvents(params?: Record<string, unknown>, callback?: (res: any) => void) {
    return get('/audit/events', params || {}, callback)
  },

  /**
   * Export audit events
   * @param {Record<string, any>} [params] - Filters
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<AxiosResponse>}
   */
  PostAuditExport(params?: Record<string, unknown>, callback?: (res: any) => void) {
    return post('/audit/export', params || {}, callback, { silent: true })
  },

  /**
   * Publish configuration to Nacos
   * @param {Object} params - Publish parameters
   * @param {string} params.dataId - Config Data ID
   * @param {string} params.group - Config Group
   * @param {string} params.content - Config Content
   * @param {string} params.etag - Optimistic locking tag
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<AxiosResponse>}
   */
  ConfigPublish(params: { dataId: string; group: string; content: string; etag: string }, callback?: (res: any) => void) {
    return post('/config/publish', params, callback)
  },

  /**
   * List i18n keys
   * @param {Object} params - Query parameters
   * @param {string} params.locale - Locale (e.g., en-US)
   * @param {string} params.app - App ID
   * @param {string} [params.domain] - Domain (optional)
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<AxiosResponse>}
   */
  I18nList(params: { locale: string; app: string; domain?: string }, callback?: (res: any) => void) {
    return get('/admin/i18n/list', params, callback)
  },

  /**
   * Export i18n keys
   * @param {Object} params - Query parameters
   * @param {string} params.locale - Locale
   * @param {string} params.app - App ID
   * @param {string} [params.domain] - Domain
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<AxiosResponse>}
   */
  I18nExport(params: { locale: string; app: string; domain?: string }, callback?: (res: any) => void) {
    return get('/admin/i18n/export', params, callback)
  },

  /**
   * Import i18n keys
   * @param {Object} params - Import parameters
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<AxiosResponse>}
   */
  I18nImport(params: { locale: string; app: string; domain?: string; etag: string; items: Record<string, unknown> }, callback?: (res: any) => void) {
    return post('/admin/i18n/import', params, callback)
  },

  /**
   * Publish single i18n key or items
   * @param {Object} params - Publish parameters
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<AxiosResponse>}
   */
  I18nPublish(params: { locale: string; app: string; domain?: string; etag: string; items?: Record<string, unknown>; key?: string; value?: unknown }, callback?: (res: any) => void) {
    return post('/admin/i18n/publish', params, callback)
  },

  /**
   * Get notification inbox
   * @param {Object} [params] - Pagination params
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<AxiosResponse>}
   */
  NotifyInbox(params?: { cursor?: string; limit?: number }, callback?: (res: any) => void) {
    return get('/notify/inbox', params, callback)
  },

  /**
   * Mark notifications as read
   * @param {Object} params - { ids: string[] }
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<AxiosResponse>}
   */
  NotifyRead(params: { ids: string[] }, callback?: (res: any) => void) {
    return post('/notify/read', params, callback)
  },

  /**
   * Mark all notifications as read
   * @param {Record<string, any>} [_params] - Unused
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<AxiosResponse>}
   */
  NotifyReadAll(_params?: Record<string, unknown>, callback?: (res: any) => void) {
    return post('/notify/read-all', {}, callback)
  },

  /**
   * Get broadcast notifications
   * @param {Object} [params] - { locale?: string }
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<AxiosResponse>}
   */
  NotifyBroadcast(params?: { locale?: string }, callback?: (res: any) => void) {
    return get('/notify/broadcast', params, callback)
  },

  /**
   * Create SSE ticket for personal notification stream
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<AxiosResponse>}
   */
  NotifySseTicket(_params?: Record<string, unknown>, callback?: (res: any) => void) {
    return post('/notify/sse-ticket', undefined, callback)
  },

  NotifyAdminSend(params: { title: string; message: string; groups: string[]; level?: string }, callback?: (res: any) => void) {
    return post('/notify/admin/send', params, callback, { withCredentials: true })
  },

  /**
   * Fetch JSON from URL
   * @param {string} url - URL to fetch
   * @returns {Promise<any>}
   */
  FetchJson(url: string): Promise<unknown> {
    return fetch(url).then(res => res.ok ? res.json() : undefined).catch(() => undefined)
  },

  /**
   * Build Keycloak login redirect URL (BFF /auth/login)
   * @param {Object} params - Login URL params
   * @param {string} params.redirectUri - Redirect URI (must match Keycloak client)
   * @param {string} [params.state] - Optional state
   * @returns {string} - Login URL
   */
  AuthLoginUrl(params: { redirectUri: string; state?: string }): string {
    const base = String(config.api.baseURL || '/api')
    const sp = new URLSearchParams()
    sp.set('redirect_uri', params.redirectUri)
    if (params.state) sp.set('state', params.state)
    return `${base}/auth/login?${sp.toString()}`
  },

  /**
   * Exchange auth code to access token (refresh token stored in HttpOnly cookie)
   * @param {Object} params - Token exchange params
   * @param {string} params.code - Authorization code
   * @param {string} params.redirectUri - Redirect URI used for login
   * @param {string} [params.codeVerifier] - PKCE verifier (optional)
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<AxiosResponse>}
   */
  AuthToken(params: { code: string; redirectUri: string; codeVerifier?: string }, callback?: (res: any) => void) {
    return post(DEFAULTS.tokenUrl, params, (res) => { try { applyAccessToken(res, 'login') } catch {}  if (callback) callback(res) }, { withCredentials: true })
  },

  /**
   * Refresh access token using refresh cookie
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<AxiosResponse>}
   */
  AuthRefresh(_params?: Record<string, unknown>, callback?: (res: any) => void) {
    return post(DEFAULTS.refreshUrl, undefined, (res) => { try { applyAccessToken(res, 'token_refreshed') } catch {}  if (callback) callback(res) }, { withCredentials: true })
  },

  /**
   * Logout and clear refresh cookie
   * @param {Object} [params] - Logout params
   * @param {string} [params.postLogoutRedirectUri] - Post-logout redirect URI
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<AxiosResponse>}
   */
  AuthLogout(params?: { postLogoutRedirectUri?: string }, callback?: (res: any) => void) {
    return post(DEFAULTS.logoutUrl, params, callback, { withCredentials: true })
  },

  /**
   * Get current user from Keycloak userinfo
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<AxiosResponse>}
   */
  AuthMe(_params?: Record<string, unknown>, callback?: (res: any) => void) {
    return get('/auth/me', undefined, callback, { withCredentials: true })
  },

  /**
   * Get generic user key/value setting
   * @param {Object} params - { key, userId? }
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<{ data: UserSettingResponse }>}
   */
  UserSettingGet(params: { key: string; userId?: string }, callback?: (res: any) => void): Promise<{ data: UserSettingResponse }> {
    const cfg: any = { withCredentials: true }
    if (params.userId) {
      cfg.headers = { ...(cfg.headers || {}), 'X-User-Id': params.userId }
    }
    return get('/settings/user', { key: params.key }, callback, cfg) as unknown as Promise<{ data: UserSettingResponse }>
  },

  /**
   * Update generic user key/value setting
   * @param {Object} params - { key, value, userId? }
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<{ data: UserSettingResponse }>}
   */
  UserSettingSet(params: { key: string; value: string; userId?: string }, callback?: (res: any) => void): Promise<{ data: UserSettingResponse }> {
    const cfg: any = { withCredentials: true }
    if (params.userId) {
      cfg.headers = { ...(cfg.headers || {}), 'X-User-Id': params.userId }
    }
    return put('/settings/user', params, callback, cfg) as unknown as Promise<{ data: UserSettingResponse }>
  },

  GroupSettingGet(params: { key: string; groupId: string }, callback?: (res: any) => void): Promise<{ data: { groupId: string; key: string; value?: string | null } }> {
    const gid = String(params.groupId || '').trim()
    return get('/settings/group', { key: params.key, groupId: gid }, callback, { withCredentials: true }) as unknown as Promise<{ data: { groupId: string; key: string; value?: string | null } }>
  },

  GroupSettingSet(params: { key: string; value: string; groupId: string }, callback?: (res: any) => void): Promise<{ data: { groupId: string; key: string; value?: string | null } }> {
    const gid = String(params.groupId || '').trim()
    return put('/settings/group', { ...params, groupId: gid }, callback, { withCredentials: true }) as unknown as Promise<{ data: { groupId: string; key: string; value?: string | null } }>
  },

  GroupSettingDelete(params: { key: string; groupId: string }, callback?: (res: any) => void): Promise<{ data: { groupId: string; key: string; deleted: boolean } }> {
    const gid = String(params.groupId || '').trim()
    return del('/settings/group', undefined, callback, { withCredentials: true, params: { key: params.key, groupId: gid } }) as unknown as Promise<{ data: { groupId: string; key: string; deleted: boolean } }>
  },

  UserSettingEmailGet(params: { key: string }, callback?: (res: any) => void): Promise<{ data: UserSettingResponse }> {
    const cfg: any = { withCredentials: true }
    return get('/settings/user/email', { key: params.key }, callback, cfg) as unknown as Promise<{ data: UserSettingResponse }>
  },

  UserSettingEmailSet(params: { key: string; value: string }, callback?: (res: any) => void): Promise<{ data: UserSettingResponse }> {
    const cfg: any = { withCredentials: true }
    return put('/settings/user/email', params, callback, cfg) as unknown as Promise<{ data: UserSettingResponse }>
  },

  PermMe(_params?: Record<string, unknown>, callback?: (res: any) => void): Promise<{ data: PermMeResponse }> {
    return get('/perm/me', undefined, callback) as unknown as Promise<{ data: PermMeResponse }>
  },

  DashboardLayoutUserGet(params: { userId: string }, callback?: (res: any) => void) {
    const uid = String(params?.userId || '').trim()
    return get('/dashboard/layout/user', { userId: uid }, callback, { withCredentials: true })
  },

  DashboardLayoutUserPut(params: { userId: string; layout: unknown }, callback?: (res: any) => void) {
    const uid = String(params?.userId || '').trim()
    return put('/dashboard/layout/user', params.layout, callback, { withCredentials: true, params: { userId: uid } })
  },

  DashboardLayoutUserDelete(params: { userId: string }, callback?: (res: any) => void) {
    const uid = String(params?.userId || '').trim()
    return del('/dashboard/layout/user', undefined, callback, { withCredentials: true, params: { userId: uid } })
  },

  DashboardLayoutGroupGet(params: { groupId: string }, callback?: (res: any) => void) {
    const gid = String(params?.groupId || '').trim()
    return get('/dashboard/layout/group', { groupId: gid }, callback, { withCredentials: true })
  },

  DashboardLayoutGroupPut(params: { groupId: string; layout: unknown }, callback?: (res: any) => void) {
    const gid = String(params?.groupId || '').trim()
    return put('/dashboard/layout/group', params.layout, callback, { withCredentials: true, params: { groupId: gid } })
  },

  /**
   * List available permission definitions
   * @author Lorin Luo
   * @param {Record<string, unknown>} [_params] - Unused
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<{ data: { items: PermCatalogItem[] } }>}
   */
  PermCatalog(_params?: Record<string, unknown>, callback?: (res: any) => void): Promise<{ data: { items: PermCatalogItem[] } }> {
    return get('/perm/catalog', undefined, callback) as unknown as Promise<{ data: { items: PermCatalogItem[] } }>
  },

  /**
   * List all groups and permission counts (admin only)
   * @author Lorin Luo
   * @param {Record<string, unknown>} [_params] - Unused
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<{ data: { items: Array<{ group_path: string; perm_count: number }> } }>}
   */
  PermGroups(_params?: Record<string, unknown>, callback?: (res: any) => void): Promise<{ data: { items: Array<{ group_path: string; perm_count: number }> } }> {
    return get('/perm/groups', undefined, callback) as unknown as Promise<{ data: { items: Array<{ group_path: string; perm_count: number }> } }>
  },

  /**
   * List group paths from Keycloak (admin only)
   * @author Lorin Luo
   * @param {Record<string, unknown>} [_params] - Unused
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<{ data: { items: string[] } }>}
   */
  PermKeycloakGroups(_params?: Record<string, unknown>, callback?: (res: any) => void): Promise<{ data: { items: string[] } }> {
    return get('/perm/kc/groups', undefined, callback) as unknown as Promise<{ data: { items: string[] } }>
  },

  PermProviderGroups(_params?: Record<string, unknown>, callback?: (res: any) => void): Promise<{ data: { items: string[] } }> {
    return get('/perm/provider/groups', undefined, callback) as unknown as Promise<{ data: { items: string[] } }>
  },

  PermKeycloakUsers(
    params?: { search?: string; first?: number; max?: number },
    callback?: (res: any) => void
  ): Promise<{ data: { items: PermKeycloakUserItem[] } }> {
    const q: Record<string, unknown> = {}
    if (params?.search) q.search = params.search
    if (typeof params?.first === 'number') q.first = params.first
    if (typeof params?.max === 'number') q.max = params.max
    return get('/perm/kc/users', q, callback) as unknown as Promise<{ data: { items: PermKeycloakUserItem[] } }>
  },

  PermUsers(
    params?: { search?: string; first?: number; max?: number },
    callback?: (res: any) => void
  ): Promise<{ data: { items: PermKeycloakUserItem[] } }> {
    const q: Record<string, unknown> = {}
    if (params?.search) q.search = params.search
    if (typeof params?.first === 'number') q.first = params.first
    if (typeof params?.max === 'number') q.max = params.max
    return get('/perm/users', q, callback) as unknown as Promise<{ data: { items: PermKeycloakUserItem[] } }>
  },

  /**
   * Create Keycloak user via permission admin (admin only)
   * @author Lorin Luo
   * @param {Object} params - Request parameters
   * @param {string} [params.username] - Username
   * @param {string} [params.email] - Email
   * @param {string} [params.firstName] - First name
   * @param {string} [params.lastName] - Last name
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<{ data: { success: boolean } }>}
   */
  PermCreateUser(
    params: { username?: string; email?: string; firstName?: string; lastName?: string },
    callback?: (res: any) => void,
  ): Promise<{ data: { success: boolean } }> {
    return post('/perm/user', params, callback) as unknown as Promise<{ data: { success: boolean } }>
  },

  PermGetKeycloakUserGroups(
    params: { userId: string },
    callback?: (res: any) => void
  ): Promise<{ data: { userId: string; groups: string[] } }> {
    return get('/perm/kc/user/groups', { userId: params.userId }, callback) as unknown as Promise<{ data: { userId: string; groups: string[] } }>
  },

  PermGetUserGroups(
    params: { userId: string },
    callback?: (res: any) => void
  ): Promise<{ data: { userId: string; groups: string[] } }> {
    return get('/perm/user/groups', { userId: params.userId }, callback) as unknown as Promise<{ data: { userId: string; groups: string[] } }>
  },

  PermSetKeycloakUserGroups(
    params: { userId: string; groups: string[] },
    callback?: (res: any) => void
  ): Promise<{ data: { userId: string; groups: string[] } }> {
    return put('/perm/kc/user/groups', params, callback) as unknown as Promise<{ data: { userId: string; groups: string[] } }>
  },

  PermSetUserGroups(
    params: { userId: string; groups: string[] },
    callback?: (res: any) => void
  ): Promise<{ data: { userId: string; groups: string[] } }> {
    return put('/perm/user/groups', params, callback) as unknown as Promise<{ data: { userId: string; groups: string[] } }>
  },

  /**
   * List ERPNext roles (admin only)
   * @author Lorin Luo
   * @param {Record<string, unknown>} [_params] - Unused
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<{ data: { items: string[] } }>}
   */
  PermErpnextRoles(_params?: Record<string, unknown>, callback?: (res: any) => void): Promise<{ data: { items: string[] } }> {
    return get('/perm/external/erpnext/roles', undefined, callback) as unknown as Promise<{ data: { items: string[] } }>
  },

  /**
   * List ERPNext DocTypes (admin only)
   * @author Lorin Luo
   * @param {Record<string, unknown>} [_params] - Unused
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<{ data: { items: string[] } }>}
   */
  PermErpnextDoctypes(_params?: Record<string, unknown>, callback?: (res: any) => void): Promise<{ data: { items: string[] } }> {
    return get('/perm/external/erpnext/doctypes', undefined, callback) as unknown as Promise<{ data: { items: string[] } }>
  },

  /**
   * Get ERPNext roles for one user (admin only)
   * @author Lorin Luo
   * @param {Object} params - Request parameters
   * @param {string} params.userId - User id (email)
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<{ data: { userId: string; roles: string[] } }>}
   */
  PermErpnextGetUserRoles(params: { userId: string }, callback?: (res: any) => void): Promise<{ data: { userId: string; roles: string[] } }> {
    return get('/perm/external/erpnext/user/roles', { userId: params.userId }, callback) as unknown as Promise<{ data: { userId: string; roles: string[] } }>
  },

  /**
   * Set ERPNext roles for one user (admin only)
   * @author Lorin Luo
   * @param {Object} params - Request parameters
   * @param {string} params.userId - User id (email)
   * @param {string[]} params.roles - Role names
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<{ data: { userId: string; roles: string[] } }>}
   */
  PermErpnextSetUserRoles(
    params: { userId: string; roles: string[] },
    callback?: (res: any) => void
  ): Promise<{ data: { userId: string; roles: string[] } }> {
    return put('/perm/external/erpnext/user/roles', params, callback) as unknown as Promise<{ data: { userId: string; roles: string[] } }>
  },

  /**
   * List ERPNext permission keys for one role (admin only)
   * @author Lorin Luo
   * @param {Object} params - Request parameters
   * @param {string} params.role - Role name
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<{ data: { role: string; items: string[] } }>}
   */
  PermErpnextRolePermKeys(params: { role: string }, callback?: (res: any) => void): Promise<{ data: { role: string; items: string[] } }> {
    return get('/perm/external/erpnext/role/perms', { role: params.role }, callback) as unknown as Promise<{ data: { role: string; items: string[] } }>
  },

  /**
   * Set ERPNext permission keys for one role (admin only)
   * @author Lorin Luo
   * @param {Object} params - Request parameters
   * @param {string} params.role - Role name
   * @param {string[]} params.items - Permission keys
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<{ data: { role: string; items: string[] } }>}
   */
  PermErpnextSetRolePermKeys(
    params: { role: string; items: string[] },
    callback?: (res: any) => void
  ): Promise<{ data: { role: string; items: string[] } }> {
    return put('/perm/external/erpnext/role/perms', params, callback) as unknown as Promise<{ data: { role: string; items: string[] } }>
  },

  /**
   * Update ERPNext role permission by doctype/ptype (admin only)
   * @author Lorin Luo
   * @param {Object} params - Request parameters
   * @param {string} params.role - Role name
   * @param {string} params.doctype - DocType name
   * @param {string} params.ptype - Permission type (read/write/create/delete/etc)
   * @param {number} params.value - 0/1
   * @param {number} [params.permlevel=0] - Permission level
   * @param {number} [params.if_owner=0] - If owner
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<{ data: { success: boolean; role: string; items: string[] } }>}
   */
  PermErpnextUpdateRolePerm(
    params: { role: string; doctype: string; ptype: string; value: number; permlevel?: number; if_owner?: number },
    callback?: (res: any) => void
  ): Promise<{ data: { success: boolean; role: string; items: string[] } }> {
    return put('/perm/external/erpnext/role/perm', params, callback) as unknown as Promise<{ data: { success: boolean; role: string; items: string[] } }>
  },

  /**
   * Get permissions of one group (admin only)
   * @author Lorin Luo
   * @param {Object} params - Request parameters
   * @param {string} params.group - Group path
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<{ data: { group: string; permissions: string[] } }>}
   */
  PermGetGroup(params: { group: string }, callback?: (res: any) => void): Promise<{ data: { group: string; permissions: string[] } }> {
    return get('/perm/group', { group: params.group }, callback) as unknown as Promise<{ data: { group: string; permissions: string[] } }>
  },

  /**
   * Update permissions of one group (admin only)
   * @author Lorin Luo
   * @param {Object} params - Request parameters
   * @param {string} params.group - Group path
   * @param {string[]} params.permissions - Permission keys
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<{ data: { group: string; permissions: string[] } }>}
   */
  PermSetGroup(params: { group: string; permissions: string[] }, callback?: (res: any) => void): Promise<{ data: { group: string; permissions: string[] } }> {
    return put('/perm/group', params, callback) as unknown as Promise<{ data: { group: string; permissions: string[] } }>
  },

  AuthSubject(): string {
    const payload = pickJwtPayload(getPortalAccessToken())
    return String(payload?.sub || '').trim()
  },

  AuthEmail(): string {
    const payload = pickJwtPayload(getPortalAccessToken())
    return String(payload?.email || '').trim()
  },

  /**
   * Initialize auth by attempting cookie-based silent refresh
   * @returns {Promise<boolean>} - True if authenticated
   */
  AuthInit(): Promise<boolean> {
    return initAuth()
  },

  /**
   * Handle auth code callback and update in-memory access token
   * @param {Object} params - Callback params
   * @param {string} params.code - Authorization code
   * @param {string} params.redirectUri - Redirect URI used for login
   * @param {string} [params.codeVerifier] - PKCE verifier (optional)
   * @returns {Promise<boolean>} - True if exchange succeeded
   */
  AuthHandleCallback(params: { code: string; redirectUri: string; codeVerifier?: string }): Promise<boolean> {
    return exchangeAuthCode(params.code, params.redirectUri, params.codeVerifier)
  },

  /**
   * Logout and clear in-memory access token
   * @param {Object} [params] - Logout params
   * @param {string} [params.postLogoutRedirectUri] - Post-logout redirect URI
   * @returns {Promise<string>} - Keycloak end-session URL (optional)
   */
  AuthLogoutFlow(params?: { postLogoutRedirectUri?: string }): Promise<string> {
    return logout(params?.postLogoutRedirectUri)
  },

  /**
   * Passthrough relay via BFF to backend-configured targets
   * @param {Object} params - Envelope { path, method, params?, headers?, body? }
   * @param {Function} [callback] - Optional callback
   * @returns {Promise<AxiosResponse>}
   */
  RelayPassthrough(
    params: { path: string; method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; params?: Record<string, unknown>; headers?: Record<string, string>; body?: unknown; authToken?: string; appId?: string },
    callback?: (res: any) => void
  ) {
    return post('/relay/passthrough', params, callback)
  },

  /**
   * Relay file upload (multipart/form-data)
   * @param {Object} params - Upload parameters
   * @param {string} params.path - Target path
   * @param {string} params.method - Method (POST/PUT)
   * @param {File|Blob} params.file - File to upload
   * @param {Record<string, any>} [params.params] - Query params
   * @param {Record<string, string>} [params.headers] - Custom headers
   * @param {string} [params.authToken] - Explicit auth token
   * @param {Function} [callback] - Optional callback
   */
  RelayUpload(
    params: {
      path: string;
      method: 'POST' | 'PUT';
      file: File | Blob;
      params?: Record<string, unknown>;
      headers?: Record<string, string>;
      authToken?: string;
      appId?: string;
    },
    callback?: (res: any) => void
  ) {
    const fd = new FormData()
    fd.append('path', params.path)
    fd.append('method', params.method)
    fd.append('file', params.file)
    if (params.params) fd.append('params', JSON.stringify(params.params))
    if (params.headers) fd.append('headers', JSON.stringify(params.headers))
    if (params.authToken) fd.append('authToken', params.authToken)
    if (params.appId) fd.append('appId', params.appId)
    return post('/relay/upload', fd, callback, { headers: { 'Content-Type': undefined } })
  },

  /**
   * Get access token for a specific app via Keycloak Token Exchange
   * @param {Object} params - Request parameters
   * @param {string} params.appId - Target app client_id
   * @param {string[]} [params.scopes] - Optional scopes
   * @returns {Promise<AxiosResponse>}
   */
  AppToken(params: { appId: string; scopes?: string[] }, callback?: (res: any) => void) {
    return post('/auth/app-token', params, callback, { withCredentials: true })
  },

  applyAccessToken,
}

export default API
