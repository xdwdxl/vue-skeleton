/**
 * Storage manager
 * @author Lorin Luo
 * @description Provides scoped storage with TTL, policy and sync
 */

import bus from '../bus'
import { LocalDriver } from './drivers/local'
import { MemoryDriver } from './drivers/memory'
import { StorageSync } from './sync'
import type { StorageDriver, StorageManager, StorageOp, StoragePolicy, StoragePolicyConfig, StorageScope, StorageUpdatedPayload } from './types'

const STORAGE_PREFIX = 'cids'
const DEFAULT_CHANNEL = (import.meta.env.VITE_STORAGE_CHANNEL as string) || 'cids-storage'
const POLICY_DATA_ID = (import.meta.env.VITE_STORAGE_POLICY_DATA_ID as string) || 'portal.storage.policy.json'
const POLICY_GROUP = (import.meta.env.VITE_STORAGE_POLICY_GROUP as string) || 'PORTAL_GROUP'
const LOCAL_STORAGE_PROBE_KEY = 'cids:storage:probe'

function normalizeScope(scope?: StorageScope): StorageScope {
  return (scope ?? 'global')
}

function splitKey(key: string): { namespace: string; name: string } {
  const raw = String(key || '').trim()
  const idx = raw.indexOf('.')
  if (idx <= 0) return { namespace: 'default', name: raw }
  return { namespace: raw.slice(0, idx), name: raw.slice(idx + 1) }
}

function buildKey(scope: StorageScope, key: string): string {
  const { namespace, name } = splitKey(key)
  return `${STORAGE_PREFIX}:${scope}:${namespace}:${name}`
}

function clonePolicy(p: StoragePolicy | undefined): StoragePolicy {
  return { ...(p || {}) }
}

function canUseLocalStorage(): boolean {
  try {
    localStorage.setItem(LOCAL_STORAGE_PROBE_KEY, '1')
    localStorage.removeItem(LOCAL_STORAGE_PROBE_KEY)
    return true
  } catch {
    return false
  }
}

export class PortalStorageManager implements StorageManager {
  private readonly memory: StorageDriver
  private readonly local: StorageDriver
  private readonly sync: StorageSync
  private policy: StoragePolicyConfig = { defaults: { ttl: 86400000, serialize: 'json' }, keys: {} }
  private lastSyncTs = 0
  private readonly localUsable: boolean

  constructor() {
    this.memory = new MemoryDriver()
    this.local = new LocalDriver()
    this.localUsable = canUseLocalStorage()
    this.sync = new StorageSync(DEFAULT_CHANNEL, (msg) => this.onSyncMessage(msg))

    bus.subscribe('config.updated', (msg) => {
      const p = msg?.payload as Record<string, unknown>
      const dataId = typeof p?.dataId === 'string' ? p.dataId : undefined
      const group = typeof p?.group === 'string' ? p.group : undefined
      if (dataId === POLICY_DATA_ID && group === POLICY_GROUP) this.loadPolicy()
    })
  }

  public init(): void {
    this.loadPolicy()
  }

  get<T = unknown>(key: string, policy?: Partial<StoragePolicy>): T | null {
    const resolved = this.resolvePolicy(key, policy)
    const internalKey = buildKey(resolved.scope as StorageScope, key)
    const driver = this.pickDriver(internalKey, resolved)
    const v = driver.get<T>(internalKey)
    if (v === null && driver.type === 'local') {
      return this.memory.get<T>(internalKey)
    }
    return v
  }

  set<T = unknown>(key: string, value: T, policy?: Partial<StoragePolicy>): void {
    const resolved = this.resolvePolicy(key, policy)
    const internalKey = buildKey(resolved.scope as StorageScope, key)
    const driver = this.pickDriver(internalKey, resolved)
    const ttl = typeof resolved.ttl === 'number' ? resolved.ttl : undefined

    try {
      driver.set(internalKey, resolved.serialize === 'text' ? String(value) : value, ttl)
      this.emitUpdated({ key, scope: resolved.scope as StorageScope, op: 'set', source: driver.type })
    } catch {
      this.memory.set(internalKey, value, ttl)
      this.emitUpdated({ key, scope: resolved.scope as StorageScope, op: 'set', source: this.memory.type })
    }
  }

  remove(key: string, scope?: StorageScope): void {
    const resolvedScope = normalizeScope(scope)
    const internalKey = buildKey(resolvedScope, key)
    this.local.remove(internalKey)
    this.memory.remove(internalKey)
    this.emitUpdated({ key, scope: resolvedScope, op: 'remove', source: 'local' })
  }

  clear(scope?: StorageScope): void {
    const resolvedScope = normalizeScope(scope)
    const prefix = `${STORAGE_PREFIX}:${resolvedScope}:`
    this.local.clear(prefix)
    this.memory.clear(prefix)
    this.emitUpdated({ key: '*', scope: resolvedScope, op: 'clear', source: 'local' })
  }

  private resolvePolicy(key: string, override?: Partial<StoragePolicy>): StoragePolicy {
    const defaults = clonePolicy(this.policy.defaults)
    const fromKeys = clonePolicy(this.policy.keys?.[key])
    const merged: StoragePolicy = { ...defaults, ...fromKeys, ...(override || {}) }
    merged.scope = normalizeScope(merged.scope)
    merged.serialize = merged.serialize ?? 'json'
    return merged
  }

  private pickDriver(_internalKey: string, policy: StoragePolicy): StorageDriver {
    if ((policy.scope === 'user' || policy.scope === 'project') && this.localUsable) return this.local
    return this.memory
  }

  private emitUpdated(payload: StorageUpdatedPayload): void {
    try {
      bus.publish('storage.updated', payload)
    } catch {}
    try {
      this.sync.publish(payload)
    } catch {}
  }

  private onSyncMessage(msg: { key: string; scope: StorageScope; op: StorageOp; source: 'memory' | 'local'; senderId: string; ts: number }): void {
    if (!msg || typeof msg !== 'object') return
    if (typeof msg.ts === 'number' && msg.ts <= this.lastSyncTs) return
    if (typeof msg.ts === 'number') this.lastSyncTs = msg.ts
    try {
      bus.publish('storage.updated', { key: msg.key, scope: msg.scope, op: msg.op, source: msg.source })
    } catch {}
  }

  private async loadPolicy(): Promise<void> {
    try {
      const { API } = await import('../api')
      const res = await API.GetConfig({ dataId: POLICY_DATA_ID, group: POLICY_GROUP })
      const cfg = res?.data as StoragePolicyConfig | undefined
      if (!cfg || typeof cfg !== 'object') return
      this.policy = {
        defaults: { ...(cfg.defaults || this.policy.defaults) },
        keys: { ...(cfg.keys || {}) },
      }
    } catch {}
  }
}
