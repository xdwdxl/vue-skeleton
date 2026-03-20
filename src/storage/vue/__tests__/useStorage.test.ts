import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useStorage } from '../useStorage'
import { storage } from '../../singleton'
import bus from '../../../bus'
import { nextTick } from 'vue'

// Mock dependencies
vi.mock('../../singleton', () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn()
  }
}))

vi.mock('../../../bus', () => ({
  default: {
    subscribe: vi.fn().mockReturnValue(vi.fn()), // Return unsubscribe fn
    publish: vi.fn()
  }
}))

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onBeforeUnmount: vi.fn((fn) => fn && fn()) // Immediate execute for test or just mock
  }
})

describe('useStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with value from storage', () => {
    // @ts-expect-error mock
    storage.get.mockReturnValue('stored')
    const val = useStorage('key', 'default')
    expect(val.value).toBe('stored')
    expect(storage.get).toHaveBeenCalledWith('key', undefined)
  })

  it('should initialize with default value if storage is empty', () => {
    // @ts-expect-error mock
    storage.get.mockReturnValue(undefined)
    const val = useStorage('key', 'default')
    expect(val.value).toBe('default')
  })

  it('should update storage when value changes', async () => {
    // @ts-expect-error mock
    storage.get.mockReturnValue('initial')
    const val = useStorage('key', 'default')
    
    val.value = 'updated'
    await nextTick()
    
    expect(storage.set).toHaveBeenCalledWith('key', 'updated', undefined)
  })

  it('should update value when storage updates', () => {
    // @ts-expect-error mock
    storage.get.mockReturnValue('initial')
    const val = useStorage('key', 'default')
    
    // Get the subscribe callback
    const handler = (bus.subscribe as any).mock.calls.find((c: any) => c[0] === 'storage.updated')[1]
    
    // Simulate storage update from elsewhere
    // @ts-expect-error mock
    storage.get.mockReturnValue('external')
    handler({ payload: { key: 'key', op: 'set' } })
    
    expect(val.value).toBe('external')
  })

  it('should ignore storage updates for other keys', () => {
    // @ts-expect-error mock
    storage.get.mockReturnValue('initial')
    const val = useStorage('key', 'default')
    
    const handler = (bus.subscribe as any).mock.calls.find((c: any) => c[0] === 'storage.updated')[1]
    
    // @ts-expect-error mock
    storage.get.mockReturnValue('external')
    handler({ payload: { key: 'other', op: 'set' } })
    
    expect(val.value).toBe('initial')
  })

  it('should reset to initial value when storage is cleared', () => {
    // @ts-expect-error mock
    storage.get.mockReturnValue('initial')
    const val = useStorage('key', 'default')

    const handler = (bus.subscribe as any).mock.calls.find((c: any) => c[0] === 'storage.updated')[1]

    // Simulate storage cleared (returns undefined)
    // @ts-expect-error mock
    storage.get.mockReturnValue(undefined)
    handler({ payload: { key: 'key', op: 'remove' } })

    expect(val.value).toBe('default')
  })

  it('should ignore invalid payload', () => {
    // @ts-expect-error mock
    storage.get.mockReturnValue('initial')
    const val = useStorage('key', 'default')

    const handler = (bus.subscribe as any).mock.calls.find((c: any) => c[0] === 'storage.updated')[1]

    // Invalid payload
    handler({ payload: null })
    handler(undefined)

    expect(val.value).toBe('initial')
  })
})
