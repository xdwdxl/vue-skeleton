import { describe, it, expect, vi, afterEach } from 'vitest'
import { StorageSync } from '../sync'

describe('StorageSync', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should use fallback if BroadcastChannel is missing', () => {
    const originalBC = (globalThis as any).BroadcastChannel
    delete (globalThis as any).BroadcastChannel
    
    const onMsg = vi.fn()
    const sync = new StorageSync('test-sync', onMsg)
    
    // Test publish fallback
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    sync.publish({ key: 'k', scope: 'local', op: 'set', source: 'local' })
    expect(setItem).toHaveBeenCalledWith('test-sync', expect.stringContaining('"key":"k"'))
    
    // Test storage event handling
    const event = new StorageEvent('storage', {
      key: 'test-sync',
      newValue: JSON.stringify({ key: 'k', scope: 'local', op: 'set', source: 'local', senderId: 'other' })
    })
    window.dispatchEvent(event)
    expect(onMsg).toHaveBeenCalled()
    
    // Restore
    ;(globalThis as any).BroadcastChannel = originalBC
  })

  it('should ignore own messages in fallback', () => {
    const originalBC = (globalThis as any).BroadcastChannel
    delete (globalThis as any).BroadcastChannel
    
    const onMsg = vi.fn()
    const sync = new StorageSync('test-sync', onMsg)
    const senderId = (sync as any).senderId
    
    const event = new StorageEvent('storage', {
      key: 'test-sync',
      newValue: JSON.stringify({ key: 'k', scope: 'local', op: 'set', source: 'local', senderId })
    })
    window.dispatchEvent(event)
    expect(onMsg).not.toHaveBeenCalled()
    
    ;(globalThis as any).BroadcastChannel = originalBC
  })
})
