import { describe, it, expect, vi, afterEach } from 'vitest'
import * as Region from '../index'

describe('Regionalization', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('canonicalizeLocale', () => {
    it('should canonicalize valid locale', () => {
      expect(Region.canonicalizeLocale('EN-US')).toBe('en-US')
      expect(Region.canonicalizeLocale('zh_cn')).toBe('zh-CN')
    })
    
    it('should handle invalid locale', () => {
      expect(Region.canonicalizeLocale('')).toBe('en')
      expect(Region.canonicalizeLocale('invalid-really')).toBe('invalid-really')
      
      // Force error
      vi.spyOn(Intl as any, 'getCanonicalLocales').mockImplementation(() => { throw new Error() })
      expect(Region.canonicalizeLocale('en-US')).toBe('en')
    })
  })

  describe('parseLocaleParts', () => {
    it('should parse standard locale', () => {
      const parts = Region.parseLocaleParts('en-US')
      expect(parts.language).toBe('en')
      expect(parts.territory).toBe('US')
    })

    it('should parse complex locale', () => {
      const parts = Region.parseLocaleParts('zh-Hans-CN')
      expect(parts.language).toBe('zh')
      expect(parts.script).toBe('Hans')
      expect(parts.territory).toBe('CN')
    })
    
    it('should fallback to regex if Intl.Locale fails or missing', () => {
      const OriginalLocale = Intl.Locale
      ;(Intl as any).Locale = undefined
      
      const parts = Region.parseLocaleParts('zh_Hans_CN')
      expect(parts.language).toBe('zh')
      expect(parts.script).toBe('Hans')
      expect(parts.territory).toBe('CN')
      
      ;(Intl as any).Locale = OriginalLocale
    })
  })

  describe('resolveBrowserLocale', () => {
    it('should use navigator.languages', () => {
      vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-CA', 'en-US'])
      expect(Region.resolveBrowserLocale()).toBe('fr-CA')
    })
    
    it('should fallback to navigator.language', () => {
      vi.spyOn(navigator, 'languages', 'get').mockReturnValue([])
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('de-DE')
      expect(Region.resolveBrowserLocale()).toBe('de-DE')
    })

    it('should fallback on error', () => {
        vi.spyOn(navigator, 'languages', 'get').mockImplementation(() => { throw new Error() })
        expect(Region.resolveBrowserLocale('default' as any)).toBe('default')
    })
  })

  describe('resolveBrowserTimeZone', () => {
      it('should return tz', () => {
          // JSDOM usually returns UTC or system tz
          expect(Region.resolveBrowserTimeZone()).toBeDefined()
      })
      it('should fallback on error', () => {
          vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => { throw new Error() })
          expect(Region.resolveBrowserTimeZone('UTC')).toBe('UTC')
      })
  })

  describe('resolveWeekStart', () => {
    it('should return sun for US', () => {
      expect(Region.resolveWeekStart('en-US')).toBe('sun')
    })
    it('should return mon for CN', () => {
      expect(Region.resolveWeekStart('zh-CN')).toBe('mon')
    })
    it('should return undefined for unknown', () => {
      expect(Region.resolveWeekStart('xx-XX')).toBeUndefined()
    })
  })

  describe('resolveMeasurementSystem', () => {
    it('should return us for US', () => {
      expect(Region.resolveMeasurementSystem('en-US')).toBe('us')
    })
    it('should return metric for others', () => {
      expect(Region.resolveMeasurementSystem('zh-CN')).toBe('metric')
    })
    it('should fallback to metric', () => {
        expect(Region.resolveMeasurementSystem('xx-XX')).toBe('metric')
    })
    it('should return metric for locale without territory', () => {
      expect(Region.resolveMeasurementSystem('en')).toBe('metric')
    })
  })

  describe('Formatting', () => {
    it('formatNumber', () => {
      expect(Region.formatNumber(1234.56, { locale: 'en-US' })).toBe('1,234.56')
      expect(Region.formatNumber(1234.56, { locale: 'de-DE' })).toBe('1.234,56')
    })

    it('formatCurrency', () => {
      expect(Region.formatCurrency(123.45, { locale: 'en-US', currency: 'USD' })).toBe('$123.45')
      expect(Region.formatCurrency(123.45, { locale: 'ja-JP', currency: 'JPY' })).toBe('￥123')
    })

    it('getCurrencyFractionDigits', () => {
      expect(Region.getCurrencyFractionDigits('USD')).toBe(2)
      expect(Region.getCurrencyFractionDigits('JPY')).toBe(0)
      
      // Error path
      vi.spyOn(Intl, 'NumberFormat').mockImplementation(() => { throw new Error() })
      expect(Region.getCurrencyFractionDigits('USD')).toBe(2)
    })

    it('formatDateTime', () => {
      const date = new Date('2023-01-01T12:00:00Z')
      const str = Region.formatDateTime(date, { locale: 'en-US', timeZone: 'UTC' })
      expect(str).toContain('1/1/2023')
    })
    
    it('formatUnit', () => {
       expect(Region.formatUnit(10, 'kilometer', { locale: 'en-US' })).toBe('10 km')
    })
    
    it('getPluralCategory', () => {
      expect(Region.getPluralCategory(1, { locale: 'en-US' })).toBe('one')
      expect(Region.getPluralCategory(0, { locale: 'en-US' })).toBe('other')
      const cat = Region.getPluralCategory(1, { locale: 'zh-CN' })
      expect(['other', 'one']).toContain(cat)
    })
    
    it('normalizeTextNFC', () => {
      expect(Region.normalizeTextNFC('\u00F1')).toBe('ñ')
      expect(Region.normalizeTextNFC('\u006E\u0303')).toBe('ñ')
      
      // Error path
      const originalNormalize = String.prototype.normalize
      String.prototype.normalize = () => { throw new Error() }
      expect(Region.normalizeTextNFC('foo')).toBe('foo')
      String.prototype.normalize = originalNormalize
    })
    
    it('compareByLocale', () => {
      expect(Region.compareByLocale('a', 'b', { locale: 'en' })).toBe(-1)
      expect(Region.compareByLocale('b', 'a', { locale: 'en' })).toBe(1)
    })
  })

  describe('Unit Conversions', () => {
    it('kmToMiles', () => expect(Region.kmToMiles(1.609344)).toBeCloseTo(1))
    it('milesToKm', () => expect(Region.milesToKm(1)).toBeCloseTo(1.609344))
    it('kgToLb', () => expect(Region.kgToLb(1)).toBeCloseTo(2.20462))
    it('lbToKg', () => expect(Region.lbToKg(2.2046226)).toBeCloseTo(1))
    it('celsiusToFahrenheit', () => expect(Region.celsiusToFahrenheit(0)).toBe(32))
    it('fahrenheitToCelsius', () => expect(Region.fahrenheitToCelsius(32)).toBe(0))
  })

  describe('resolveRegionalPreferences', () => {
    it('should resolve all fields', () => {
      const prefs = Region.resolveRegionalPreferences({ locale: 'en-US' })
      expect(prefs.locale).toBe('en-US')
      expect(prefs.weekStart).toBe('sun')
      expect(prefs.measurementSystem).toBe('us')
    })
    
    it('should respect overrides', () => {
      const prefs = Region.resolveRegionalPreferences({ locale: 'en-US', weekStart: 'mon' })
      expect(prefs.weekStart).toBe('mon')
    })
  })
})
