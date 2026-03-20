import { describe, it, expect, vi, beforeEach } from 'vitest'
import { installInterceptors } from '../interceptors'
import { getToken, refreshAccessToken, setAuthHeader, clearToken } from '../auth'
import { safePublishAuth, getOrCreateVisitorId } from '../shared'
import bus from '../../bus'
import * as metrics from '../metrics'

// Mock dependencies
vi.mock('../auth', () => ({
  getToken: vi.fn(),
  refreshAccessToken: vi.fn(),
  setAuthHeader: vi.fn(),
  clearToken: vi.fn()
}))

vi.mock('../shared', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as any),
    safePublishAuth: vi.fn(),
    getOrCreateVisitorId: vi.fn().mockReturnValue('visitor-id'),
    getOrMigrateTextPref: vi.fn().mockReturnValue('pref-val'),
    sleep: vi.fn().mockResolvedValue(undefined)
  }
})

vi.mock('../../bus', () => ({
  default: {
    publish: vi.fn(),
    subscribe: vi.fn()
  }
}))

vi.mock('../metrics', () => ({
  normalizePath: vi.fn(),
  shouldRecord: vi.fn().mockReturnValue(true),
  durationFromConfig: vi.fn(),
  methodFromConfig: vi.fn(),
  cacheModeFromConfigStatus: vi.fn(),
  serverTimingFromError: vi.fn(),
  sizesFromUrl: vi.fn(),
  buildMetric: vi.fn().mockReturnValue({ status: 200 }),
  publishMetricAndAudit: vi.fn()
}))

describe('HTTP Interceptors', () => {
  let api: any
  let reqOnFulfilled: any
  let reqOnRejected: any
  let resOnFulfilled: any
  let resOnRejected: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock Axios Instance
    api = {
      interceptors: {
        request: { use: vi.fn((suc, fail) => { reqOnFulfilled = suc; reqOnRejected = fail }) },
        response: { use: vi.fn((suc, fail) => { resOnFulfilled = suc; resOnRejected = fail }) }
      },
      request: vi.fn()
    }
    
    installInterceptors(api)
  })

  describe('Request Interceptor', () => {
    it('should add headers', () => {
      vi.mocked(getToken).mockReturnValue('token')
      const config = { headers: {} }
      const res = reqOnFulfilled(config)
      
      expect(res.headers['X-Request-Id']).toBeDefined()
      expect(res.headers['Authorization']).toBe('Bearer token')
      expect(res.headers['X-Visitor-Id']).toBeUndefined()
      expect(res.headers['Accept-Language']).toBe('pref-val')
    })

    it('should add visitor id if no token', () => {
      vi.mocked(getToken).mockReturnValue('')
      const config = { headers: {} }
      const res = reqOnFulfilled(config)
      
      expect(res.headers['Authorization']).toBeUndefined()
      expect(res.headers['X-Visitor-Id']).toBe('visitor-id')
    })
  })

  describe('Response Interceptor (Success)', () => {
    it('should pass through response', () => {
      vi.mocked(metrics.normalizePath).mockReturnValue('/x')
      vi.spyOn(Math, 'random').mockReturnValue(0)
      const res = { config: { url: '/api/x', baseURL: '' }, status: 200, data: {} }
      const out = resOnFulfilled(res)
      expect(out).toBe(res)
    })

    it('should handle business error', () => {
      const res = { config: {}, status: 200, data: { success: false, code: 'ERR' } }
      resOnFulfilled(res)
      expect(bus.publish).toHaveBeenCalledWith('system.error', expect.objectContaining({ code: 'ERR' }))
    })
  })

  describe('Response Interceptor (Error)', () => {
    it('should retry 500 once', async () => {
      const err = { response: { status: 500 }, config: { _retry500: false } }
      api.request.mockResolvedValue('retried')
      
      const res = await resOnRejected(err)
      expect(res).toBe('retried')
      expect(api.request).toHaveBeenCalled()
      expect(err.config._retry500).toBe(true)
    })

    it('should not retry 500 twice', async () => {
      const err = { response: { status: 500 }, config: { _retry500: true } }
      await expect(resOnRejected(err)).rejects.toMatchObject(err)
      await expect(resOnRejected(err)).rejects.toBeInstanceOf(Error)
    })

    it('should retry 401 (refresh success)', async () => {
      const err = { response: { status: 401 }, config: { _retry401: false, headers: {} } }
      vi.mocked(refreshAccessToken).mockResolvedValue({ accessToken: 'new-token' })
      api.request.mockResolvedValue('retried')

      const res = await resOnRejected(err)
      
      expect(refreshAccessToken).toHaveBeenCalled()
      expect(setAuthHeader).toHaveBeenCalledWith(err.config, 'new-token')
      expect(api.request).toHaveBeenCalled()
      expect(safePublishAuth).toHaveBeenCalledWith(true, expect.stringContaining('refreshed'))
    })

    it('should fail 401 if refresh fails', async () => {
      const err = { response: { status: 401 }, config: { _retry401: false, headers: {} } }
      vi.mocked(refreshAccessToken).mockResolvedValue(null)

      await expect(resOnRejected(err)).rejects.toMatchObject(err)
      await expect(resOnRejected(err)).rejects.toBeInstanceOf(Error)
      expect(clearToken).toHaveBeenCalled()
      expect(safePublishAuth).toHaveBeenCalledWith(false, expect.stringContaining('failed'))
    })

    it('should queue multiple 401s', async () => {
      // Simulate concurrent 401s
      // The first one triggers refresh, others wait
      const err1 = { response: { status: 401 }, config: { url: '1', headers: {}, requester: api } }
      const err2 = { response: { status: 401 }, config: { url: '2', headers: {}, requester: api } }
      
      let resolveRefresh: any
      vi.mocked(refreshAccessToken).mockReturnValue(new Promise(r => resolveRefresh = r))
      api.request.mockResolvedValue('success')
      
      const p1 = resOnRejected(err1)
      const p2 = resOnRejected(err2)
      
      // Resolve refresh
      resolveRefresh({ accessToken: 'new-token' })
      
      await Promise.all([p1, p2])
      
      expect(refreshAccessToken).toHaveBeenCalledTimes(1)
      expect(api.request).toHaveBeenCalledTimes(2)
    })
  })
})
