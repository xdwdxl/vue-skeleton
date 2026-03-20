/**
 * SSE Adapter for CIDS Bus
 * @author Lorin Luo
 * @date 2025-12-18
 * @description Bridges backend Server-Sent Events to the frontend message bus
 */
import type { Bus } from '../types'

type SseUrlFactory = string | (() => string | Promise<string>)

export class SseAdapter {
  private es?: EventSource
  private readonly bus: Bus
  private readonly url: SseUrlFactory
  private currentUrl: string
  private reconnectTimer?: number
  private retryCount = 0
  private readonly maxRetries = 5

  constructor(bus: Bus, url: SseUrlFactory) {
    this.bus = bus
    this.url = url
    this.currentUrl = typeof url === 'string' ? url : ''
    this.connect()
  }

  private connect() {
    if (typeof this.url === 'string') {
      this.connectWithUrl(this.url)
      return
    }
    void this.connectAsync()
  }

  private async connectAsync() {
    try {
      const url = await this.resolveUrl()
      this.connectWithUrl(url)
    } catch (e) {
      console.error('[SseAdapter] Connection failed:', e)
      this.handleReconnect()
    }
  }

  private async resolveUrl(): Promise<string> {
    if (typeof this.url === 'string') return this.url
    try {
      const v = await this.url()
      return String(v || '').trim()
    } catch {
      return ''
    }
  }

  private connectWithUrl(url: string) {
    const nextUrl = String(url || '').trim()
    if (!nextUrl) {
      this.handleReconnect()
      return
    }

    if (this.es) {
      this.es.close()
    }

    this.currentUrl = nextUrl
    this.es = new EventSource(nextUrl)

    this.es.onopen = () => {
      this.retryCount = 0
      this.bus.publish('system.sse.connected', { url: this.currentUrl })
    }

    this.es.onerror = (_e) => {
      this.es?.close()
      this.handleReconnect()
    }

    this.es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data?.type) {
          this.bus.publish(data.type, data, { origin: 'sse' })
        }
      } catch (error) {
        console.error('[SseAdapter] Failed to parse message:', error)
      }
    }
  }

  private handleReconnect() {
    if (this.retryCount >= this.maxRetries) {
      this.bus.publish('system.sse.error', { message: 'Max retries exceeded' })
      return
    }

    const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000)
    this.retryCount++
    
    this.reconnectTimer = globalThis.setTimeout(() => {
      this.connect()
    }, delay)
  }

  public close() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.es?.close()
    this.es = undefined
  }
}
