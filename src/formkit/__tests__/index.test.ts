import { describe, it, expect } from 'vitest'
import { getFormKitConfig, phoneCN, noEmoji, safeString, strongPassword, idCardCN, messages } from '../index'

describe('FormKit Config', () => {
  it('should return config object', () => {
    const config = getFormKitConfig()
    expect(config).toBeDefined()
    expect(config).toBeTruthy()
    // Verify default locale and classes (indirectly if possible, or just execution)
    // Since defaultConfig wraps it, we can't easily access the inner config structure without deeper inspection
    // but running it covers the code path.
  })

  describe('Validation Rules', () => {
    it('phoneCN', () => {
      const rule = phoneCN as any
      expect(rule({ value: '13800138000' })).toBe(true)
      expect(rule({ value: '12800138000' })).toBe(false) // 2nd digit 3-9
      expect(rule({ value: '1380013800' })).toBe(false) // length 10
      expect(rule({ value: '138001380000' })).toBe(false) // length 12
      expect(rule({ value: 'abc' })).toBe(false)
      expect(rule({ value: null })).toBe(false)
    })

    it('noEmoji', () => {
      const rule = noEmoji as any
      expect(rule({ value: 'hello' })).toBe(true)
      expect(rule({ value: '😊' })).toBe(false)
      expect(rule({ value: 'hello 😊' })).toBe(false)
      expect(rule({ value: undefined })).toBe(true)
    })

    it('safeString', () => {
      const rule = safeString as any
      expect(rule({ value: 'hello' })).toBe(true)
      expect(rule({ value: '<script>' })).toBe(false)
      expect(rule({ value: 'javascript:alert(1)' })).toBe(false)
      expect(rule({ value: '' })).toBe(true)
      expect(rule({ value: null })).toBe(true)
    })

    it('strongPassword', () => {
      const rule = strongPassword as any
      expect(rule({ value: 'Abc@1234' })).toBe(true)
      expect(rule({ value: 'abc@1234' })).toBe(false) // no upper
      expect(rule({ value: 'ABC@1234' })).toBe(false) // no lower
      expect(rule({ value: 'Abcdefgh' })).toBe(false) // no number/special
      expect(rule({ value: 'Abc@defg' })).toBe(false) // no number
      expect(rule({ value: 'Abc12345' })).toBe(false) // no special
      expect(rule({ value: 'Abc@1' })).toBe(false) // too short
      expect(rule({ value: '' })).toBe(false)
    })

    it('idCardCN', () => {
      const rule = idCardCN as any
      // Valid ID format (checksum not verified by regex, just format)
      expect(rule({ value: '110101199003071234' })).toBe(true)
      expect(rule({ value: '11010119900307123X' })).toBe(true)
      expect(rule({ value: '11010119900307123' })).toBe(false) // length 17
      expect(rule({ value: null })).toBe(false)
    })
    it('should handle non-string/number values safely', () => {
      const rules = [phoneCN, noEmoji, safeString, strongPassword, idCardCN]
      const objectValue = { value: { toString: () => 'valid' } } // Even if it has toString, we ignore it
      
      // All rules should handle object input without throwing or weird stringification
      // phoneCN: '' -> false
      expect((phoneCN as any)(objectValue)).toBe(false)
      // noEmoji: '' -> true (no emoji found)
      expect((noEmoji as any)(objectValue)).toBe(true)
      // safeString: '' -> true (safe)
      expect((safeString as any)(objectValue)).toBe(true)
      // strongPassword: '' -> false (too short)
      expect((strongPassword as any)(objectValue)).toBe(false)
      // idCardCN: '' -> false
      expect((idCardCN as any)(objectValue)).toBe(false)
    })
  })

  describe('Messages', () => {
    const msgs = messages
    const ctx = { name: 'Field', args: [5] }
    
    it('should have en/de messages', () => {
      expect(msgs.en).toBeDefined()
      expect(msgs.de).toBeDefined()
    })

    it('should generate all English messages', () => {
       const en = msgs.en.validation
       expect(en.required(ctx)).toContain('Field')
       expect(en.email(ctx)).toContain('email')
       expect(en.url(ctx)).toContain('URL')
       expect(en.min(ctx)).toContain('5')
       expect(en.max(ctx)).toContain('5')
       expect(en.length(ctx)).toContain('5')
       expect(en.phoneCN(ctx)).toContain('China')
       expect(en.noEmoji(ctx)).toContain('emoji')
       expect(en.safeString(ctx)).toContain('unsafe')
       expect(en.strongPassword()).toContain('Password')
       expect(en.idCardCN(ctx)).toContain('ID')
    })

    it('should generate all German messages', () => {
       const de = msgs.de.validation
       expect(de.required(ctx)).toContain('Field')
       expect(de.email(ctx)).toContain('E-Mail')
       expect(de.url(ctx)).toContain('URL')
       expect(de.min(ctx)).toContain('5')
       expect(de.max(ctx)).toContain('5')
       expect(de.length(ctx)).toContain('5')
       expect(de.phoneCN(ctx)).toContain('Mobil')
       expect(de.noEmoji(ctx)).toContain('Emoji')
       expect(de.safeString(ctx)).toContain('unsicher')
       expect(de.strongPassword()).toContain('Passwort')
       expect(de.idCardCN(ctx)).toContain('Ausweis')
    })
  })
})
