import type { I18nInstance } from '../i18n/types'

declare module 'vue' {
  interface ComponentCustomProperties {
    $t: (key: string, params?: Record<string, unknown>) => string
    $i18n: I18nInstance
  }
}

