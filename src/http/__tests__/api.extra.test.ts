/**
 * @file src/http/__tests__/api.extra.test.ts
 * @author Lorin Luo
 * @description Extra tests for api axios validateStatus branches
 */
import { describe, it, expect, vi } from 'vitest'

describe('HTTP API validateStatus', () => {
  it('validateStatus handles 2xx and 304', async () => {
    vi.unmock('axios')
    vi.resetModules()
    const mod = await import('../api')
    const client = mod.api as any
    const fn = client.defaults?.validateStatus as (s: number) => boolean
    expect(typeof fn).toBe('function')
    expect(fn(200)).toBe(true)
    expect(fn(299)).toBe(true)
    expect(fn(304)).toBe(true)
    expect(fn(400)).toBe(false)
  }, 15000)
})
