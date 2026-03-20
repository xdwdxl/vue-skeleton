import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  getToken, setToken, clearToken, applyAccessToken, 
  initAuth, exchangeAuthCode, logout, setAuthHeader,
  clearLegacyTokens, refreshAccessToken
} from '../auth'
import { safePublishAuth, AUTH_REASON } from '../shared'
import axios from 'axios'

// Mock shared
vi.mock('../shared', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as any),
    safePublishAuth: vi.fn(),
    genId: () => 'mock-id'
  }
})

const { mockPost } = vi.hoisted(() => ({
  mockPost: vi.fn()
}))

// Mock axios for refreshClient
vi.mock('axios', () => {
  return {
    default: {
      create: () => ({
        post: mockPost
      })
    }
  }
})

describe('HTTP Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearToken()
    localStorage.clear()
  })

  it('should manage token memory', () => {
    expect(getToken()).toBe('')
    setToken('t1')
    expect(getToken()).toBe('t1')
    clearToken()
    expect(getToken()).toBe('')
  })

  it('should clear legacy tokens', () => {
    localStorage.setItem('portal_access_token', 'old')
    clearLegacyTokens()
    expect(localStorage.getItem('portal_access_token')).toBeNull()
  })

  describe('applyAccessToken', () => {
    it('should extract and set token from valid payload', () => {
      const res = { data: { access_token: 'at', refresh_token: 'rt' } }
      const ok = applyAccessToken(res)
      expect(ok).toBe(true)
      expect(getToken()).toBe('at')
      expect(safePublishAuth).toHaveBeenCalledWith(true, AUTH_REASON.login)
    })

    it('should fail with invalid payload', () => {
      const ok = applyAccessToken({})
      expect(ok).toBe(false)
      expect(getToken()).toBe('')
    })
  })

  describe('refreshAccessToken', () => {
    it('should return token pair on success', async () => {
      mockPost.mockResolvedValueOnce({ data: { access_token: 'new-at', refresh_token: 'new-rt' } })
      const pair = await refreshAccessToken('req-1')
      expect(pair).toEqual({ accessToken: 'new-at', refreshToken: 'new-rt' })
    })

    it('should return null on failure', async () => {
      mockPost.mockRejectedValueOnce(new Error('fail'))
      const pair = await refreshAccessToken('req-1')
      expect(pair).toBeNull()
    })
  })

  describe('initAuth', () => {
    it('should succeed when refresh succeeds', async () => {
      mockPost.mockResolvedValueOnce({ data: { access_token: 'at' } })
      const ok = await initAuth()
      expect(ok).toBe(true)
      expect(getToken()).toBe('at')
      expect(safePublishAuth).toHaveBeenCalledWith(true, AUTH_REASON.init_refreshed)
    })

    it('should fail when refresh fails', async () => {
      mockPost.mockRejectedValueOnce(new Error('fail'))
      const ok = await initAuth()
      expect(ok).toBe(false)
      expect(getToken()).toBe('')
      expect(safePublishAuth).toHaveBeenCalledWith(false, 'init_no_session')
    })
  })

  describe('exchangeAuthCode', () => {
    it('should exchange code for token', async () => {
      mockPost.mockResolvedValueOnce({ data: { access_token: 'at' } })
      const ok = await exchangeAuthCode('code', 'uri')
      expect(ok).toBe(true)
      expect(getToken()).toBe('at')
      expect(safePublishAuth).toHaveBeenCalledWith(true, AUTH_REASON.login)
    })

    it('should fail on error', async () => {
      mockPost.mockRejectedValueOnce(new Error('fail'))
      const ok = await exchangeAuthCode('code', 'uri')
      expect(ok).toBe(false)
    })
  })

  describe('logout', () => {
    it('should call logout endpoint and clear token', async () => {
      mockPost.mockResolvedValueOnce({ data: { logout_url: 'http://bye' } })
      setToken('t1')
      const url = await logout('uri')
      expect(url).toBe('http://bye')
      expect(getToken()).toBe('')
      expect(safePublishAuth).toHaveBeenCalledWith(false, 'logout')
    })

    it('should clear token even if logout fails', async () => {
      mockPost.mockRejectedValueOnce(new Error('fail'))
      setToken('t1')
      await logout()
      expect(getToken()).toBe('')
      expect(safePublishAuth).toHaveBeenCalledWith(false, 'logout_failed')
    })
  })

  describe('setAuthHeader', () => {
    it('should add Authorization header', () => {
      const config = { headers: {} } as any
      setAuthHeader(config, 'token')
      expect(config.headers.Authorization).toBe('Bearer token')
    })

    it('should preserve existing headers', () => {
      const config = { headers: { 'X-Other': '1' } } as any
      setAuthHeader(config, 'token')
      expect(config.headers.Authorization).toBe('Bearer token')
      expect(config.headers['X-Other']).toBe('1')
    })
  })
})
