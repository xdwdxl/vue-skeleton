/**
 * Theme Manager
 * @author Lorin Luo
 * @description Manages global styles and dynamic theme updates via Nacos
 */
import bus from '../bus'
import { API } from '../api'
import { storage } from '../storage/singleton'

export type ThemeMode = 'skinLight' | 'skinDark'

export interface ThemeConfig {
  color?: Record<string, string>
  font?: Record<string, string>
  spacing?: Record<string, string>
  radius?: Record<string, string>
  shadow?: Record<string, string>
  [key: string]: unknown
}

class ThemeManager {
  private static instance: ThemeManager
  private readonly THEME_DATA_ID = 'portal-theme.json'
  private readonly THEME_GROUP = 'PORTAL_GROUP'
  private readonly THEME_MODE_KEY = 'theme.mode'
  private currentThemeMode: ThemeMode = 'skinLight'

  private constructor() {
    this.init()
  }

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager()
    }
    return ThemeManager.instance
  }

  private init() {
    // Load theme mode from storage
    this.loadThemeMode()
    
    // Apply theme mode class to document
    this.applyThemeModeClass()

    // Subscribe to config updates
    bus.subscribe('config.updated', (msg) => {
      const payload = msg.payload as Record<string, unknown>
      const dataId = typeof payload?.dataId === 'string' ? payload.dataId : undefined
      const group = typeof payload?.group === 'string' ? payload.group : undefined
      if (dataId === this.THEME_DATA_ID && group === this.THEME_GROUP) {
        this.fetchAndApplyTheme()
      }
    })

    // Initial fetch
    this.fetchAndApplyTheme()
  }

  private loadThemeMode() {
    try {
      const savedMode = storage.get(this.THEME_MODE_KEY) as ThemeMode
      if (savedMode === 'skinLight' || savedMode === 'skinDark') {
        this.currentThemeMode = savedMode
      }
    } catch (e) {
      console.warn('[ThemeManager] Failed to load theme mode:', e)
    }
  }

  private saveThemeMode(mode: ThemeMode) {
    try {
      storage.set(this.THEME_MODE_KEY, mode)
    } catch (e) {
      console.warn('[ThemeManager] Failed to save theme mode:', e)
    }
  }

  private applyThemeModeClass() {
    const root = document.documentElement
    root.classList.remove('theme-skinLight', 'theme-skinDark')
    root.classList.add(`theme-${this.currentThemeMode}`)
  }

  public async fetchAndApplyTheme() {
    try {
      const res = await API.GetConfig({ dataId: this.THEME_DATA_ID, group: this.THEME_GROUP })
      const themeConfig = res?.data as ThemeConfig | undefined
      if (themeConfig) this.applyTheme(themeConfig)
    } catch (e) {
      console.warn('[ThemeManager] Failed to fetch theme, using default:', e)
      // Fallback to default theme if config is missing
      this.applyTheme({
        color: {
          primary: 'var(--color-primary)',
          success: '#67C23A',
          warning: '#E6A23C',
          danger: '#F56C6C',
          info: '#909399',
          white: '#ffffff',
          black: '#000000',
        },
      })
    }
  }

  public applyTheme(config: ThemeConfig) {
    const root = document.documentElement
    const vars = this.flattenConfig(config)
    
    Object.entries(vars).forEach(([key, value]) => {
      // 1. Set the base variable (e.g. --color-primary)
      root.style.setProperty(`--${key}`, value)
      
      // 2. Auto-map to Element Plus variables
      this.mapToElementPlus(root, key, value)
    })
    
    console.log('[ThemeManager] Theme applied', Object.keys(vars).length, 'variables')
  }

  private mapToElementPlus(root: HTMLElement, key: string, value: string) {
    const elKey = this.getElKey(key)
    if (elKey) {
      root.style.setProperty(`--${elKey}`, value)
    }
  }

  private getElKey(key: string): string {
    if (key.startsWith('color-')) return this.getColorKey(key)
    if (key.startsWith('font-size-')) return key.replace('font-size-', 'el-font-size-')
    if (key.startsWith('radius-')) return this.getRadiusKey(key)
    if (key.startsWith('shadow-')) return this.getShadowKey(key)
    if (key.startsWith('size-')) return this.getSizeKey(key)
    return ''
  }

  private getColorKey(key: string): string {
    if (key.startsWith('color-text-')) return key.replace('color-text-', 'el-text-color-')
    if (key.startsWith('color-border-')) return this.getSuffixKey(key, 'color-border-', 'el-border-color')
    if (key.startsWith('color-fill-')) return this.getSuffixKey(key, 'color-fill-', 'el-fill-color')
    if (!key.includes('-text-') && !key.includes('-border-') && !key.includes('-fill-') && !key.includes('-background-')) {
      return key.replace('color-', 'el-color-')
    }
    return ''
  }

  private getRadiusKey(key: string): string {
    const suffix = key.replace('radius-', '')
    return suffix === 'sm' ? 'el-border-radius-small' : `el-border-radius-${suffix}`
  }

  private getShadowKey(key: string): string {
    return this.getSuffixKey(key, 'shadow-', 'el-box-shadow')
  }

  private getSizeKey(key: string): string {
    const suffix = key.replace('size-', '')
    if (suffix === 'sm') return 'el-component-size-small'
    if (suffix === 'lg') return 'el-component-size-large'
    return 'el-component-size'
  }

  private getSuffixKey(key: string, prefix: string, targetBase: string): string {
    const suffix = key.replace(prefix, '')
    return suffix === 'base' ? targetBase : `${targetBase}-${suffix}`
  }

  private flattenConfig(config: object, prefix = '', result: Record<string, string> = {}): Record<string, string> {
    for (const [key, value] of Object.entries(config)) {
      const newKey = prefix ? `${prefix}-${key}` : key
      if (typeof value === 'object' && value !== null) {
        this.flattenConfig(value, newKey, result)
      } else {
        result[newKey] = String(value)
      }
    }
    return result
  }

  /**
   * Get current theme mode
   */
  public getThemeMode(): ThemeMode {
    return this.currentThemeMode
  }

  /**
   * Toggle between skinLight and skinDark theme
   */
  public toggleThemeMode(): ThemeMode {
    const newMode = this.currentThemeMode === 'skinLight' ? 'skinDark' : 'skinLight'
    this.setThemeMode(newMode)
    return newMode
  }

  /**
   * Set theme mode
   * @param mode - Theme mode to set
   */
  public setThemeMode(mode: ThemeMode): void {
    this.currentThemeMode = mode
    this.saveThemeMode(mode)
    this.applyThemeModeClass()
    
    // Emit theme change event
    bus.publish('theme.changed', { mode })
    
    console.log('[ThemeManager] Theme mode changed to:', mode)
  }
}

export default ThemeManager.getInstance()
