/**
 * Storage module entry
 * @author Lorin Luo
 * @description Exports storage singleton and related utilities
 */

export { storage } from './singleton'
export type { StorageManager, StorageDriver, StorageScope, StoragePolicy, StoragePolicyConfig, StorageUpdatedPayload } from './types'
export { useStorage } from './vue/useStorage'

