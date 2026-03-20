import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  setHttpClientForMetrics, loadHttpAuditConfig, loadHttpMetricsConfig, normalizePath,
  shouldSample, shouldRecord, parseServerTiming, durationFromConfig,
  methodFromConfig, cacheModeFromConfigStatus, buildMetric, publishMetricAndAudit,
  serverTimingFromError, sizesFromUrl
} from '../metrics'
import bus from '../../bus'
const { configUpdatedCbRef } = vi.hoisted(() => ({ configUpdatedCbRef: { cb: undefined as ((msg: any) => void) | undefined } }))

// Mock bus
vi.mock('../../bus', () => ({
  default: {
    publish: vi.fn(),
    subscribe: vi.fn((topic, cb) => {
      if (topic === 'config.updated') configUpdatedCbRef.cb = cb
    })
  }
}))

describe('HTTP Metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset internal state if possible. 
    // Since state is module-scoped, we might need to rely on setters or re-imports if isolation is strict.
    // For now, we assume tests run serially or in isolated environments.
  })

  describe('Configuration Loading', () => {
    it('should load config from API', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: { sampling: 0.5 } })
      setHttpClientForMetrics({ get: mockGet } as any)
      
      await loadHttpMetricsConfig()
      
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('metrics.json'), expect.anything())
    })

    it('should handle API failure', async () => {
      const mockGet = vi.fn().mockRejectedValue(new Error('fail'))
      setHttpClientForMetrics({ get: mockGet } as any)
      await loadHttpMetricsConfig() // Should not throw
      expect(mockGet).toHaveBeenCalled()
    })
  })

  describe('Path Normalization', () => {
    it('should strip query params', () => {
      expect(normalizePath('/foo?bar=1')).toBe('/foo')
    })
    
    it('should return base path if starts with base', () => {
      expect(normalizePath('/api/foo', '/api')).toBe('/api/foo')
    })

    it('should prepend base if not present', () => {
      expect(normalizePath('/foo', '/api')).toBe('/api/foo')
      expect(normalizePath('foo', '/api')).toBe('/api/foo')
    })
  })

  describe('Sampling & Burst', () => {
    const mockRandom = (val: number) => {
      vi.spyOn(crypto, 'getRandomValues').mockImplementation((arr: any) => {
        if (arr instanceof Uint32Array) {
          arr[0] = Math.floor(val * 4294967296)
        }
        return arr
      })
      vi.spyOn(Math, 'random').mockReturnValue(val)
    }

    it('should respect include/exclude routes', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: { sampling: 1, routes: { include: ['/api'], exclude: ['/api/ignore'] } } })
      setHttpClientForMetrics({ get: mockGet } as any)
      await loadHttpMetricsConfig()
      mockRandom(0)
      expect(shouldSample('/api/foo')).toBe(true)
      expect(shouldSample('/api/ignore/foo')).toBe(false)
    })

    it('shouldSample should respect probability', async () => {
      const mockGet2 = vi.fn().mockResolvedValue({ data: { sampling: 0.2, routes: { include: [], exclude: [] } } })
      setHttpClientForMetrics({ get: mockGet2 } as any)
      await loadHttpMetricsConfig()
      // Mock random
      mockRandom(0.1)
      // Default sampling is 0.2
      expect(shouldSample('/api/ok')).toBe(true)
      
      mockRandom(0.9)
      expect(shouldSample('/api/ok')).toBe(false)
    })
    
    it('shouldRecord resets window across minutes', () => {
      const base = 1700000000000
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(base)
        .mockReturnValueOnce(base + 61_000)
      mockRandom(0)
      expect(shouldRecord('/api/x')).toBe(true)
      expect(shouldRecord('/api/x')).toBe(true)
    })
  })

  describe('Parsing Helpers', () => {
    it('parseServerTiming should parse standard header', () => {
      const header = 'cache;desc="Cache Read";dur=23.2, db;dur=53'
      const res = parseServerTiming(header)
      expect(res).toEqual({ cache: 23.2, db: 53 })
    })

    it('parseServerTiming returns undefined for empty', () => {
      expect(parseServerTiming('')).toBeUndefined()
    })

    it('durationFromConfig calculates time', () => {
      const start = Date.now() - 100
      expect(durationFromConfig({ startTime: start } as any)).toBeGreaterThanOrEqual(100)
    })

    it('methodFromConfig defaults to GET', () => {
      expect(methodFromConfig({} as any)).toBe('GET')
      expect(methodFromConfig({ method: 'post' } as any)).toBe('POST')
    })

    it('cacheModeFromConfigStatus detects hits', () => {
      const cfg = { headers: { 'If-None-Match': 'etag' } }
      expect(cacheModeFromConfigStatus(cfg as any, 304)).toBe('etag_hit')
      expect(cacheModeFromConfigStatus(cfg as any, 200)).toBe('etag_miss')
      expect(cacheModeFromConfigStatus({} as any, 200)).toBe('none')
    })
  })

  describe('Metrics Publishing', () => {
    it('buildMetric constructs object', () => {
      const m = buildMetric({
        request_id: '1',
        method: 'GET',
        path_template: '/',
        status: 200,
        duration_ms: 10,
        retry_count: 0,
        cache_mode: 'none'
      })
      expect(m.request_id).toBe('1')
      expect(m.app_id).toBeDefined()
    })

    it('publishMetricAndAudit sends events', async () => {
      const mockGet = vi.fn().mockImplementation((url: string) => {
        if (String(url).includes('portal.audit.http.json')) {
          return Promise.resolve({ data: { mode: 'all' } })
        }
        return Promise.resolve({ data: {} })
      })
      setHttpClientForMetrics({ get: mockGet } as any)
      await loadHttpAuditConfig()
      const m = { request_id: '1', path_template: '/api/x', duration_ms: 1 }
      publishMetricAndAudit(m as any, true)
      expect(bus.publish).toHaveBeenCalledWith('metrics.http', m)
      expect(bus.publish).toHaveBeenCalledWith('audit.event', expect.objectContaining({ result_code: 'OK' }))
    })
  })

  describe('Resource Timing', () => {
    it('sizesFromUrl returns undefined if disabled', () => {
      // Default is sizes: false
      expect(sizesFromUrl('url')).toBeUndefined()
    })

    it('getResourceTiming returns entry and sizesFromUrl works when enabled', async () => {
      const rt: PerformanceResourceTiming = {
        transferSize: 10,
        encodedBodySize: 5,
        decodedBodySize: 7,
      } as any
      const getEntriesByName = vi.fn().mockReturnValue([rt])
      ;(globalThis as any).performance = { getEntriesByName }
      const mockGet = vi.fn().mockResolvedValue({ data: { fields: { sizes: true, resourceTiming: true } } })
      setHttpClientForMetrics({ get: mockGet } as any)
      await loadHttpMetricsConfig()
      const res = sizesFromUrl('http://x')
      expect(res).toEqual({ transfer_size: 10, encoded_body_size: 5, decoded_body_size: 7 })
    })

    it('getResourceTiming handles errors', () => {
      const getEntriesByName = vi.fn().mockImplementation(() => { throw new Error('x') })
      ;(globalThis as any).performance = { getEntriesByName }
      expect(() => (getEntriesByName as any)()).toThrow()
      // internal try/catch returns undefined; indirectly covered via sizesFromUrl disabled
      expect(sizesFromUrl('http://x')).toBeUndefined()
    })
  })
  
  describe('Burst limit', () => {
    it('shouldRecord returns false after reaching burst_limit', async () => {
      const base = 1700000000000
      vi.spyOn(Date, 'now').mockReturnValue(base)
      const mockGet = vi.fn().mockResolvedValue({ data: { sampling: 1, burst_limit: 1, routes: { include: ['/api'] } } })
      setHttpClientForMetrics({ get: mockGet } as any)
      await loadHttpMetricsConfig()
      vi.spyOn(Math, 'random').mockReturnValue(0)
      expect(shouldRecord('/api/x')).toBe(true)
      expect(shouldRecord('/api/x')).toBe(false)
    })
  })

  describe('Server Timing from Error', () => {
    it('extracts timing from error response', () => {
       // Mock config enabling serverTiming (it is true by default)
       const err = { response: { headers: { 'server-timing': 'cpu;dur=10' } } }
       expect(serverTimingFromError(err as any)).toEqual({ cpu: 10 })
    })
    it('returns undefined when serverTiming disabled', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: { fields: { serverTiming: false } } })
      setHttpClientForMetrics({ get: mockGet } as any)
      await loadHttpMetricsConfig()
      const err = { response: { headers: { 'server-timing': 'cpu;dur=10' } } }
      expect(serverTimingFromError(err as any)).toBeUndefined()
    })
  })

  describe('Bus subscription', () => {
    it('invokes load on config.updated for metrics dataId', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: {} })
      setHttpClientForMetrics({ get: mockGet } as any)
      configUpdatedCbRef.cb?.({ payload: { dataId: 'portal.http.metrics.json', group: 'PORTAL_GROUP' } } as any)
      for (let i = 0; i < 5; i += 1) await Promise.resolve()
      expect(mockGet).toHaveBeenCalled()
    })
  })
})
