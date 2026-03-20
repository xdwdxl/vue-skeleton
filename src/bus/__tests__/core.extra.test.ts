/**
 * @file src/bus/__tests__/core.extra.test.ts
 * @author Lorin Luo
 * @description Additional tests for CoreBus covering allow/deny and wildcard
 */
import { describe, it, expect } from 'vitest'
import { CoreBus } from '../core'

describe('CoreBus extras', () => {
  it('respects allowTopics for non-reply topics', () => {
    const bus = new CoreBus()
    bus.registerApp('portal', undefined, { allowTopics: ['allowed.*'] })
    let delivered = 0
    bus.subscribe('allowed.test', () => { delivered++ })
    bus.subscribe('blocked.test', () => { delivered++ })
    bus.publish('allowed.test', { x: 1 })
    bus.publish('blocked.test', { x: 1 })
    expect(delivered).toBe(1)
  })

  it('respects denyTopics', () => {
    const bus = new CoreBus()
    bus.registerApp('portal', undefined, { denyTopics: ['deny.*'] })
    let delivered = 0
    bus.subscribe('deny.me', () => { delivered++ })
    bus.subscribe('ok.me', () => { delivered++ })
    bus.publish('deny.me', {})
    bus.publish('ok.me', {})
    expect(delivered).toBe(1)
  })

  it('matches wildcard subscriptions', () => {
    const bus = new CoreBus()
    let received = 0
    bus.subscribe('user.*', () => { received++ })
    bus.publish('user.created', {})
    bus.publish('user.updated', {})
    bus.publish('order.created', {})
    expect(received).toBe(2)
  })
})
