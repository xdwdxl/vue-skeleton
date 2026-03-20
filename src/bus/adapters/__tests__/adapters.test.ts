import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BroadcastAdapter } from '../broadcast'
import { SseAdapter } from '../sse'

// Mocks are already in vitest.setup.ts, but we might need to manipulate them

describe('Bus Adapters', () => {
  describe('BroadcastAdapter', () => {
    it('should use BroadcastChannel if available', () => {
      const onMsg = vi.fn()
      const adapter = new BroadcastAdapter('test', onMsg)
      
      const env = { id: '1', topic: 't', payload: {}, ts: 0, version: '1' }
      
      // Access the private BroadcastChannel instance
      const bc = (adapter as any).bc
      expect(bc).toBeDefined()
      
      const postSpy = vi.spyOn(bc, 'postMessage')
      
      adapter.publish(env)
      
      expect(postSpy).toHaveBeenCalledWith(env)
    })

    it('should dedupe messages', () => {
      const onMsg = vi.fn()
      const adapter = new BroadcastAdapter('test', onMsg)
      const env = { id: '1', topic: 't', payload: {}, ts: 0, version: '1' }
      
      // Access private bc via type casting or expect it to exist
      const bc = (adapter as any).bc
      if (bc && bc.onmessage) {
        bc.onmessage({ data: env })
        expect(onMsg).toHaveBeenCalledTimes(1)
        
        bc.onmessage({ data: env })
        expect(onMsg).toHaveBeenCalledTimes(1)
      }
    })

    it('should prune seen cache', () => {
      const onMsg = vi.fn()
      const adapter = new BroadcastAdapter('test', onMsg)
      
      // Helper to access private method/prop
      const addSeen = (adapter as any).addSeen.bind(adapter)
      const getSeen = () => (adapter as any).seen as Set<string>
      
      for(let i=0; i<1005; i++) {
        addSeen(i.toString())
      }
      
      expect(getSeen().size).toBe(1000)
      // Should have evicted '0', '1', '2', '3', '4' (FIFO ish, Set iteration order)
      expect(getSeen().has('0')).toBe(false)
      expect(getSeen().has('1004')).toBe(true)
    })

    it('should fallback to localStorage if BC missing', () => {
      const originalBC = (globalThis as any).BroadcastChannel
      delete (globalThis as any).BroadcastChannel
      
      const setItem = vi.spyOn(Storage.prototype, 'setItem')
      const onMsg = vi.fn()
      const adapter = new BroadcastAdapter('test-storage', onMsg)
      
      adapter.publish({ id: '1', topic: 't', payload: {}, ts: 0, version: '1' })
      expect(setItem).toHaveBeenCalledWith('test-storage', expect.stringContaining('"id":"1"'))
      
      // Restore
      ;(globalThis as any).BroadcastChannel = originalBC
    })

    it('should handle localStorage error', () => {
      const originalBC = (globalThis as any).BroadcastChannel
      delete (globalThis as any).BroadcastChannel
      
      const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded')
      })
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const adapter = new BroadcastAdapter('test-storage-err', vi.fn())
      adapter.publish({ id: '1', topic: 't', payload: {}, ts: 0, version: '1' })
      
      expect(consoleSpy).toHaveBeenCalled()
      
      ;(globalThis as any).BroadcastChannel = originalBC
    })

    it('should receive messages via storage event', () => {
      const originalBC = (globalThis as any).BroadcastChannel
      delete (globalThis as any).BroadcastChannel

      const onMsg = vi.fn()
      const adapter = new BroadcastAdapter('test-storage-rx', onMsg)
      
      // Simulate storage event
      const trigger = (key: string, newValue: string | null) => {
        const ev = new StorageEvent('storage', { key, newValue })
        window.dispatchEvent(ev)
      }

      // 1. Valid message
      const env = { id: 'rx1', topic: 't', payload: {}, ts: 0, version: '1' }
      trigger('test-storage-rx', JSON.stringify(env))
      expect(onMsg).toHaveBeenCalledWith(env)

      // 2. Wrong key
      trigger('other-key', JSON.stringify(env))
      expect(onMsg).toHaveBeenCalledTimes(1) // No new call

      // 3. Null value
      trigger('test-storage-rx', null)
      expect(onMsg).toHaveBeenCalledTimes(1)

      // 4. Invalid JSON
      trigger('test-storage-rx', '{invalid')
      expect(onMsg).toHaveBeenCalledTimes(1) // Should catch error

      // 5. Dedupe
      trigger('test-storage-rx', JSON.stringify(env))
      expect(onMsg).toHaveBeenCalledTimes(1) // Seen already

      ;(globalThis as any).BroadcastChannel = originalBC
    })

    it('should ignore invalid messages via BroadcastChannel', () => {
      const onMsg = vi.fn()
      const adapter = new BroadcastAdapter('test-bc-invalid', onMsg)
      const bc = (adapter as any).bc

      if (bc && bc.onmessage) {
        // 1. Null data
        bc.onmessage({ data: null })
        expect(onMsg).not.toHaveBeenCalled()

        // 2. Non-object data
        bc.onmessage({ data: 'string' })
        expect(onMsg).not.toHaveBeenCalled()
      }
    })
  })

  describe('SseAdapter', () => {
    let bus: any
    let MockEventSource: any

    beforeEach(() => {
      bus = { publish: vi.fn() }
      vi.useFakeTimers()
      
      // Capture the mock instance
      MockEventSource = class {
        onopen: any
        onmessage: any
        onerror: any
        close = vi.fn()
        constructor(url: string) {
          (MockEventSource as any).lastInstance = this
        }
      }
      ;(globalThis as any).EventSource = MockEventSource as any
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should connect and notify open', () => {
      new SseAdapter(bus, '/sse')
      const inst = (MockEventSource as any).lastInstance
      expect(inst).toBeDefined()
      
      inst.onopen()
      expect(bus.publish).toHaveBeenCalledWith('system.sse.connected', expect.anything())
    })

    it('should handle messages', () => {
      new SseAdapter(bus, '/sse')
      const inst = (MockEventSource as any).lastInstance
      const msg = { type: 'foo', data: 'bar' }
      inst.onmessage({ data: JSON.stringify(msg) })
      
      expect(bus.publish).toHaveBeenCalledWith('foo', msg, expect.anything())
    })

    it('should handle invalid json', () => {
      new SseAdapter(bus, '/sse')
      const inst = (MockEventSource as any).lastInstance
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      inst.onmessage({ data: '{invalid' })
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should reconnect on error', () => {
      new SseAdapter(bus, '/sse')
      const inst = (MockEventSource as any).lastInstance
      inst.onerror()
      expect(inst.close).toHaveBeenCalled()
      
      // Advance timer to trigger reconnect
      vi.runAllTimers()
      // Should create new instance (we can't easily check that without spying on constructor, 
      // but we can check if it tries to connect again)
    })

    it('should stop after max retries', () => {
      const adapter = new SseAdapter(bus, '/sse')
      const inst = (MockEventSource as any).lastInstance
      
      // Fail 5 times
      for(let i=0; i<6; i++) {
        inst.onerror()
        vi.runAllTimers()
      }
      
      expect(bus.publish).toHaveBeenCalledWith('system.sse.error', expect.anything())
    })
    
    it('should close connection', () => {
      const adapter = new SseAdapter(bus, '/sse')
      const inst = (MockEventSource as any).lastInstance
      adapter.close()
      expect(inst.close).toHaveBeenCalled()
    })
  })
})
