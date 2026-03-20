/**
 * Storage sync helper
 * @author Lorin Luo
 * @description Cross-tab storage sync via BroadcastChannel with storage-event fallback
 */

import type { StorageOp, StorageScope } from './types'

export type StorageSyncMessage = {
  key: string
  scope: StorageScope
  op: StorageOp
  source: 'memory' | 'local'
  senderId: string
  ts: number
}

type OnMessage = (msg: StorageSyncMessage) => void

function canBroadcastChannel(): boolean {
  try {
    return typeof BroadcastChannel !== 'undefined'
  } catch {
    return false
  }
}

function genSenderId(): string {
  try {
    return crypto.randomUUID()
  } catch {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const rnd = new Uint8Array(8)
      crypto.getRandomValues(rnd)
      const hex = Array.from(rnd, (b) => b.toString(16).padStart(2, '0')).join('')
      return `${Date.now()}_${hex}`
    }
    throw new Error('Secure random number generator not available')
  }
}

export class StorageSync {
  private readonly channelName: string
  private readonly onMessage: OnMessage
  private readonly bc?: BroadcastChannel
  private readonly senderId: string

  constructor(channelName: string, onMessage: OnMessage) {
    this.channelName = channelName
    this.onMessage = onMessage
    this.senderId = genSenderId()

    if (canBroadcastChannel()) {
      this.bc = new BroadcastChannel(channelName)
      this.bc.onmessage = (ev) => {
        const data = ev.data as StorageSyncMessage
        if (!data || typeof data !== 'object') return
        if (!data.op || !data.key) return
        if (data.senderId === this.senderId) return
        this.onMessage(data)
      }
    } else {
      window.addEventListener('storage', (e) => {
        if (e.key !== this.channelName || !e.newValue) return
        try {
          const data = JSON.parse(e.newValue) as StorageSyncMessage
          if (!data || typeof data !== 'object') return
          if (data.senderId === this.senderId) return
          this.onMessage(data)
        } catch {}
      })
    }
  }

  publish(msg: Omit<StorageSyncMessage, 'ts' | 'senderId'>): void {
    const payload: StorageSyncMessage = { ...msg, senderId: this.senderId, ts: Date.now() }
    if (this.bc) {
      this.bc.postMessage(payload)
      return
    }
    try {
      localStorage.setItem(this.channelName, JSON.stringify(payload))
    } catch {}
  }
}
