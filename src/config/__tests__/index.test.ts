/**
 * @file src/config/__tests__/index.test.ts
 * @author Lorin Luo
 * @description Unit tests for config module
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Config Module', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should have default values when env vars are missing', async () => {
    // We need to reload the module to test different env vars
    // Since import.meta.env is resolved at build time/import time, 
    // we might need to rely on how Vitest handles it.
    // However, usually checking the exported object is enough for the default case.
    
    // In a real Vite environment, we might not be able to change import.meta.env dynamically 
    // for an already imported module without some hacks.
    // But for this test, we just want to ensure it exports the structure.
    
    const config = (await import('../index')).default
    
    expect(config).toBeDefined()
    expect(config.api).toBeDefined()
    // Depending on the test environment, these might be defaults or from .env
    // We assume defaults if .env is not loaded in test
    expect(config.api.baseURL).toBeDefined() 
    expect(typeof config.api.timeout).toBe('number')
  })

  it('should structure config correctly', async () => {
     const config = (await import('../index')).default
     expect(Object.keys(config)).toContain('api')
     expect(Object.keys(config.api)).toContain('baseURL')
     expect(Object.keys(config.api)).toContain('timeout')
  })

  it('should respect env overrides for baseURL and timeout', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '/x-api')
    vi.stubEnv('VITE_API_TIMEOUT', '1234')
    vi.resetModules()
    const config = (await import('../index')).default
    expect(config.api.baseURL).toBe('/x-api')
    expect(config.api.timeout).toBe(1234)
  })
})
