import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  isRequestSuccess, isBffSuccess, getBffData, getBffErrorCode, getResultData, toResult,
  getR, postR, putR, patchR, delR, get, post, put, patch, del
} from '../api'

// Hoist mock setup
const { mockAxios } = vi.hoisted(() => {
  const m = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
  return { mockAxios: m }
})

vi.mock('axios', () => ({
  default: {
    create: () => mockAxios,
    isAxiosError: (e: any) => !!e?.isAxiosError
  }
}))

vi.mock('../interceptors', () => ({ installInterceptors: vi.fn() }))
vi.mock('../cache/interceptors', () => ({ setupCacheInterceptor: vi.fn() }))
vi.mock('../metrics', () => ({ 
  setHttpClientForMetrics: vi.fn(), 
  loadHttpMetricsConfig: vi.fn(),
  loadHttpAuditConfig: vi.fn(),
}))

describe('HTTP API Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Validation Helpers', () => {
    it('isRequestSuccess checks status code', () => {
      expect(isRequestSuccess({ status: 200 })).toBe(true)
      expect(isRequestSuccess({ status: 299 })).toBe(true)
      expect(isRequestSuccess({ status: 304 })).toBe(false) // 304 is technically redirect/cache, but validateStatus allows it. Wait, helper says < 300.
      expect(isRequestSuccess({ status: 400 })).toBe(false)
      expect(isRequestSuccess({ isAxiosError: true })).toBe(false)
      expect(isRequestSuccess({ status: '200' } as any)).toBe(false)
    })
    
    it('isRequestSuccess handles undefined input', () => {
      expect(isRequestSuccess(undefined)).toBe(false)
    })

    it('isBffSuccess checks envelope', () => {
      expect(isBffSuccess({ status: 200, data: { success: true } })).toBe(true)
      expect(isBffSuccess({ status: 200, data: { success: false } })).toBe(false)
      expect(isBffSuccess({ status: 200, data: { foo: 'bar' } })).toBe(true) // Not a BFF envelope, treated as success
      expect(isBffSuccess({ status: 500 })).toBe(false)
      expect(isBffSuccess({ status: 200, data: undefined })).toBe(true)
      expect(isBffSuccess({ status: 200, data: 'text' })).toBe(true)
    })
  })

  describe('Data Extraction', () => {
    it('getResultData returns data for success', () => {
      const res = { status: 200, data: { a: 1 } }
      expect(getResultData(res as any)).toEqual({ a: 1 })
    })

    it('getResultData returns undefined for error', () => {
      const err = { isAxiosError: true, status: 500 }
      expect(getResultData(err as any)).toBeUndefined()
    })

    it('getBffData returns data from envelope', () => {
      const res = { status: 200, data: { success: true, data: 'foo' } }
      expect(getBffData(res)).toBe('foo')
    })

    it('getBffData returns raw data if not envelope', () => {
      const res = { status: 200, data: { foo: 'bar' } }
      expect(getBffData(res)).toEqual({ foo: 'bar' })
    })

    it('getBffErrorCode extracts code', () => {
      const res = { status: 200, data: { success: false, code: 'ERR' } }
      expect(getBffErrorCode(res)).toBe('ERR')
    })

    it('getBffData returns undefined for non-success', () => {
      const res = { status: 200, data: { success: false, data: 'x' } }
      expect(getBffData(res)).toBeUndefined()
    })

    it('getBffData returns env when success type missing', () => {
      const res = { status: 200, data: { data: 'x' } }
      expect(getBffData(res)).toEqual({ data: 'x' })
    })

    it('getBffData returns undefined on request error', () => {
      const res = { isAxiosError: true, status: 500 }
      expect(getBffData(res as any)).toBeUndefined()
    })

    it('getBffErrorCode returns undefined on non-request success', () => {
      const res = { isAxiosError: true, status: 500 }
      expect(getBffErrorCode(res as any)).toBeUndefined()
    })
  })

  describe('toResult', () => {
    it('converts success response', () => {
      const res = { status: 200, data: { success: true, data: 'foo' }, config: { headers: { 'X-Request-Id': '1' } } }
      const r = toResult(res)
      expect(r).toEqual({
        ok: true,
        status: 200,
        data: 'foo',
        code: undefined,
        requestId: '1',
        traceId: undefined
      })
    })

    it('converts error response', () => {
      const err = { response: { status: 400 }, message: 'bad', config: { headers: { 'X-Request-Id': '1' } } }
      const r = toResult(err)
      expect(r).toEqual({
        ok: false,
        status: 400,
        error: 'bad',
        requestId: '1'
      })
    })

    it('error response without message and headers', () => {
      const err = { response: { status: 404 } }
      const r = toResult(err as any)
      expect(r.ok).toBe(false)
      expect(r.status).toBe(404)
      expect(r.error).toBe('request failed')
      expect(r.requestId).toBe('')
    })

    it('converts success response with code when bff failed', () => {
      const res = { status: 200, data: { success: false, code: 'FAIL' }, config: { headers: {} } }
      const r = toResult(res as any)
      expect(r.ok).toBe(false)
      expect(r.code).toBe('FAIL')
    })

    it('converts success response when not a BFF envelope', () => {
      const res = { status: 200, data: 'plain', config: { headers: { 'X-Request-Id': '2' } } }
      const r = toResult(res as any)
      expect(r.ok).toBe(true)
      expect(r.status).toBe(200)
      expect(r.data).toBe('plain')
      expect(r.code).toBeUndefined()
      expect(r.requestId).toBe('2')
      expect(r.traceId).toBeUndefined()
    })

    it('converts success response when success flag missing', () => {
      const res = { status: 200, data: { payload: 1 }, config: { headers: {} } }
      const r = toResult(res as any)
      expect(r.ok).toBe(true)
      expect(r.data).toEqual({ payload: 1 })
      expect(r.code).toBeUndefined()
    })

    it('handles error without response object', () => {
      const err = { message: 'boom', config: { headers: {} } }
      const r = toResult(err as any)
      expect(r.ok).toBe(false)
      expect(r.status).toBe(0)
      expect(r.error).toBe('boom')
      expect(r.requestId).toBe('')
    })
  })

  describe('Unified Request Wrappers', () => {
    it('getR handles success', async () => {
      mockAxios.get.mockResolvedValue({ status: 200, data: { success: true, data: 'ok' } })
      const r = await getR('/test')
      expect(r.ok).toBe(true)
      expect(r.data).toBe('ok')
    })

    it('getR handles failure', async () => {
      mockAxios.get.mockRejectedValue({ response: { status: 500 }, message: 'fail' })
      const r = await getR('/test')
      expect(r.ok).toBe(false)
      expect(r.status).toBe(500)
    })

    it('postR handles success', async () => {
      mockAxios.post.mockResolvedValue({ status: 200, data: { success: true } })
      const r = await postR('/test', {})
      expect(r.ok).toBe(true)
    })

    it('putR handles success', async () => {
      mockAxios.put.mockResolvedValue({ status: 200, data: { success: true } })
      const r = await putR('/test', {})
      expect(r.ok).toBe(true)
    })

    it('patchR handles success', async () => {
      mockAxios.patch.mockResolvedValue({ status: 200, data: { success: true } })
      const r = await patchR('/test', {})
      expect(r.ok).toBe(true)
    })

    it('delR handles success', async () => {
      mockAxios.delete.mockResolvedValue({ status: 200, data: { success: true } })
      const r = await delR('/test')
      expect(r.ok).toBe(true)
    })

    it('postR handles failure', async () => {
      mockAxios.post.mockRejectedValue({ response: { status: 503 }, message: 'unavailable', config: { headers: { 'X-Request-Id': 'x' } } })
      const r = await postR('/fail', {})
      expect(r.ok).toBe(false)
      expect(r.status).toBe(503)
      expect(r.requestId).toBe('x')
    })

    it('putR handles failure', async () => {
      mockAxios.put.mockRejectedValue({ response: { status: 422 }, message: 'unprocessable' })
      const r = await putR('/fail', {})
      expect(r.ok).toBe(false)
      expect(r.status).toBe(422)
    })

    it('patchR handles failure', async () => {
      mockAxios.patch.mockRejectedValue({ response: { status: 422 }, message: 'unprocessable' })
      const r = await patchR('/fail', {})
      expect(r.ok).toBe(false)
      expect(r.status).toBe(422)
    })

    it('delR handles failure', async () => {
      mockAxios.delete.mockRejectedValue({ response: { status: 401 }, message: 'unauthorized' })
      const r = await delR('/fail')
      expect(r.ok).toBe(false)
      expect(r.status).toBe(401)
    })
  })

  describe('Callback Wrappers', () => {
    it('get executes callback', async () => {
      mockAxios.get.mockResolvedValue('ok')
      const cb = vi.fn()
      await get('/test', {}, cb)
      expect(cb).toHaveBeenCalledWith('ok')
    })

    it('post executes callback on error', async () => {
      mockAxios.post.mockRejectedValue('fail')
      const cb = vi.fn()
      await post('/test', {}, cb).catch(() => {})
      expect(cb).toHaveBeenCalledWith('fail')
    })

    it('put executes callback', async () => {
      mockAxios.put.mockResolvedValue('ok')
      const cb = vi.fn()
      await put('/test', {}, cb)
      expect(cb).toHaveBeenCalledWith('ok')
    })
    
    it('patch executes callback', async () => {
      mockAxios.patch.mockResolvedValue('ok')
      const cb = vi.fn()
      await patch('/test', {}, cb)
      expect(cb).toHaveBeenCalledWith('ok')
    })

    it('del executes callback', async () => {
      mockAxios.delete.mockResolvedValue('ok')
      const cb = vi.fn()
      await del('/test', {}, cb)
      expect(cb).toHaveBeenCalledWith('ok')
    })
    
    it('get executes callback on error', async () => {
      mockAxios.get.mockRejectedValue('fail')
      const cb = vi.fn()
      await get('/test', {}, cb).catch(() => {})
      expect(cb).toHaveBeenCalledWith('fail')
    })

    it('patch executes callback on error', async () => {
      mockAxios.patch.mockRejectedValue('fail')
      const cb = vi.fn()
      await patch('/test', {}, cb).catch(() => {})
      expect(cb).toHaveBeenCalledWith('fail')
    })

    it('del executes callback on error', async () => {
      mockAxios.delete.mockRejectedValue('fail')
      const cb = vi.fn()
      await del('/test', {}, cb).catch(() => {})
      expect(cb).toHaveBeenCalledWith('fail')
    })
    
    it('get resolves without callback provided', async () => {
      mockAxios.get.mockResolvedValue('ok')
      const p = get('/test')
      await expect(p).resolves.toBe('ok' as any)
    })
    
    it('post resolves without callback provided', async () => {
      mockAxios.post.mockResolvedValue('ok')
      const p = post('/test')
      await expect(p).resolves.toBe('ok' as any)
    })

    it('put resolves without callback provided', async () => {
      mockAxios.put.mockResolvedValue('ok')
      const p = put('/test')
      await expect(p).resolves.toBe('ok' as any)
    })
    
    it('patch resolves without callback provided', async () => {
      mockAxios.patch.mockResolvedValue('ok')
      const p = patch('/test')
      await expect(p).resolves.toBe('ok' as any)
    })
    
    it('del resolves without callback provided', async () => {
      mockAxios.delete.mockResolvedValue('ok')
      const p = del('/test')
      await expect(p).resolves.toBe('ok' as any)
    })
  })

  describe('toResult traceId and default code', () => {
    it('extracts traceId when present', () => {
      const res = { status: 200, data: { success: false, code: undefined, trace_id: 't1' }, config: { headers: { 'X-Request-Id': 'r1' } } }
      const r = toResult(res as any)
      expect(r.ok).toBe(false)
      expect(r.code).toBe('BIZ_ERROR')
      expect(r.traceId).toBe('t1')
    })
    
    it('getBffErrorCode returns undefined when success', () => {
      const res = { status: 200, data: { success: true, code: 'X' } }
      expect(getBffErrorCode(res as any)).toBeUndefined()
    })

    it('getBffData returns raw data when non-object', () => {
      const res = { status: 200, data: 'str' }
      expect(getBffData(res as any)).toBe('str')
    })
    
    it('getBffErrorCode returns undefined for non-object envelope', () => {
      const res = { status: 200, data: 'str' }
      expect(getBffErrorCode(res as any)).toBeUndefined()
    })
  })
  
  describe('Callback Wrappers without callback on error', () => {
    it('get rejects without callback provided', async () => {
      mockAxios.get.mockRejectedValue('fail')
      await expect(get('/test')).rejects.toBe('fail' as any)
    })
    it('post rejects without callback provided', async () => {
      mockAxios.post.mockRejectedValue('fail')
      await expect(post('/test')).rejects.toBe('fail' as any)
    })
    it('put rejects without callback provided', async () => {
      mockAxios.put.mockRejectedValue('fail')
      await expect(put('/test')).rejects.toBe('fail' as any)
    })
    it('patch rejects without callback provided', async () => {
      mockAxios.patch.mockRejectedValue('fail')
      await expect(patch('/test')).rejects.toBe('fail' as any)
    })
    it('del rejects without callback provided', async () => {
      mockAxios.delete.mockRejectedValue('fail')
      await expect(del('/test')).rejects.toBe('fail' as any)
    })
  })
})
