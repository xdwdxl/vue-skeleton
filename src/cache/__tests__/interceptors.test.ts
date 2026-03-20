import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { setupCacheInterceptor } from '../interceptors'

describe('Cache Interceptors', () => {
  let api: AxiosInstance
  let requestHandler: (cfg: InternalAxiosRequestConfig) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>
  let responseHandler: (res: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>

  beforeEach(() => {
    // Reset interceptor handlers
    requestHandler = (cfg) => cfg
    responseHandler = (res) => res

    api = {
      interceptors: {
        request: {
          use: vi.fn((handler) => {
            requestHandler = handler
          }),
        },
        response: {
          use: vi.fn((handler) => {
            responseHandler = handler
          }),
        },
      },
      defaults: {
        baseURL: 'http://api.test',
      },
    } as unknown as AxiosInstance
  })

  it('should register interceptors', () => {
    setupCacheInterceptor(api)
    expect(api.interceptors.request.use).toHaveBeenCalled()
    expect(api.interceptors.response.use).toHaveBeenCalled()
  })

  describe('Request Interceptor', () => {
    it('should add If-None-Match if cached etag exists for GET request', async () => {
      setupCacheInterceptor(api)
      
      // Simulate response first to cache etag
      const resConfig = {
        url: '/test',
        baseURL: 'http://api.test',
        method: 'get',
        headers: { 'Accept-Language': 'en' },
      }
      const response = {
        config: resConfig,
        status: 200,
        headers: { etag: '"12345"' },
        data: { foo: 'bar' },
      } as unknown as AxiosResponse
      await responseHandler(response)

      // Now request
      const reqConfig = {
        url: '/test',
        baseURL: 'http://api.test',
        method: 'get',
        headers: { 'Accept-Language': 'en' },
      } as unknown as InternalAxiosRequestConfig

      const result = await requestHandler(reqConfig)
      expect(result.headers['If-None-Match']).toBe('"12345"')
      expect(result.headers['Cache-Control']).toBe('no-cache')
    })

    it('should NOT add If-None-Match for non-GET request', async () => {
      setupCacheInterceptor(api)
      
      const reqConfig = {
        url: '/test',
        method: 'post',
        headers: {},
      } as unknown as InternalAxiosRequestConfig

      const result = await requestHandler(reqConfig)
      expect(result.headers?.['If-None-Match']).toBeUndefined()
    })

    it('should handle missing headers in request config', async () => {
      setupCacheInterceptor(api)
      const reqConfig = {
        url: '/test',
        method: 'get',
        // headers undefined
      } as unknown as InternalAxiosRequestConfig

      const result = await requestHandler(reqConfig)
      expect(result.headers).toBeDefined()
    })
  })

  describe('Response Interceptor', () => {
    it('should cache etag and data on 200 response', async () => {
      setupCacheInterceptor(api)
      
      const response = {
        config: {
          url: '/data',
          method: 'get',
          headers: { 'X-Currency': 'USD' },
        },
        status: 200,
        headers: { etag: '"abcdef"' },
        data: { id: 1 },
      } as unknown as AxiosResponse

      const res = await responseHandler(response)
      expect(res).toBe(response)
      
      // Verify it was cached by making a request
      const reqConfig = {
        url: '/data',
        method: 'get',
        headers: { 'X-Currency': 'USD' },
      } as unknown as InternalAxiosRequestConfig
      const result = await requestHandler(reqConfig)
      expect(result.headers['If-None-Match']).toBe('"abcdef"')
    })

    it('should return cached data on 304 response', async () => {
      setupCacheInterceptor(api)
      
      // 1. Cache it
      const config = { url: '/static', method: 'get', headers: {} }
      await responseHandler({
        config,
        status: 200,
        headers: { etag: '"v1"' },
        data: { version: 1 },
      } as unknown as AxiosResponse)

      // 2. Receive 304
      const response304 = {
        config,
        status: 304,
        headers: {},
        data: null, // axios might return null data on 304
      } as unknown as AxiosResponse

      const res = await responseHandler(response304)
      expect(res.data).toEqual({ version: 1 })
    })

    it('should handle 304 with no cached data (edge case)', async () => {
      setupCacheInterceptor(api)
      
      const response304 = {
        config: { url: '/unknown', method: 'get' },
        status: 304,
        data: null,
      } as unknown as AxiosResponse

      const res = await responseHandler(response304)
      expect(res.data).toBeNull()
    })
    
    it('should handle response without config', async () => {
        setupCacheInterceptor(api)
        // Edge case where config might be missing or malformed (though unlikely in axios)
        // The code accesses res.config as unknown as InternalAxiosRequestConfig
        // If we pass minimal structure it should not crash
        const response = {
            config: {},
            status: 200,
            headers: {}
        } as unknown as AxiosResponse
        
        await expect(async () => {
             await responseHandler(response)
        }).not.toThrow()
    })
  })

  describe('buildKey', () => {
    // buildKey is not exported, but we test it implicitly via interceptors
    // We can test edge cases of buildKey by passing specific configs
    
    it('should differentiate keys by headers', async () => {
        setupCacheInterceptor(api)
        
        // Cache with lang=en
        await responseHandler({
            config: { url: '/i18n', headers: { 'Accept-Language': 'en' } },
            status: 200,
            headers: { etag: '"en-v1"' },
            data: 'English'
        } as unknown as AxiosResponse)
        
        // Request with lang=fr
        const reqConfig = {
            url: '/i18n',
            headers: { 'Accept-Language': 'fr' }
        } as unknown as InternalAxiosRequestConfig
        
        const result = await requestHandler(reqConfig)
        expect(result.headers['If-None-Match']).toBeUndefined()
    })
    
    it('should handle baseURL correctly', async () => {
         setupCacheInterceptor(api)
         
         // Cache with baseURL
         await responseHandler({
             config: { baseURL: 'http://a.com', url: '/res', headers: {} },
             status: 200,
             headers: { etag: '"a"' },
             data: 'A'
         } as unknown as AxiosResponse)
         
         // Request without baseURL (should be different key)
         const reqConfig = {
             url: '/res', // implied relative to nothing or different base
             headers: {}
         } as unknown as InternalAxiosRequestConfig
         
         const result = await requestHandler(reqConfig)
         expect(result.headers['If-None-Match']).toBeUndefined()
    })

    it('should handle missing url', async () => {
      setupCacheInterceptor(api)

      // 1. baseURL present, url missing
      const config1 = { baseURL: 'http://api.com', headers: {} }
      // This creates a key based on baseURL only.
      // We can verify this by checking if it caches and retrieves.

      await responseHandler({
        config: config1,
        status: 200,
        headers: { etag: '"base"' },
        data: 'BASE',
      } as unknown as AxiosResponse)

      const req1 = await requestHandler(config1 as unknown as InternalAxiosRequestConfig)
      expect(req1.headers['If-None-Match']).toBe('"base"')

      // 2. baseURL missing, url missing
      const config2 = { headers: {} }
      // This creates a key with empty base.

      await responseHandler({
        config: config2,
        status: 200,
        headers: { etag: '"empty"' },
        data: 'EMPTY',
      } as unknown as AxiosResponse)

      const req2 = await requestHandler(config2 as unknown as InternalAxiosRequestConfig)
      expect(req2.headers['If-None-Match']).toBe('"empty"')
    })
  })
})
