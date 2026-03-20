import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ThemeManager from '../index'
import { API } from '../../api'
import bus from '../../bus'

describe('ThemeManager', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(API, 'GetConfig').mockResolvedValue({ status: 200, statusText: 'OK', headers: {}, config: {} as any, data: {} } as unknown as import('axios').AxiosResponse)
    vi.spyOn(bus, 'subscribe').mockImplementation(() => vi.fn())
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('should be singleton', () => {
    expect(ThemeManager).toBeDefined()
  })

  it('should apply theme config', () => {
    const config = {
      color: {
        primary: 'red',
        'text-primary': 'black'
      },
      font: {
        'size-base': '14px'
      },
      radius: {
        base: '4px',
        sm: '2px'
      },
      shadow: {
        base: '0 2px 4px rgba(0,0,0,0.1)'
      }
    }

    ThemeManager.applyTheme(config)
    
    const root = document.documentElement.style
    expect(root.getPropertyValue('--color-primary')).toBe('red')
    expect(root.getPropertyValue('--el-color-primary')).toBe('red')
    
    expect(root.getPropertyValue('--color-text-primary')).toBe('black')
    expect(root.getPropertyValue('--el-text-color-primary')).toBe('black')
    
    expect(root.getPropertyValue('--font-size-base')).toBe('14px')
    expect(root.getPropertyValue('--el-font-size-base')).toBe('14px')
    
    expect(root.getPropertyValue('--radius-base')).toBe('4px')
    expect(root.getPropertyValue('--el-border-radius-base')).toBe('4px')
    
    expect(root.getPropertyValue('--radius-sm')).toBe('2px')
    expect(root.getPropertyValue('--el-border-radius-small')).toBe('2px')
    
    expect(root.getPropertyValue('--shadow-base')).toBe('0 2px 4px rgba(0,0,0,0.1)')
    expect(root.getPropertyValue('--el-box-shadow')).toBe('0 2px 4px rgba(0,0,0,0.1)')
  })
  
  it('should handle complex keys mapping', () => {
      const config = {
          color: {
              'border-base': '#ccc',
              'fill-base': '#f0f0f0'
          },
          size: {
              base: '100px',
              sm: '50px',
              lg: '200px'
          }
      }
      
      ThemeManager.applyTheme(config)
      const root = document.documentElement.style
      
      expect(root.getPropertyValue('--el-border-color')).toBe('#ccc')
      expect(root.getPropertyValue('--el-fill-color')).toBe('#f0f0f0')
      expect(root.getPropertyValue('--el-component-size')).toBe('100px')
      expect(root.getPropertyValue('--el-component-size-small')).toBe('50px')
      expect(root.getPropertyValue('--el-component-size-large')).toBe('200px')
  })

  it('should fetch and apply theme', async () => {
    vi.spyOn(API, 'GetConfig').mockResolvedValue({ status: 200, statusText: 'OK', headers: {}, config: {} as any, data: { color: { primary: 'blue' } } } as unknown as import('axios').AxiosResponse)
    
    await ThemeManager.fetchAndApplyTheme()
    
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('blue')
  })

  it('should fallback to default on error', async () => {
    vi.spyOn(API, 'GetConfig').mockRejectedValue(new Error('Fail'))
    
    await ThemeManager.fetchAndApplyTheme()
    
    expect(console.warn).toHaveBeenCalled()
    // Default primary is #428bca
    expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#428bca')
  })

  it('should handle config.updated event', async () => {
    vi.resetModules()
    
    let callback: (msg: any) => void = () => {}
    const busMock = await import('../../bus')
    vi.spyOn(busMock.default, 'subscribe').mockImplementation((topic, cb) => {
      if (topic === 'config.updated') callback = cb
      return vi.fn()
    })
    
    const apiMock = await import('../../api')
    vi.spyOn(apiMock.API, 'GetConfig').mockResolvedValue({ status: 200, statusText: 'OK', headers: {}, config: {} as any, data: {} } as unknown as import('axios').AxiosResponse)
    
    // Re-import to trigger init
    await import('../index')
    
    // Trigger callback
    callback({ payload: { dataId: 'portal-theme.json', group: 'PORTAL_GROUP' } })
    
    expect(apiMock.API.GetConfig).toHaveBeenCalled()
  })

  it('should handle unknown keys gracefully', () => {
    const tm = ThemeManager
    tm.applyTheme({
        other: {
            'unknown-key': 'val',
            'color-background-custom': 'val'
        }
    })
    const root = document.documentElement.style
    expect(root.getPropertyValue('--other-unknown-key')).toBe('val')
  })
  

})
