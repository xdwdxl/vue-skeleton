import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ErrorI18nResolver } from '../i18n'
import bus from '../../bus'
import { API } from '../../api'
import { storage } from '../../storage/singleton'

vi.mock('../../bus', () => ({
  default: {
    subscribe: vi.fn(),
    publish: vi.fn()
  }
}))

vi.mock('../../api', () => ({
  API: {
    GetConfig: vi.fn()
  }
}))

vi.mock('../../storage/singleton', () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn()
  }
}))

describe('ErrorI18nResolver', () => {
  let resolver: ErrorI18nResolver

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetAllMocks()
    resolver = new ErrorI18nResolver()
  })

  it('should init and load configs', () => {
    resolver.init()
    expect(bus.subscribe).toHaveBeenCalledWith('storage.updated', expect.any(Function))
    expect(bus.subscribe).toHaveBeenCalledWith('config.updated', expect.any(Function))
    expect(API.GetConfig).toHaveBeenCalledTimes(2) // map and bundle
  })

  it('should resolve using fallback if not init', () => {
    expect(resolver.resolve('CODE', 'fallback')).toBe('fallback')
  })

  it('should resolve mapped message', async () => {
    // Mock map and bundle loading
    // @ts-expect-error
    API.GetConfig.mockImplementation(async ({ dataId }) => {
      if (dataId.includes('map')) return { data: { map: { CODE: { i18nKey: 'err.code' } } } }
      if (dataId.includes('messages')) return { data: { 'err.code': 'Localized Error' } }
      return { data: {} }
    })

    resolver.init()
    // Wait for promises to settle
    await new Promise(r => setTimeout(r, 0))

    expect(resolver.resolve('CODE', 'fallback')).toBe('Localized Error')
  })

  it('should resolve mapped fallback', async () => {
    // @ts-ignore
    API.GetConfig.mockImplementation(async ({ dataId }) => {
      if (dataId.includes('map')) return { data: { map: { CODE: { i18nKey: 'err.missing', fallback: 'Mapped Fallback' } } } }
      return { data: {} }
    })

    resolver.init()
    await new Promise(r => setTimeout(r, 0))

    expect(resolver.resolve('CODE', 'default')).toBe('Mapped Fallback')
  })

  it('should switch locale on storage update', async () => {
    resolver.init()
    const handler = (bus.subscribe as any).mock.calls.find((c: any) => c[0] === 'storage.updated')[1]
    
    // @ts-expect-error
    storage.get.mockReturnValue('fr-FR')
    
    await handler({ payload: { key: 'i18n.locale' } })
    
    expect(API.GetConfig).toHaveBeenCalledWith(expect.objectContaining({ dataId: expect.stringContaining('fr-FR') }))
  })

  it('should reload on config update', async () => {
    resolver.init()
    const handler = (bus.subscribe as any).mock.calls.find((c: any) => c[0] === 'config.updated')[1]
    
    // Trigger map update
    await handler({ payload: { dataId: 'portal.error.map.json', group: 'PORTAL_GROUP' } })
    expect(API.GetConfig).toHaveBeenCalledWith(expect.objectContaining({ dataId: 'portal.error.map.json' }))
  })

  it('should ignore invalid storage updates', () => {
    resolver.init()
    const handler = (bus.subscribe as any).mock.calls.find((c: any) => c[0] === 'storage.updated')[1]
    
    vi.clearAllMocks()

    // 1. No payload
    handler({ payload: null })
    expect(storage.get).not.toHaveBeenCalled()

    // 2. Wrong key
    handler({ payload: { key: 'other.key' } })
    expect(storage.get).not.toHaveBeenCalled()

    // 3. Same locale
    // @ts-ignore
    storage.get.mockReturnValue('en') // Same as default
    handler({ payload: { key: 'i18n.locale' } })
    // Should verify loadBundle NOT called.
    // Since loadBundle calls API.GetConfig, and we cleared mocks, it should be 0 calls.
    expect(API.GetConfig).not.toHaveBeenCalled()
  })

  it('should ignore invalid config updates', () => {
    resolver.init()
    const handler = (bus.subscribe as any).mock.calls.find((c: any) => c[0] === 'config.updated')[1]

    vi.clearAllMocks()

    // 1. Missing dataId or group
    handler({ payload: { dataId: 'id' } }) // missing group
    handler({ payload: { group: 'grp' } }) // missing dataId
    expect(API.GetConfig).not.toHaveBeenCalled()

    // 2. Wrong group
    handler({ payload: { dataId: 'id', group: 'OTHER_GROUP' } })
    expect(API.GetConfig).not.toHaveBeenCalled()

    // 3. Irrelevant dataId
    handler({ payload: { dataId: 'irrelevant.json', group: 'PORTAL_GROUP' } })
    expect(API.GetConfig).not.toHaveBeenCalled()
  })

  it('should handle various map formats and aliases', async () => {
    // @ts-expect-error
    API.GetConfig.mockImplementation(async ({ dataId }) => {
        if (dataId.includes('map')) {
            return {
                data: {
                    // Direct map format
                    'ERR_1': { key: 'k1', message: 'm1' }, // aliases
                    'ERR_2': { i18n_key: 'k2', fallback: 'f2' }, // aliases
                    'ERR_3': { i18nKey: 'k3', fallback: 123 }, // number fallback
                    'ERR_4': { i18nKey: 'k4', fallback: true }, // boolean fallback
                    'ERR_BAD': {} // invalid
                }
            }
        }
        return { data: {} }
    })

    resolver.init()
    await new Promise(r => setTimeout(r, 0))

    // ERR_1: key -> i18nKey, message -> fallback
    expect(resolver.resolve('ERR_1', 'def')).toBe('m1')
    
    // ERR_2: i18n_key -> i18nKey
    expect(resolver.resolve('ERR_2', 'def')).toBe('f2')

    // ERR_3: number fallback
    expect(resolver.resolve('ERR_3', 'def')).toBe('123')

    // ERR_4: boolean fallback
    expect(resolver.resolve('ERR_4', 'def')).toBe('true')
  })

  it('should handle map wrapped in "codes" property', async () => {
      // @ts-expect-error
      API.GetConfig.mockResolvedValue({
          data: {
              codes: {
                  'ERR_CODE': { i18nKey: 'k' }
              }
          }
      })
      
      resolver.init()
      await new Promise(r => setTimeout(r, 0))
      
      // Need to verify it loaded. 
      // If we ask for ERR_CODE, it should map to 'k'. 
      // If bundle is empty, it returns fallback, but we can check if it tries to find 'k'.
      // Wait, resolve logic:
      // if (!item) return fallback
      // if (typeof msg === 'string' && msg) return msg
      // if (item.fallback) return item.fallback
      // return fallback
      
      // Here item exists, but no bundle msg, no fallback. So it returns fallback passed to resolve.
      // However, to prove map is loaded, we can provide a fallback in the map item.
      
      // Let's redefine mock
      // @ts-expect-error
      API.GetConfig.mockResolvedValue({
        data: {
            codes: {
                'ERR_CODE': { i18nKey: 'k', fallback: 'mapped_fb' }
            }
        }
      })
      
      // Re-init (need new resolver or force reload)
      const r2 = new ErrorI18nResolver()
      r2.init()
      await new Promise(r => setTimeout(r, 0))
      
      expect(r2.resolve('ERR_CODE', 'def')).toBe('mapped_fb')
  })

  it('should handle bundle with non-string values', async () => {
      // @ts-expect-error
      API.GetConfig.mockImplementation(async ({ dataId }) => {
          if (dataId.includes('messages')) {
              return {
                  data: {
                      'k1': 100,
                      'k2': true,
                      'k3': 'string'
                  }
              }
          }
          return { data: { map: { 'E1': { i18nKey: 'k1' }, 'E2': { i18nKey: 'k2' }, 'E3': { i18nKey: 'k3' } } } }
      })

      resolver.init()
      await new Promise(r => setTimeout(r, 0))

      expect(resolver.resolve('E1', 'def')).toBe('100')
      expect(resolver.resolve('E2', 'def')).toBe('true')
      expect(resolver.resolve('E3', 'def')).toBe('string')
  })

  it('should handle API errors gracefully', async () => {
      // @ts-expect-error
      API.GetConfig.mockRejectedValue(new Error('Network Error'))

      // Should not throw
      expect(() => resolver.init()).not.toThrow()
      
      // Wait for async promises
      await new Promise(r => setTimeout(r, 0))
      
      // Should still function with fallbacks
      expect(resolver.resolve('ANY', 'fb')).toBe('fb')
  })

  it('should return arg fallback if map exists but no bundle or mapped fallback', async () => {
    // @ts-expect-error
    API.GetConfig.mockImplementation(async ({ dataId }) => {
        if (dataId.includes('map')) {
            return { data: { map: { 'CODE': { i18nKey: 'k' } } } } // No fallback in map
        }
        return { data: {} } // Empty bundle
    })
    
    resolver.init()
    await new Promise(r => setTimeout(r, 0))
    
    expect(resolver.resolve('CODE', 'arg_fallback')).toBe('arg_fallback')
  })
})
