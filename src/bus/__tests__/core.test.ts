import { describe, it, expect, vi } from 'vitest'
import { CoreBus } from '../core'

describe('CoreBus', () => {
  it('should publish and subscribe', () => {
    const bus = new CoreBus()
    const handler = vi.fn()
    bus.subscribe('test.topic', handler)
    bus.publish('test.topic', { data: 123 })
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      topic: 'test.topic',
      payload: { data: 123 }
    }))
  })

  it('should handle unsubscribe', () => {
    const bus = new CoreBus()
    const handler = vi.fn()
    const off = bus.subscribe('test.topic', handler)
    off()
    bus.publish('test.topic', {})
    expect(handler).not.toHaveBeenCalled()
  })

  it('should handle wildcard subscription', () => {
    const bus = new CoreBus()
    const handler = vi.fn()
    bus.subscribe('test.*', handler)
    bus.publish('test.sub', {})
    expect(handler).toHaveBeenCalled()
  })

  it('should support once subscription', () => {
    const bus = new CoreBus()
    const handler = vi.fn()
    bus.once('test.once', handler)
    bus.publish('test.once', 1)
    bus.publish('test.once', 2)
    expect(handler).toHaveBeenCalledTimes(1)
  })
  
  it('should request and reply', async () => {
    const bus = new CoreBus()
    bus.reply('math.double', (n: number) => n * 2)
    const res = await bus.request('math.double', 21)
    expect(res).toBe(42)
  })
  
  it('should handle request timeout', async () => {
    const bus = new CoreBus()
    await expect(bus.request('no.handler', {}, { timeout: 10 })).rejects.toThrow('timeout')
  })

  it('should filter messages', () => {
    const bus = new CoreBus()
    const handler = vi.fn()
    bus.subscribe('test.filter', handler, { filter: (m) => (m.payload as number) > 10 })
    bus.publish('test.filter', 5)
    bus.publish('test.filter', 15)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ payload: 15 }))
  })
})
