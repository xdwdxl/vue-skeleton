/**
 * Vue composable for storage
 * @author Lorin Luo
 * @description Provides reactive binding between storage and Vue state
 */

import { onBeforeUnmount, ref, watch, type Ref } from 'vue'
import bus from '../../bus'
import type { StoragePolicy, StorageUpdatedPayload } from '../types'
import { storage } from '../singleton'

/**
 * Bind a storage key to a reactive ref
 * @author Lorin Luo
 * @param {string} key - Storage key (e.g., portal.theme)
 * @param {T} initial - Default value when empty
 * @param {Partial<StoragePolicy>} [policy] - Storage policy
 * @returns {Ref<T>} - Reactive state
 */
export function useStorage<T>(key: string, initial: T, policy?: Partial<StoragePolicy>): Ref<T> {
  const state = ref<T>(storage.get<T>(key, policy) ?? initial) as Ref<T>

  watch(
    state,
    (v) => {
      storage.set<T>(key, v, policy)
    },
    { deep: true }
  )

  const off = bus.subscribe('storage.updated', (msg) => {
    const p = msg?.payload as StorageUpdatedPayload | undefined
    if (!p || p.key !== key) return
    state.value = storage.get<T>(key, policy) ?? initial
  })

  onBeforeUnmount(() => off())

  return state
}
