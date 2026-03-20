/**
 * BroadcastChannel adapter
 * @author Lorin Luo
 */
import type { Envelope } from '../types'

type OnMessage = (env: Envelope) => void

export class BroadcastAdapter {
  private readonly bc?: BroadcastChannel
  private readonly seen = new Set<string>()
  private readonly channelName: string
  private readonly onMessage: OnMessage
  private readonly maxSeen = 1000

  constructor(channelName: string, onMessage: OnMessage) {
    this.channelName = channelName
    this.onMessage = onMessage
    const hasBC = typeof globalThis !== 'undefined' && 'BroadcastChannel' in globalThis
    if (hasBC) {
      this.bc = new BroadcastChannel(channelName)
      this.bc.onmessage = (ev) => {
        const env = ev.data as Envelope
        if (!env || typeof env !== 'object') return
        if (this.seen.has(env.id)) return
        this.addSeen(env.id)
        this.onMessage(env)
      }
    } else if (typeof globalThis !== 'undefined') {
      (globalThis as unknown as Window).addEventListener('storage', (e: StorageEvent) => {
        if (e.key !== this.channelName || !e.newValue) return
        try {
          const env = JSON.parse(e.newValue) as Envelope
          if (this.seen.has(env.id)) return
          this.addSeen(env.id)
          this.onMessage(env)
        } catch {}
      })
    }
  }

  private addSeen(id: string) {
    if (this.seen.size >= this.maxSeen) {
      const it = this.seen.values()
      const first = it.next().value
      if (typeof first === 'string') this.seen.delete(first)
    }
    this.seen.add(id)
  }

  publish(env: Envelope): void {
    this.addSeen(env.id)
    if (this.bc) {
      this.bc.postMessage(env)
    } else {
      try {
        const payload = JSON.stringify(env)
        localStorage.setItem(this.channelName, payload)
      } catch (e) {
        console.error('[Bus] Broadcast failed:', e)
      }
    }
  }
}
