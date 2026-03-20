import { describe, it, expect, vi, beforeEach } from 'vitest'
import { I18nPlugin, useI18n } from '../vue'
import { inject } from 'vue'

// Mock inject
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    inject: vi.fn(),
    provide: vi.fn()
  }
})

// Mock API to prevent network calls during plugin install (which inits manager)
vi.mock('../../api', () => ({
  API: {
    GetConfig: vi.fn().mockResolvedValue({ status: 200, statusText: 'OK', headers: {}, config: {} as any, data: {} } as unknown as import('axios').AxiosResponse)
  }
}))

describe('I18n Plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should install plugin', () => {
    const app = {
      config: {
        globalProperties: {}
      },
      provide: vi.fn()
    }
    
    // @ts-expect-error mock
    I18nPlugin.install(app, {})
    
    expect((app.config.globalProperties as any).$t).toBeDefined()
    expect((app.config.globalProperties as any).$i18n).toBeDefined()
    expect(app.provide).toHaveBeenCalledWith('i18n', expect.any(Object))
  })

  it('should useI18n', () => {
    const mockI18n = { t: vi.fn() }
    // @ts-expect-error mock
    inject.mockReturnValue(mockI18n)
    
    const i18n = useI18n()
    expect(i18n).toBe(mockI18n)
  })

  it('should throw if i18n not provided', () => {
    // @ts-expect-error mock
    inject.mockReturnValue(undefined)
    
    expect(() => useI18n()).toThrow('I18n not provided')
  })
})
