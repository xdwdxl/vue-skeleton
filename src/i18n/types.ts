/**
 * I18n types
 * @author Lorin Luo
 */

export type I18nParams = Record<string, unknown>

export type I18nMessageObject = {
  text: string
  fmt?: 'plain' | 'icu'
  [key: string]: unknown
}

export type I18nMessageTree = string | I18nMessageObject | { [key: string]: I18nMessageTree }

export type I18nMessages = Record<string, I18nMessageTree>

export interface I18nOptions {
  locale?: string
  fallbackLocale?: string
  appId?: string
  group?: string
  storageKey?: string
  supportedLocales?: string[]
  loadMessages?: (locale: string, appId: string) => Promise<I18nMessages | undefined>
  initialMessages?: Record<string, I18nMessages>
}

export interface I18nState {
  locale: string
  messages: Record<string, I18nMessages>
}

export interface I18nInstance {
  locale: string
  readonly t: (key: string, params?: I18nParams) => string
  setLocale: (locale: string) => Promise<void>
  getLocale: () => string
  loadLocale: (locale: string) => Promise<void>
}
