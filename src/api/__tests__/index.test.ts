/**
 * @file src/api/__tests__/index.test.ts
 * @author Lorin Luo
 * @description Unit tests for API definition module
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { API } from '../index'
import * as HttpApi from '../../http/api'
import * as HttpAuth from '../../http/auth'

// Mock the http/api module
vi.mock('../../http/api', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  exchangeAuthCode: vi.fn(),
  initAuth: vi.fn(),
  logout: vi.fn(),
  applyAccessToken: vi.fn()
}))
vi.mock('../../http/auth', () => ({
  getToken: vi.fn()
}))

const TOKEN_WITH_SUB = 'x.eyJzdWIiOiJ1c2VyLTEifQ.y'
const TOKEN_WITHOUT_SUB = 'x.eyJlbWFpbCI6ImFAYi5jb20ifQ.y'

describe('API Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Config API', () => {
    it('GetConfig should call get with correct params', () => {
      const params = { dataId: 'test.json', group: 'TEST_GROUP' }
      API.GetConfig(params)
      expect(HttpApi.get).toHaveBeenCalledWith('/config/test.json', { group: 'TEST_GROUP' }, undefined)
    })

    it('ConfigPublish should call post with correct params', () => {
      const params = { 
        dataId: 'test.json', 
        group: 'TEST_GROUP', 
        content: '{}', 
        etag: '123' 
      }
      API.ConfigPublish(params)
      expect(HttpApi.post).toHaveBeenCalledWith('/config/publish', params, undefined)
    })
  })

  describe('Audit API', () => {
    it('PostAuditEvents should call post with correct params and options', () => {
      const params = { events: [{}], reason: 'test' }
      API.PostAuditEvents(params)
      expect(HttpApi.post).toHaveBeenCalledWith(
        '/audit/events', 
        { events: params.events, reason: 'test' }, 
        undefined, 
        { silent: true }
      )
    })

    it('PostAuditEvents should use custom endpoint', () => {
      const params = { events: [{}], endpoint: '/custom/audit' }
      API.PostAuditEvents(params)
      expect(HttpApi.post).toHaveBeenCalledWith(
        '/custom/audit', 
        { events: params.events, reason: undefined }, 
        undefined, 
        { silent: true }
      )
    })

    it('GetAuditStatus should call get', () => {
      API.GetAuditStatus()
      expect(HttpApi.get).toHaveBeenCalledWith('/audit/status', undefined, undefined)
    })

    it('GetAuditEvents should call get with params', () => {
      const params = { page: 1 }
      API.GetAuditEvents(params)
      expect(HttpApi.get).toHaveBeenCalledWith('/audit/events', params, undefined)
    })

    it('PostAuditExport should call post with silent option', () => {
      const params = { format: 'csv' }
      API.PostAuditExport(params)
      expect(HttpApi.post).toHaveBeenCalledWith('/audit/export', params, undefined, { silent: true })
    })
  })

  describe('I18n API', () => {
    it('I18nList should call get with params', () => {
      const params = { locale: 'en-US', app: 'portal' }
      API.I18nList(params)
      expect(HttpApi.get).toHaveBeenCalledWith('/admin/i18n/list', params, undefined)
    })

    it('I18nExport should call get with params', () => {
      const params = { locale: 'en-US', app: 'portal' }
      API.I18nExport(params)
      expect(HttpApi.get).toHaveBeenCalledWith('/admin/i18n/export', params, undefined)
    })
  })

  describe('Auth API', () => {
    it('AuthLoginUrl builds url from config', async () => {
      vi.doMock('../../config', () => ({ default: { api: { baseURL: '/api' } } }))
      const { API: ReAPI } = await import('../index')
      const url = ReAPI.AuthLoginUrl({ redirectUri: 'http://x/cb', state: 's' })
      expect(url).toContain('/api/auth/login?')
      expect(url).toContain('redirect_uri=http%3A%2F%2Fx%2Fcb')
      expect(url).toContain('state=s')
    })

    it('AuthToken calls post and applyAccessToken', () => {
      const cb = vi.fn()
      API.AuthToken({ code: 'c', redirectUri: 'u' }, cb)
      expect(HttpApi.post).toHaveBeenCalledWith('/auth/token', { code: 'c', redirectUri: 'u' }, expect.any(Function), { withCredentials: true })
      const [, , fn] = vi.mocked(HttpApi.post).mock.calls[vi.mocked(HttpApi.post).mock.calls.length - 1]
      if (fn) fn({})
      expect(HttpApi.applyAccessToken).toHaveBeenCalled()
      expect(cb).toHaveBeenCalled()
    })

    it('AuthRefresh calls post and applyAccessToken', () => {
      const cb = vi.fn()
      API.AuthRefresh(undefined, cb)
      expect(HttpApi.post).toHaveBeenCalledWith('/auth/refresh', undefined, expect.any(Function), { withCredentials: true })
      const [, , fn] = vi.mocked(HttpApi.post).mock.calls[vi.mocked(HttpApi.post).mock.calls.length - 1]
      if (fn) fn({})
      expect(HttpApi.applyAccessToken).toHaveBeenCalled()
      expect(cb).toHaveBeenCalled()
    })

    it('AuthLogout calls post with credentials', () => {
      API.AuthLogout({ postLogoutRedirectUri: 'http://x' })
      expect(HttpApi.post).toHaveBeenCalledWith('/auth/logout', { postLogoutRedirectUri: 'http://x' }, undefined, { withCredentials: true })
    })

    it('AuthMe calls get with credentials', () => {
      API.AuthMe()
      expect(HttpApi.get).toHaveBeenCalledWith('/auth/me', undefined, undefined, { withCredentials: true })
    })

    it('PermMe calls get', () => {
      API.PermMe()
      expect(HttpApi.get).toHaveBeenCalledWith('/perm/me', undefined, undefined)
    })

    it('AuthSubject reads sub from token payload', () => {
      vi.mocked(HttpAuth.getToken).mockReturnValue(TOKEN_WITH_SUB)
      expect(API.AuthSubject()).toBe('user-1')
    })

    it('AuthSubject returns empty string when sub missing', () => {
      vi.mocked(HttpAuth.getToken).mockReturnValue(TOKEN_WITHOUT_SUB)
      expect(API.AuthSubject()).toBe('')
    })
  })

  describe('Perm API', () => {
    it('PermCatalog calls get', () => {
      API.PermCatalog()
      expect(HttpApi.get).toHaveBeenCalledWith('/perm/catalog', undefined, undefined)
    })

    it('PermGroups calls get', () => {
      API.PermGroups()
      expect(HttpApi.get).toHaveBeenCalledWith('/perm/groups', undefined, undefined)
    })

    it('PermKeycloakGroups calls get', () => {
      API.PermKeycloakGroups()
      expect(HttpApi.get).toHaveBeenCalledWith('/perm/kc/groups', undefined, undefined)
    })

    it('PermGetGroup calls get with group param', () => {
      API.PermGetGroup({ group: '/admin' })
      expect(HttpApi.get).toHaveBeenCalledWith('/perm/group', { group: '/admin' }, undefined)
    })

    it('PermSetGroup calls put', () => {
      API.PermSetGroup({ group: '/admin', permissions: ['*'] })
      expect(HttpApi.put).toHaveBeenCalledWith('/perm/group', { group: '/admin', permissions: ['*'] }, undefined)
    })
  })

    it('AuthInit proxies to initAuth', async () => {
      (HttpApi.initAuth as any).mockResolvedValue(true)
      const ok = await API.AuthInit()
      expect(ok).toBe(true)
      expect(HttpApi.initAuth).toHaveBeenCalled()
    })

    it('AuthHandleCallback proxies to exchangeAuthCode', async () => {
      (HttpApi.exchangeAuthCode as any).mockResolvedValue(true)
      const ok = await API.AuthHandleCallback({ code: 'c', redirectUri: 'u' })
      expect(ok).toBe(true)
      expect(HttpApi.exchangeAuthCode).toHaveBeenCalledWith('c', 'u', undefined)
    })

    it('AuthLogoutFlow proxies to logout', async () => {
      (HttpApi.logout as any).mockResolvedValue('ok')
      const res = await API.AuthLogoutFlow({ postLogoutRedirectUri: 'x' })
      expect(res).toBe('ok')
      expect(HttpApi.logout).toHaveBeenCalledWith('x')
    })

  describe('Relay & Fetch', () => {
    it('RelayPassthrough calls post', () => {
      API.RelayPassthrough({ path: '/x', method: 'POST' })
      expect(HttpApi.post).toHaveBeenCalledWith('/relay/passthrough', { path: '/x', method: 'POST' }, undefined)
    })

    it('RelayUpload builds FormData and posts', () => {
      const file = new Blob(['a'])
      API.RelayUpload({ path: '/x', method: 'POST', file, params: { a: 1 }, headers: { h: 'v' }, appId: 'youtrack' })
      expect(HttpApi.post).toHaveBeenCalledWith('/relay/upload', expect.any(FormData), undefined, { headers: { 'Content-Type': undefined } })
    })

    it('FetchJson returns data when ok', async () => {
      const json = vi.fn().mockResolvedValue({ a: 1 })
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json }))
      const res = await API.FetchJson('http://x')
      expect(res).toEqual({ a: 1 })
    })

    it('FetchJson returns undefined on error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: vi.fn() }))
      const res = await API.FetchJson('http://x')
      expect(res).toBeUndefined()
    })
  })

  describe('Notifications', () => {
    it('NotifyInbox calls get with params', () => {
      API.NotifyInbox({ cursor: '1', limit: 10 })
      expect(HttpApi.get).toHaveBeenCalledWith('/notify/inbox', { cursor: '1', limit: 10 }, undefined)
    })

    it('NotifyRead calls post with ids', () => {
      API.NotifyRead({ ids: ['a', 'b'] })
      expect(HttpApi.post).toHaveBeenCalledWith('/notify/read', { ids: ['a', 'b'] }, undefined)
    })

    it('NotifyReadAll calls post empty body', () => {
      API.NotifyReadAll()
      expect(HttpApi.post).toHaveBeenCalledWith('/notify/read-all', {}, undefined)
    })

    it('NotifyBroadcast calls get with locale', () => {
      API.NotifyBroadcast({ locale: 'en-US' })
      expect(HttpApi.get).toHaveBeenCalledWith('/notify/broadcast', { locale: 'en-US' }, undefined)
    })
  })

  describe('I18n Import/Publish', () => {
    it('I18nImport calls post', () => {
      const params = { locale: 'en-US', app: 'portal', etag: 'e', items: { a: 1 } }
      API.I18nImport(params)
      expect(HttpApi.post).toHaveBeenCalledWith('/admin/i18n/import', params, undefined)
    })

    it('I18nPublish calls post', () => {
      const params = { locale: 'en-US', app: 'portal', etag: 'e', items: { a: 1 } }
      API.I18nPublish(params)
      expect(HttpApi.post).toHaveBeenCalledWith('/admin/i18n/publish', params, undefined)
    })
  })


})
