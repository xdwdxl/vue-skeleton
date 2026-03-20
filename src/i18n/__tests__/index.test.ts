import { describe, it, expect } from 'vitest'
import * as I18n from '../index'

describe('I18n Index', () => {
  it('should export all required members', () => {
    expect(I18n.I18nManager).toBeDefined()
    expect(I18n.I18nPlugin).toBeDefined()
    expect(I18n.useI18n).toBeDefined()
  })
})
