/**
 * @file src/http/__tests__/shared.extra.test.ts
 * @author Lorin Luo
 * @description Extra branch tests for shared utilities
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('HTTP Shared extra branches', () => {
  beforeEach(() => {
    vi.unmock('../bus')
  })

  it('genId falls back when randomUUID throws', async () => {
    const hasRandom = !!(globalThis as any).crypto?.randomUUID
    if (hasRandom) {
      vi.spyOn((globalThis as any).crypto as Crypto, 'randomUUID').mockImplementation(() => { throw new Error('no uuid') })
    }
    vi.resetModules()
    const { genId } = await import('../shared')
    const id = genId('x')
    expect(id).toMatch(/^x_/)
  })

  it('safePublishAuth should not throw when bus.publish throws', async () => {
    vi.mock('../bus', () => ({ default: { publish: vi.fn(() => { throw new Error('pub fail') }) } }))
    vi.resetModules()
    const { safePublishAuth } = await import('../shared')
    expect(() => safePublishAuth(true, 'login')).not.toThrow()
  })
})
