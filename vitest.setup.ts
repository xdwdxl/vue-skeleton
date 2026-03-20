import { vi } from 'vitest'

globalThis.EventSource = (class {
  constructor(_url: string) {}
  close = vi.fn()
  addEventListener = vi.fn()
  removeEventListener = vi.fn()
} as unknown as typeof EventSource)

if (!('BroadcastChannel' in globalThis)) {
  globalThis.BroadcastChannel = (class {
    constructor(_name: string) {}
    postMessage = vi.fn()
    close = vi.fn()
    addEventListener = vi.fn()
    removeEventListener = vi.fn()
  } as unknown as typeof BroadcastChannel)
}