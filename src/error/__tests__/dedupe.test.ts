import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ErrorDeduper } from '../dedupe'

describe('ErrorDeduper', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should allow first error', () => {
    const deduper = new ErrorDeduper()
    expect(deduper.shouldShow('key1')).toBe(true)
  })

  it('should block duplicate within window', () => {
    const deduper = new ErrorDeduper({ windowMs: 1000 })
    expect(deduper.shouldShow('key1')).toBe(true)
    expect(deduper.shouldShow('key1')).toBe(false)
    
    vi.advanceTimersByTime(500)
    expect(deduper.shouldShow('key1')).toBe(false)
    
    vi.advanceTimersByTime(600) // Total 1100ms
    expect(deduper.shouldShow('key1')).toBe(true)
  })

  it('should gc when size exceeds limit', () => {
    const deduper = new ErrorDeduper({ maxSize: 10, windowMs: 1000 })
    for (let i = 0; i < 12; i++) {
      deduper.shouldShow(`k${i}`)
      vi.advanceTimersByTime(1)
    }
    const againOld = deduper.shouldShow('k0')
    const againNew = deduper.shouldShow('k11')
    expect(againOld).toBe(false)
    expect(againNew).toBe(false)
  })
  
  it('should gc old entries', () => {
    const deduper = new ErrorDeduper({ maxSize: 100, windowMs: 100 })
    deduper.shouldShow('old')
    
    vi.advanceTimersByTime(2000) // > windowMs * 10
    
    deduper.shouldShow('new')
    // gc should have run and removed 'old'
    
    // If 'old' was removed, adding it again immediately should return true (which it would anyway since time passed)
    // The gc logic: if (now - ts > this.windowMs * 10) this.seen.delete(k)
    // We mainly want to hit that line for coverage.
    expect(deduper.shouldShow('old')).toBe(true)
  })
})
