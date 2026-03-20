/**
 * LocalStorage driver
 * @author Lorin Luo
 * @description localStorage driver with TTL metadata
 */

import type { StorageDriver } from '../types'

type StoredItem<T = unknown> = { v: T; e?: number }

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export class LocalDriver implements StorageDriver {
  public readonly type = 'local' as const

  get<T = unknown>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key)
      const item = safeParse<StoredItem<T>>(raw)
      if (!item || typeof item !== 'object' || !('v' in item)) return null
      if (typeof item.e === 'number' && Date.now() > item.e) {
        localStorage.removeItem(key)
        return null
      }
      return item.v
    } catch {
      return null
    }
  }

  set<T = unknown>(key: string, value: T, ttl?: number): void {
    const e = typeof ttl === 'number' && ttl > 0 ? Date.now() + ttl : undefined
    const item: StoredItem<T> = { v: value, e }
    localStorage.setItem(key, JSON.stringify(item))
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {}
  }

  clear(prefix?: string): void {
    try {
      if (!prefix) {
        localStorage.clear()
        return
      }
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i += 1) {
        const k = localStorage.key(i)
        if (k?.startsWith(prefix)) keys.push(k)
      }
      keys.forEach((k) => localStorage.removeItem(k))
    } catch {}
  }
}

