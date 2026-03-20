/**
 * Storage types for CIDS Portal
 * @author Lorin Luo
 * @description Defines storage driver and manager contracts
 */

export type StorageScope = 'global' | 'project' | 'user' | (string & { _?: never })

export interface StoragePolicy {
  ttl?: number
  scope?: StorageScope
  serialize?: 'json' | 'text'
}

export interface StorageDriver {
  readonly type: 'memory' | 'local'
  get<T = unknown>(key: string): T | null
  set<T = unknown>(key: string, value: T, ttl?: number): void
  remove(key: string): void
  clear(prefix?: string): void
}

export type StorageOp = 'set' | 'remove' | 'clear'

export type StorageUpdatedPayload = {
  key: string
  scope: StorageScope
  op: StorageOp
  source: 'memory' | 'local'
}

export interface StorageManager {
  get<T = unknown>(key: string, policy?: Partial<StoragePolicy>): T | null
  set<T = unknown>(key: string, value: T, policy?: Partial<StoragePolicy>): void
  remove(key: string, scope?: StorageScope): void
  clear(scope?: StorageScope): void
}

export type StoragePolicyConfig = {
  defaults?: StoragePolicy
  keys?: Record<string, StoragePolicy>
}

