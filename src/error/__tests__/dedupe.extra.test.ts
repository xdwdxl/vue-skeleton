/**
 * @file src/error/__tests__/dedupe.extra.test.ts
 * @author Lorin Luo
 * @description Extra branch tests for ErrorDeduper
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ErrorDeduper } from '../dedupe'

describe('ErrorDeduper extra branches', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(0))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('gc removes oldest entries when size exceeds maxSize', () => {
    const deduper = new ErrorDeduper({ maxSize: 5, windowMs: 1000 })
    for (let i = 0; i < 7; i++) {
      expect(deduper.shouldShow(`k${i}`)).toBe(true)
      vi.setSystemTime(new Date(i + 1))
    }
    const againOld = deduper.shouldShow('k0')
    const againMid = deduper.shouldShow('k2')
    expect(againOld).toBe(false)
    expect(againMid).toBe(false)
  })

  it('gc removes stale entries older than window * 10', () => {
    const deduper = new ErrorDeduper({ maxSize: 10, windowMs: 100 })
    expect(deduper.shouldShow('old')).toBe(true)
    vi.setSystemTime(new Date(2000))
    expect(deduper.shouldShow('new')).toBe(true)
    expect(deduper.shouldShow('old')).toBe(true)
  })

  it('gc with small maxSize evicts oldest allowing immediate re-show', () => {
    const deduper = new ErrorDeduper({ maxSize: 2, windowMs: 10 ** 9 })
    vi.setSystemTime(new Date(0))
    expect(deduper.shouldShow('a')).toBe(true)
    vi.setSystemTime(new Date(1))
    expect(deduper.shouldShow('b')).toBe(true)
    vi.setSystemTime(new Date(2))
    expect(deduper.shouldShow('c')).toBe(true)
    vi.setSystemTime(new Date(3))
    expect(deduper.shouldShow('a')).toBe(false)
    expect(deduper.shouldShow('b')).toBe(false)
  })
  
  it('gc evicts 20% oldest entries when exceeding maxSize', () => {
    const deduper = new ErrorDeduper({ maxSize: 50, windowMs: 10 ** 9 })
    // min maxSize is 100, so we need >100 keys to trigger gc
    for (let i = 0; i < 101; i++) {
      expect(deduper.shouldShow(`k${i}`)).toBe(true)
      vi.setSystemTime(new Date(i + 1))
    }
    expect(deduper.shouldShow('k101')).toBe(true)
    expect(deduper.shouldShow('k0')).toBe(true)
  })
  
  it('gc removes stale entries when size exceeded', () => {
    const deduper = new ErrorDeduper({ maxSize: 50, windowMs: 1 })
    for (let i = 0; i < 101; i++) {
      expect(deduper.shouldShow(`k${i}`)).toBe(true)
      vi.setSystemTime(new Date(i + 1))
    }
    vi.setSystemTime(new Date(1000))
    expect(deduper.shouldShow('new')).toBe(true)
    expect(deduper.shouldShow('k50')).toBe(true)
  })
})
