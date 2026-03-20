import { describe, it, expect, vi, beforeEach } from 'vitest'
import { genId, getOrCreateVisitorId, getOrMigrateTextPref, sleep } from '../shared'
import { storage } from '../../storage/singleton'

// Mock storage singleton
vi.mock('../../storage/singleton', () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn(),
  }
}))

describe('HTTP Shared Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('genId should generate unique IDs with prefix', () => {
    const id1 = genId('test')
    const id2 = genId('test')
    expect(id1).toMatch(/^test_/)
    expect(id1).not.toBe(id2)
  })

  it('getOrCreateVisitorId should return existing ID from storage', () => {
    vi.mocked(storage.get).mockReturnValue('existing-id')
    expect(getOrCreateVisitorId()).toBe('existing-id')
    expect(storage.get).toHaveBeenCalled()
  })

  it('getOrCreateVisitorId should migrate from localStorage', () => {
    vi.mocked(storage.get).mockReturnValue(null)
    localStorage.setItem('portal_visitor_id', 'legacy-id')
    
    expect(getOrCreateVisitorId()).toBe('legacy-id')
    expect(storage.set).toHaveBeenCalledWith('portal_visitor_id', 'legacy-id', expect.any(Object))
    expect(localStorage.getItem('portal_visitor_id')).toBeNull()
  })

  it('getOrCreateVisitorId should create new ID if none exists', () => {
    vi.mocked(storage.get).mockReturnValue(null)
    
    const id = getOrCreateVisitorId()
    expect(id).toMatch(/^v_/)
    expect(storage.set).toHaveBeenCalledWith('portal_visitor_id', id, expect.any(Object))
  })
  
  it('sleep should wait', async () => {
    const start = Date.now()
    await sleep(50)
    const diff = Date.now() - start
    expect(diff).toBeGreaterThanOrEqual(40)
  })

  it('getOrMigrateTextPref should return value from storage', () => {
    vi.mocked(storage.get).mockReturnValue('val')
    expect(getOrMigrateTextPref('key', 'legacy', 'def')).toBe('val')
  })

  it('getOrMigrateTextPref should migrate from legacy', () => {
    vi.mocked(storage.get).mockReturnValue(null)
    localStorage.setItem('legacy', 'legacy-val')
    expect(getOrMigrateTextPref('key', 'legacy', 'def')).toBe('legacy-val')
    expect(storage.set).toHaveBeenCalled()
    expect(localStorage.getItem('legacy')).toBeNull()
  })

  it('getOrMigrateTextPref should return fallback', () => {
    vi.mocked(storage.get).mockReturnValue(null)
    expect(getOrMigrateTextPref('key', 'legacy', 'def')).toBe('def')
  })
})
