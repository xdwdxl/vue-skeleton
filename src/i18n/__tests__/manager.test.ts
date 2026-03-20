import { describe, it, expect, vi, beforeEach } from 'vitest'
import { I18nManager } from '../manager'
import { API } from '../../api'
import { storage } from '../../storage/singleton'
import bus from '../../bus'

// Mock regionalization functions (not singletons)
vi.mock('../../regionalization', async (importOriginal) => {
  const mod = await importOriginal()
  return {
    ...mod as any,
    getPluralCategory: vi.fn((n) => n === 1 ? 'one' : 'other'),
    formatNumber: vi.fn((n) => String(n)),
    formatDateTime: vi.fn((d) => 'Date:' + String(d)),
    formatCurrency: vi.fn((n) => '$' + n)
  }
})

describe('I18nManager', () => {
  let manager: I18nManager

  beforeEach(() => {
    vi.restoreAllMocks()
    
    // Spy on singletons
    vi.spyOn(API, 'GetConfig').mockResolvedValue({ status: 200, statusText: 'OK', headers: {}, config: {} as any, data: {} } as unknown as import('axios').AxiosResponse)
    vi.spyOn(storage, 'get').mockReturnValue(undefined)
    vi.spyOn(storage, 'set').mockImplementation(() => {})
    vi.spyOn(bus, 'publish').mockImplementation(() => {})
    vi.spyOn(bus, 'subscribe').mockImplementation(() => vi.fn())
  })

  it('should init with defaults', () => {
    manager = new I18nManager()
    expect(manager.locale).toBe('en-US')
    expect(API.GetConfig).toHaveBeenCalled() // loadMeta
  })

  it('should load locale from storage', () => {
    vi.spyOn(storage, 'get').mockReturnValue('de-DE')
    manager = new I18nManager()
    expect(manager.locale).toBe('de-DE')
  })

  it('should normalize unsupported locale to fallback', () => {
    vi.spyOn(storage, 'get').mockReturnValue('zh-CN')
    manager = new I18nManager()
    expect(manager.locale).toBe('en-US')
  })

  it('should use getter and setter for locale', () => {
    manager = new I18nManager()
    manager.locale = 'de-DE'
    expect(manager.locale).toBe('de-DE')
    expect(manager.getLocale()).toBe('de-DE')
    expect(storage.set).toHaveBeenCalledWith('i18n.locale', 'de-DE', expect.anything())
  })

  it('should load messages', async () => {
    vi.spyOn(API, 'GetConfig').mockImplementation(async ({ dataId }) => {
      if (dataId.startsWith('en-US')) return { status: 200, statusText: 'OK', headers: {}, config: {} as any, data: { hello: 'Hello' } } as unknown as import('axios').AxiosResponse
      return { status: 200, statusText: 'OK', headers: {}, config: {} as any, data: {} } as unknown as import('axios').AxiosResponse
    })
    
    manager = new I18nManager()
    await new Promise(r => setTimeout(r, 10))
    
    expect(manager.t('hello')).toBe('Hello')
  })

  it('should handle load message errors (invalid data)', async () => {
    // Return null data
    vi.spyOn(API, 'GetConfig').mockResolvedValue({ status: 200, statusText: 'OK', headers: {}, config: {} as any, data: null } as unknown as import('axios').AxiosResponse)
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    manager = new I18nManager()
    await manager.loadLocale('en-US', { force: true })
    
    expect(warnSpy).toHaveBeenCalled()
    // Should set empty object to prevent infinite loop
    expect(manager.t('anything')).toBe('anything')
  })

  it('should handle load message errors (exception)', async () => {
    vi.spyOn(API, 'GetConfig').mockRejectedValue(new Error('Network'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    manager = new I18nManager()
    await manager.loadLocale('en-US', { force: true })
    
    expect(errorSpy).toHaveBeenCalled()
  })

  it('should change locale', async () => {
    manager = new I18nManager()
    await manager.setLocale('de-DE')
    
    expect(manager.locale).toBe('de-DE')
    expect(storage.set).toHaveBeenCalledWith('i18n.locale', 'de-DE', expect.any(Object))
    expect(bus.publish).toHaveBeenCalledWith('i18n.locale.changed', { locale: 'de-DE' })
    expect(API.GetConfig).toHaveBeenCalledWith(expect.objectContaining({
      dataId: expect.stringContaining('de-DE')
    }))
  })

  it('should resolve fallback', async () => {
    vi.spyOn(API, 'GetConfig').mockImplementation(async ({ dataId }) => {
      if (dataId.startsWith('en-US')) return { status: 200, statusText: 'OK', headers: {}, config: {} as any, data: { ok: 'OK' } } as unknown as import('axios').AxiosResponse
      return { status: 200, statusText: 'OK', headers: {}, config: {} as any, data: {} } as unknown as import('axios').AxiosResponse
    })
    
    manager = new I18nManager()
    await manager.setLocale('de-DE') // Switch to de-DE which has no messages
    
    // Force load fallback
    await manager.loadLocale('en-US')
    
    expect(manager.t('ok')).toBe('OK')
  })
  
  it('should format params (ICU)', async () => {
    vi.spyOn(API, 'GetConfig').mockResolvedValue({ status: 200, statusText: 'OK', headers: {}, config: {} as any, data: { 
        welcome: 'Hello {name}',
        items: { text: 'You have {count, plural, one {1 item} other {# items}}', fmt: 'icu' },
        date: { text: 'On {d, date}', fmt: 'icu' },
        cost: { text: 'Cost {c, currency}', fmt: 'icu' },
        num: { text: 'Val {n, number}', fmt: 'icu' }
      } } as unknown as import('axios').AxiosResponse)
    
    manager = new I18nManager()
    await new Promise(r => setTimeout(r, 10))
    
    expect(manager.t('welcome', { name: 'World' })).toBe('Hello World')
    expect(manager.t('items', { count: 1 })).toBe('You have 1 item')
    expect(manager.t('items', { count: 5 })).toBe('You have 5 items')
    expect(manager.t('date', { d: '2023' })).toContain('Date:')
    expect(manager.t('cost', { c: 100 })).toContain('$100')
    expect(manager.t('num', { n: 100 })).toBe('Val 100')
  })

  it('should handle ICU edge cases', async () => {
    vi.spyOn(API, 'GetConfig').mockResolvedValue({ status: 200, statusText: 'OK', headers: {}, config: {} as any, data: { 
        simple: { text: 'Hello {name}', fmt: 'icu' },
        unclosed: { text: 'Hello { world', fmt: 'icu' },
        hash: { text: 'Order #123', fmt: 'icu' },
        hashInOption: { text: '{c, plural, other {# items}}', fmt: 'icu' }
      } } as unknown as import('axios').AxiosResponse)
    
    manager = new I18nManager()
    await new Promise(r => setTimeout(r, 10))
    
    // Cover line 235: simple variable in ICU
    expect(manager.t('simple', { name: 'World' })).toBe('Hello World')

    // Cover lines 208-210, 262: unclosed brace
    // Must pass params to bypass optimization check
    expect(manager.t('unclosed', {})).toBe('Hello { world')

    // Cover lines 244-245: hash literal
    expect(manager.t('hash', {})).toBe('Order #123')
    
    // Verify hash works in plural (existing functionality check)
    expect(manager.t('hashInOption', { c: 5 })).toBe('5 items')
  })

  it('should format params (Simple)', async () => {
    vi.spyOn(API, 'GetConfig').mockResolvedValue({ status: 200, statusText: 'OK', headers: {}, config: {} as any, data: { 
        simple: 'Hello {name}',
        date: 'On {d, date}',
        cost: 'Cost {c, currency}',
        num: 'Val {n, number}'
      } } as unknown as import('axios').AxiosResponse)
    
    manager = new I18nManager()
    await new Promise(r => setTimeout(r, 10))
    
    expect(manager.t('simple', { name: 'World' })).toBe('Hello World')
    expect(manager.t('date', { d: '2023' })).toContain('Date:')
    expect(manager.t('cost', { c: 100 })).toContain('$100')
    expect(manager.t('num', { n: 100 })).toBe('Val 100')
    // Missing param
    expect(manager.t('simple', {})).toBe('Hello ') 
  })

  it('should format select', async () => {
    vi.spyOn(API, 'GetConfig').mockResolvedValue({ status: 200, statusText: 'OK', headers: {}, config: {} as any, data: { 
        gender: { text: '{g, select, male {He} female {She} other {They}}', fmt: 'icu' }
      } } as unknown as import('axios').AxiosResponse)
    
    manager = new I18nManager()
    await new Promise(r => setTimeout(r, 10))
    
    expect(manager.t('gender', { g: 'male' })).toBe('He')
    expect(manager.t('gender', { g: 'female' })).toBe('She')
    expect(manager.t('gender', { g: 'unknown' })).toBe('They')
  })

  describe('Bus Events and Meta', () => {
    it('should handle i18n.updated event', async () => {
      let callback: (msg: any) => void = () => {}
      vi.spyOn(bus, 'subscribe').mockImplementation((topic, cb) => {
        if (topic === 'i18n.updated') callback = cb
        return vi.fn()
      })
      vi.spyOn(API, 'GetConfig').mockResolvedValue({ status: 200, statusText: 'OK', headers: {}, config: {} as any, data: { updated: 'Value' } } as unknown as import('axios').AxiosResponse)

      manager = new I18nManager()
      
      // Trigger update for current locale
      callback({ payload: { locale: 'en-US', app: 'portal' } })
      await new Promise(r => setTimeout(r, 10))
      
      expect(API.GetConfig).toHaveBeenCalled()
      expect(manager.t('updated')).toBe('Value')
    })

    it('should handle config.updated event for current locale', async () => {
      let callback: (msg: any) => void = () => {}
      vi.spyOn(bus, 'subscribe').mockImplementation((topic, cb) => {
        if (topic === 'config.updated') callback = cb
        return vi.fn()
      })
      vi.spyOn(API, 'GetConfig').mockResolvedValue({ status: 200, statusText: 'OK', headers: {}, config: {} as any, data: { updated: 'Config' } } as unknown as import('axios').AxiosResponse)

      manager = new I18nManager()
      
      // Trigger config update for current locale file
      callback({ payload: { group: 'I18N_GROUP', dataId: 'en-US-portal.json' } })
      await new Promise(r => setTimeout(r, 10))
      
      expect(manager.t('updated')).toBe('Config')
    })
    
    it('should handle config.updated event for meta data', async () => {
      let callback: (msg: any) => void = () => {}
      vi.spyOn(bus, 'subscribe').mockImplementation((topic, cb) => {
        if (topic === 'config.updated') callback = cb
        return vi.fn()
      })
      vi.spyOn(API, 'GetConfig').mockResolvedValue({ status: 200, statusText: 'OK', headers: {}, config: {} as any, data: { 
          default: 'de-DE',
          timezone: 'Europe/Paris',
          currency: 'EUR'
        } } as unknown as import('axios').AxiosResponse)

      manager = new I18nManager()
      
      // Trigger meta update
      callback({ payload: { group: 'I18N_GROUP', dataId: 'portal.i18n.meta.json' } })
      await new Promise(r => setTimeout(r, 10))
      
      expect(bus.publish).toHaveBeenCalledWith('i18n.meta.updated', expect.objectContaining({
        default: 'de-DE',
        timezone: 'Europe/Paris'
      }))
    })

    it('should persistIfMissing', async () => {
        // Mock API.GetConfig to return meta with timezone
        vi.spyOn(API, 'GetConfig').mockResolvedValue({ status: 200, statusText: 'OK', headers: {}, config: {} as any, data: { timezone: 'UTC' } } as unknown as import('axios').AxiosResponse)
        // storage.get returns undefined by default (mocked in beforeEach)
        
        manager = new I18nManager()
        await new Promise(r => setTimeout(r, 10))
        
        expect(storage.set).toHaveBeenCalledWith('i18n.timezone', 'UTC', expect.anything())
    })
  })

  describe('Nested and Complex Keys', () => {
    it('should resolve nested keys', async () => {
        vi.spyOn(API, 'GetConfig').mockResolvedValue({ status: 200, statusText: 'OK', headers: {}, config: {} as any, data: {
                level1: {
                    level2: {
                        key: 'Found me'
                    }
                }
            } } as unknown as import('axios').AxiosResponse)
        manager = new I18nManager()
        await new Promise(r => setTimeout(r, 10))
        
        expect(manager.t('level1.level2.key')).toBe('Found me')
        expect(manager.t('level1.level2.missing')).toBe('level1.level2.missing')
        expect(manager.t('level1.missing')).toBe('level1.missing')
    })
  })

  describe('Edge branches', () => {
    it('setLocale early returns when same', async () => {
      manager = new I18nManager()
      const spy = vi.spyOn(API, 'GetConfig')
      const before = spy.mock.calls.length
      await manager.setLocale('en-US')
      const after = spy.mock.calls.length
      expect(after).toBe(before)
    })

    it('format returns text when no params', async () => {
      vi.spyOn(API, 'GetConfig').mockResolvedValue({ status: 200, statusText: 'OK', headers: {}, config: {} as any, data: { plain: 'Hello {name}', icu: { text: 'Hey {name}', fmt: 'icu' } } } as unknown as import('axios').AxiosResponse)
      manager = new I18nManager()
      await new Promise(r => setTimeout(r, 10))
      expect(manager.t('plain')).toBe('Hello {name}')
      expect(manager.t('icu')).toBe('Hey {name}')
    })

    it('ICU missing variable yields empty', async () => {
      vi.spyOn(API, 'GetConfig').mockResolvedValue({ status: 200, statusText: 'OK', headers: {}, config: {} as any, data: { simple: { text: 'Hello {name}', fmt: 'icu' } } } as unknown as import('axios').AxiosResponse)
      manager = new I18nManager()
      await new Promise(r => setTimeout(r, 10))
      expect(manager.t('simple', {})).toBe('Hello ')
    })
  })
})
