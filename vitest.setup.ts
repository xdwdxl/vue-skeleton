import { vi } from 'vitest'

// Mock CSS modules
vi.mock('element-plus/theme-chalk/base.css', () => ({}))
vi.mock('element-plus/es/components/button/style/css', () => ({}))
vi.mock('element-plus/es/components/card/style/css', () => ({}))
vi.mock('element-plus/es/components/input/style/css', () => ({}))
vi.mock('element-plus/es/components/input-number/style/css', () => ({}))
vi.mock('element-plus/es/components/icon/style/css', () => ({}))

// Mock EventSource and BroadcastChannel
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