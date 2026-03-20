/**
 * @file src/storage/drivers/__tests__/local.test.ts
 * @author Lorin Luo
 * @description Tests for LocalDriver covering TTL, parse errors, and prefix clear
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LocalDriver } from '../../drivers/local'

describe('LocalDriver', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns null on parse error', () => {
    localStorage.setItem('k', '{bad json')
    const d = new LocalDriver()
    expect(d.get('k')).toBeNull()
  })

  it('handles ttl expiration and removes item', () => {
    const d = new LocalDriver()
    d.set('k', 'v', 10)
    expect(d.get('k')).toBe('v')
    vi.advanceTimersByTime(20)
    expect(d.get('k')).toBeNull()
  })

  it('remove deletes key', () => {
    const d = new LocalDriver()
    d.set('a', 1)
    d.remove('a')
    expect(d.get('a')).toBeNull()
  })

  it('clear without prefix clears all', () => {
    const d = new LocalDriver()
    d.set('a', 1)
    d.set('b', 2)
    d.clear()
    expect(localStorage.length).toBe(0)
  })

  it('clear with prefix clears only matching keys', () => {
    const d = new LocalDriver()
    d.set('p:1', 1)
    d.set('p:2', 2)
    d.set('q:1', 3)
    d.clear('p:')
    expect(d.get('p:1')).toBeNull()
    expect(d.get('p:2')).toBeNull()
    expect(d.get('q:1')).toBe(3)
  })
})
