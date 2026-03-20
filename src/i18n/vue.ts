/**
 * Vue Plugin for I18n
 * @author Lorin Luo
 */

import type { App, Plugin } from 'vue'
import { I18nManager } from './manager'
import type { I18nOptions, I18nInstance } from './types'

function resolveScopedI18n(thisArg: unknown, fallback: I18nInstance): I18nInstance {
  try {
    const internal = (thisArg as { $?: { provides?: Record<string, unknown> } } | null | undefined)?.$
    const scoped = internal?.provides?.i18n as I18nInstance | undefined
    if (scoped && typeof scoped.t === 'function') return scoped
  } catch {}
  return fallback
}

export const I18nPlugin: Plugin = {
  install(app: App, options?: I18nOptions) {
    const i18n = new I18nManager(options)

    app.config.globalProperties.$t = function (key: string, params?: Record<string, unknown>) {
      return resolveScopedI18n(this, i18n).t(key, params)
    }
    app.config.globalProperties.$i18n = i18n

    app.provide('i18n', i18n)
  },
}

// Composition API helper
import { inject } from 'vue'

export function useI18n(): I18nInstance {
  const i18n = inject<I18nInstance | null>('i18n', null)
  if (!i18n) {
    throw new Error('I18n not provided! Ensure I18nPlugin is installed.')
  }
  return i18n
}
