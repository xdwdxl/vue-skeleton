import { describe, it, expect, vi } from 'vitest'
import { I18nManager } from '../manager'

// Mock API to prevent network calls in constructor
vi.mock('../../api', () => ({
  API: {
    GetConfig: vi.fn().mockResolvedValue({}),
  },
}))

describe('I18n Nested ICU', () => {
  const i18n = new I18nManager()

  it('should handle nested select in plural', () => {
    // {count, plural, one {{gender, select, male {He has} female {She has} other {It has}} 1 item} other {They have # items}}
    const msg = {
      fmt: 'icu' as const,
      text: '{count, plural, one {{gender, select, male {He has} female {She has} other {It has}} 1 item} other {They have # items}}'
    }

    // Inject message
    ;(i18n as any).state.messages['en-US'] = {
      'nested_select': msg
    }

    expect(i18n.t('nested_select', { count: 1, gender: 'male' })).toBe('He has 1 item')
    expect(i18n.t('nested_select', { count: 1, gender: 'female' })).toBe('She has 1 item')
    expect(i18n.t('nested_select', { count: 2, gender: 'male' })).toBe('They have 2 items')
  })

  it('should handle nested plural in select', () => {
    // {gender, select, male {{count, plural, one {He has 1 car} other {He has # cars}}} other {They have cars}}
    const msg = {
      fmt: 'icu' as const,
      text: '{gender, select, male {{count, plural, one {He has 1 car} other {He has # cars}}} other {They have cars}}'
    };
    
    // Mock the state directly or use a way to inject messages
    (i18n as any).state.messages['en-US'] = {
        'nested_plural': msg,
        'nested_select': {
            fmt: 'icu',
            text: '{count, plural, one {{gender, select, male {He has} female {She has} other {It has}} 1 item} other {They have # items}}'
        }
    }

    expect(i18n.t('nested_plural', { count: 1, gender: 'male' })).toBe('He has 1 car')
    expect(i18n.t('nested_plural', { count: 2, gender: 'male' })).toBe('He has 2 cars')
    expect(i18n.t('nested_select', { count: 1, gender: 'female' })).toBe('She has 1 item')
  })
})
