import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PortalStorageManager } from '../manager'

// Mock the API module
vi.mock('../../api', () => ({
  API: {
    GetConfig: vi.fn().mockResolvedValue({ data: {} })
  }
}))

describe('PortalStorageManager', () => {
  let storage: PortalStorageManager

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    storage = new PortalStorageManager()
    storage.init()
  })

  it('should set and get values (memory default)', () => {
    storage.set('foo', 'bar')
    expect(storage.get('foo')).toBe('bar')
    // Default policy is memory, so localStorage should be empty for this key
    expect(localStorage.getItem('cids:global:default:foo')).toBeNull()
  })

  it('should set and get values with user scope (local)', () => {
    storage.set('foo', 'bar', { scope: 'user' })
    expect(storage.get('foo', { scope: 'user' })).toBe('bar')
    
    // Check implementation detail (local storage key)
    // Key format: cids:user:default:foo
    const raw = localStorage.getItem('cids:user:default:foo')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed.v).toBe('bar')
  })

  it('should handle namespace in keys', () => {
    storage.set('my.pref', 123, { scope: 'user' })
    expect(storage.get('my.pref', { scope: 'user' })).toBe(123)
    
    // Key: cids:user:my:pref
    const raw = localStorage.getItem('cids:user:my:pref')
    expect(raw).not.toBeNull()
  })

  it('should remove values', () => {
    storage.set('del', 'val', { scope: 'user' })
    expect(storage.get('del', { scope: 'user' })).toBe('val')
    storage.remove('del', 'user')
    expect(storage.get('del', { scope: 'user' })).toBeNull()
    expect(localStorage.getItem('cids:user:default:del')).toBeNull()
  })

  it('should clear values by scope', () => {
    storage.set('a', 1, { scope: 'user' })
    storage.set('b', 2, { scope: 'user' })
    storage.set('c', 3) // global/memory
    
    storage.clear('user')
    
    expect(storage.get('a', { scope: 'user' })).toBeNull()
    expect(storage.get('b', { scope: 'user' })).toBeNull()
    expect(storage.get('c')).toBe(3) // Should not be cleared
  })

  it('should support custom scope (memory)', () => {
    const customScope = 'my-custom-scope'
    storage.set('custom', 'value', { scope: customScope })
    expect(storage.get('custom', { scope: customScope })).toBe('value')
    // Custom scope should use memory driver by default
    expect(localStorage.getItem(`cids:${customScope}:default:custom`)).toBeNull()
  })
})
