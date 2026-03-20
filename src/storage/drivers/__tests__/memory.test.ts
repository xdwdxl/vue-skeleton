/**
 * @file src/storage/drivers/__tests__/memory.test.ts
 * @author Lorin Luo
 * @description Tests for MemoryDriver covering TTL and prefix clear
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryDriver } from '../../drivers/memory'

describe('MemoryDriver', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('handles ttl expiration and removes item', () => {
    const d = new MemoryDriver()
    d.set('k', 'v', 10)
    expect(d.get('k')).toBe('v')
    vi.advanceTimersByTime(20)
    expect(d.get('k')).toBeNull()
  })

  it('remove deletes key', () => {
    const d = new MemoryDriver()
    d.set('a', 1)
    d.remove('a')
    expect(d.get('a')).toBeNull()
  })

  it('clear without prefix clears all', () => {
    const d = new MemoryDriver()
    d.set('a', 1)
    d.set('b', 2)
    d.clear()
    expect(d.get('a')).toBeNull()
    expect(d.get('b')).toBeNull()
  })

  it('clear with prefix clears only matching keys', () => {
    const d = new MemoryDriver()
    d.set('p:1', 1)
    d.set('p:2', 2)
    d.set('q:1', 3)
    d.clear('p:')
    expect(d.get('p:1')).toBeNull()
    expect(d.get('p:2')).toBeNull()
    expect(d.get('q:1')).toBe(3)
  })
})
