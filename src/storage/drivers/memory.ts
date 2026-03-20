/**
 * Memory storage driver
 * @author Lorin Luo
 * @description In-memory Map driver with TTL support
 */

import type { StorageDriver } from '../types'

type StoredItem<T = unknown> = { v: T; e?: number }

export class MemoryDriver implements StorageDriver {
  public readonly type = 'memory' as const
  private readonly map = new Map<string, StoredItem>()

  get<T = unknown>(key: string): T | null {
    const item = this.map.get(key)
    if (!item) return null
    if (typeof item.e === 'number' && Date.now() > item.e) {
      this.map.delete(key)
      return null
    }
    return item.v as T
  }

  set<T = unknown>(key: string, value: T, ttl?: number): void {
    const e = typeof ttl === 'number' && ttl > 0 ? Date.now() + ttl : undefined
    this.map.set(key, { v: value, e })
  }

  remove(key: string): void {
    this.map.delete(key)
  }

  clear(prefix?: string): void {
    if (!prefix) {
      this.map.clear()
      return
    }
    for (const k of Array.from(this.map.keys())) {
      if (k.startsWith(prefix)) this.map.delete(k)
    }
  }
}

