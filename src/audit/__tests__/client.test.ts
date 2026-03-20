/**
 * @file src/audit/__tests__/client.test.ts
 * @author Lorin Luo
 * @description Unit tests for AuditClient
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AuditClient } from '../client'
import { API } from '../../api'
import { storage } from '../../storage/singleton'
import bus from '../../bus'

// Mocks
vi.mock('../../api', () => ({
  API: {
    PostAuditEvents: vi.fn(),
  },
}))

vi.mock('../../storage/singleton', () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn(),
  },
}))

vi.mock('../../bus', () => ({
  default: {
    subscribe: vi.fn(),
    publish: vi.fn(),
    reply: vi.fn(),
  },
}))

describe('AuditClient', () => {
  let client: AuditClient

  beforeEach(() => {
    vi.resetAllMocks()
    vi.useFakeTimers()
    client = new AuditClient({
      flushIntervalMs: 1000,
      maxQueueSize: 5,
      batchSize: 2,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Initialization', () => {
    it('should restore queue from storage on init', () => {
      const storedEvents = [{ event_id: '1', action_code: 'test' }]
      vi.mocked(storage.get).mockReturnValue(storedEvents)

      client.init()

      expect(storage.get).toHaveBeenCalled()
      expect(client.getStatus().pending).toBe(1)
    })

    it('should bind bus events', () => {
      client.init()
      expect(bus.subscribe).toHaveBeenCalledWith('audit.event', expect.any(Function))
      expect(bus.reply).toHaveBeenCalledWith('audit.status', expect.any(Function))
      expect(bus.reply).toHaveBeenCalledWith('audit.flush', expect.any(Function))
    })

    it('should start flush timer', () => {
      const spy = vi.spyOn(window, 'setInterval')
      client.init()
      expect(spy).toHaveBeenCalledWith(expect.any(Function), 1000)
    })
  })

  describe('Logging', () => {
    it('should add event to queue', () => {
      client.log({ action_code: 'login' })
      expect(client.getStatus().pending).toBe(1)
    })

    it('should respect max queue size', () => {
      // Max size is 5
      for (let i = 0; i < 6; i++) {
        client.log({ action_code: `action_${i}` })
      }
      expect(client.getStatus().pending).toBe(5)
      // Should have dropped the first one (action_0), so queue has action_1 to action_5
    })

    it('should persist queue after logging', () => {
      client.log({ action_code: 'login' })
      expect(storage.set).toHaveBeenCalled()
    })

    it('should publish status change', () => {
      client.log({ action_code: 'login' })
      expect(bus.publish).toHaveBeenCalledWith('audit.status.changed', expect.any(Object))
    })
  })

  describe('Flushing', () => {
    it('should flush events in batches', async () => {
      // Add 3 events, batch size is 2
      client.log({ action_code: '1' })
      client.log({ action_code: '2' })
      client.log({ action_code: '3' })

      vi.mocked(API.PostAuditEvents).mockResolvedValue({ status: 200, statusText: 'OK', headers: {}, config: {} as any, data: {} } as unknown as import('axios').AxiosResponse)

      const success = await client.flush()

      expect(success).toBe(true)
      expect(API.PostAuditEvents).toHaveBeenCalledTimes(2) // 2 calls: batch of 2, then batch of 1
      expect(client.getStatus().pending).toBe(0)
    })

    it('should stop flushing on error', async () => {
      client.log({ action_code: '1' })
      client.log({ action_code: '2' })

      vi.mocked(API.PostAuditEvents).mockResolvedValue({ status: 500, statusText: 'ERR', headers: {}, config: {} as any, data: {} } as unknown as import('axios').AxiosResponse)

      const success = await client.flush()

      expect(success).toBe(false)
      expect(client.getStatus().pending).toBe(2) // Should keep events
    })

    it('should handle API exception', async () => {
      client.log({ action_code: '1' })
      vi.mocked(API.PostAuditEvents).mockRejectedValue(new Error('Network error'))

      const success = await client.flush()

      expect(success).toBe(false)
      expect(client.getStatus().pending).toBe(1)
    })
  })

  describe('Bus Integration', () => {
    it('should handle audit.event via bus', () => {
      client.init()
      const subscribeCall = vi.mocked(bus.subscribe).mock.calls.find(call => call[0] === 'audit.event')
      const handler = subscribeCall![1]

      handler({ id: 'evt-1', topic: 'audit.event', ts: Date.now(), version: '1', payload: { action_code: 'bus_event' } } as any)
      expect(client.getStatus().pending).toBe(1)
    })
  })
})
