/**
 * Error deduper
 * @author Lorin Luo
 * @description Prevents toast flooding by de-duplicating errors in a time window
 */

export class ErrorDeduper {
  private readonly windowMs: number
  private readonly maxSize: number
  private readonly seen = new Map<string, number>()

  constructor(opts?: { windowMs?: number; maxSize?: number }) {
    this.windowMs = Math.max(0, Number(opts?.windowMs ?? 3000))
    this.maxSize = Math.max(100, Number(opts?.maxSize ?? 2000))
  }

  /**
   * Check if error should be shown
   * @param {string} key - Deduplication key
   * @returns {boolean} - True if should show
   */
  shouldShow(key: string): boolean {
    const now = Date.now()
    const prev = this.seen.get(key)
    if (typeof prev === 'number' && now - prev <= this.windowMs) return false
    this.seen.set(key, now)
    this.gc(now)
    return true
  }

  /**
   * Garbage collection for seen keys
   * @param {number} now - Current timestamp
   */
  private gc(now: number): void {
    if (this.seen.size <= this.maxSize) return
    const entries = Array.from(this.seen.entries()).sort((a, b) => a[1] - b[1])
    const removeCount = Math.max(1, Math.floor(this.maxSize * 0.2))
    for (let i = 0; i < removeCount && i < entries.length; i += 1) {
      this.seen.delete(entries[i][0])
    }
    for (const [k, ts] of this.seen.entries()) {
      if (now - ts > this.windowMs * 10) this.seen.delete(k)
    }
  }
}

