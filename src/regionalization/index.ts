export type WeekStart = 'mon' | 'sun' | 'sat'
export type MeasurementSystem = 'metric' | 'us' | 'uk'

export type LocaleParts = {
  baseName: string
  language: string
  territory?: string
  script?: string
  numberingSystem?: string
  calendar?: string
  hourCycle?: string
  measurementSystem?: MeasurementSystem
}

export type RegionalPreferences = {
  locale: string
  timeZone: string
  currency?: string
  weekStart?: WeekStart
  numberingSystem?: string
  measurementSystem?: MeasurementSystem
}

const DEFAULTS = {
  locale: 'en',
  timeZone: 'UTC',
  currency: 'EUR',
} as const

const UNIT_CONVERSION = {
  kmPerMile: 1.609_344,
  lbPerKg: 2.204_622_621_848_7757,
} as const

const WEEK_START_BY_TERRITORY: Readonly<Record<string, WeekStart>> = {
  US: 'sun',
  CA: 'sun',
  IL: 'sun',
  AU: 'mon',
  GB: 'mon',
  FR: 'mon',
  DE: 'mon',
  ES: 'mon',
  IT: 'mon',
  CN: 'mon',
  JP: 'mon',
  KR: 'mon',
  AE: 'sat',
  SA: 'sat',
}

const MEASUREMENT_SYSTEM_BY_TERRITORY: Readonly<Record<string, MeasurementSystem>> = {
  US: 'us',
  LR: 'us',
  MM: 'us',
  GB: 'uk',
}

export function canonicalizeLocale(locale?: string | null, fallback = DEFAULTS.locale): string {
  const raw = String(locale ?? '').trim().replace(/_/g, '-')
  if (!raw) return fallback
  try {
    const intl = Intl as unknown as { getCanonicalLocales?: (locales: string[]) => string[] }
    const fn = intl.getCanonicalLocales
    const res = typeof fn === 'function' ? fn([raw]) : [raw]
    return res?.[0] ? String(res[0]) : fallback
  } catch {
    return fallback
  }
}

type LocaleLike = {
  baseName?: string
  language?: string
  region?: string
  script?: string
  numberingSystem?: string
  calendar?: string
  hourCycle?: string
  measurementSystem?: string
}

function tryParseWithIntl(baseName: string): LocaleParts | null {
  try {
    const IntlCtor = (Intl as unknown as { Locale?: new (tag: string) => LocaleLike }).Locale
    if (typeof IntlCtor === 'function') {
      const l = new IntlCtor(baseName)
      return {
        baseName: String(l.baseName ?? baseName),
        language: String(l.language ?? ''),
        territory: l.region ? String(l.region) : undefined,
        script: l.script ? String(l.script) : undefined,
        numberingSystem: l.numberingSystem ? String(l.numberingSystem) : undefined,
        calendar: l.calendar ? String(l.calendar) : undefined,
        hourCycle: l.hourCycle ? String(l.hourCycle) : undefined,
        measurementSystem: l.measurementSystem ? (String(l.measurementSystem) as MeasurementSystem) : undefined,
      }
    }
  } catch {
    // Ignore
  }
  return null
}

function parseWithRegex(baseName: string, fallback: string): LocaleParts {
  const m = /^([a-zA-Z]{2,3})(?:[-_](?:[a-zA-Z]{4}))?(?:[-_](?:[a-zA-Z]{2}|\d{3}))?/.exec(baseName)
  const language = m ? m[1].toLowerCase() : fallback
  const territoryMatch = /[-_]([a-zA-Z]{2}|\d{3})\b/.exec(baseName)
  const territory = territoryMatch ? territoryMatch[1].toUpperCase() : undefined
  const scriptMatch = /[-_]([a-zA-Z]{4})\b/.exec(baseName)
  const script = scriptMatch ? (scriptMatch[1][0].toUpperCase() + scriptMatch[1].slice(1).toLowerCase()) : undefined
  return { baseName, language, territory, script }
}

export function parseLocaleParts(locale?: string | null, fallback = DEFAULTS.locale): LocaleParts {
  const baseName = canonicalizeLocale(locale, fallback)
  return tryParseWithIntl(baseName) || parseWithRegex(baseName, fallback)
}

export function resolveBrowserLocale(fallback = DEFAULTS.locale): string {
  try {
    const nav = typeof navigator !== 'undefined' ? navigator : undefined
    const languages = (nav as unknown as { languages?: string[] })?.languages
    const locale = Array.isArray(languages) && languages.length ? String(languages[0] || '') : String((nav as unknown as { language?: string })?.language ?? '')
    return canonicalizeLocale(locale, fallback)
  } catch {
    return fallback
  }
}

export function resolveBrowserTimeZone(fallback = DEFAULTS.timeZone): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return tz ? String(tz) : fallback
  } catch {
    return fallback
  }
}

export function resolveWeekStart(locale?: string | null): WeekStart | undefined {
  const { territory } = parseLocaleParts(locale)
  if (!territory) return undefined
  return WEEK_START_BY_TERRITORY[territory]
}

export function resolveMeasurementSystem(locale?: string | null): MeasurementSystem | undefined {
  const parts = parseLocaleParts(locale)
  if (parts.measurementSystem) return parts.measurementSystem
  if (parts.territory) return MEASUREMENT_SYSTEM_BY_TERRITORY[parts.territory] || 'metric'
  return 'metric'
}

export function normalizeTextNFC(input: string): string {
  const s = String(input ?? '')
  try {
    return typeof s.normalize === 'function' ? s.normalize('NFC') : s
  } catch {
    return s
  }
}

export function formatNumber(value: number, opts?: { locale?: string; options?: Intl.NumberFormatOptions }): string {
  const locale = canonicalizeLocale(opts?.locale ?? resolveBrowserLocale())
  const options = opts?.options || {}
  return new Intl.NumberFormat(locale, options).format(value)
}

export function getCurrencyFractionDigits(currency: string, opts?: { locale?: string }): number {
  const locale = canonicalizeLocale(opts?.locale ?? resolveBrowserLocale())
  try {
    const r = new Intl.NumberFormat(locale, { style: 'currency', currency }).resolvedOptions()
    return typeof r.maximumFractionDigits === 'number' ? r.maximumFractionDigits : 2
  } catch {
    return 2
  }
}

export function formatCurrency(
  amount: number,
  opts?: { locale?: string; currency?: string; options?: Intl.NumberFormatOptions }
): string {
  const locale = canonicalizeLocale(opts?.locale ?? resolveBrowserLocale())
  const currency = String(opts?.currency ?? DEFAULTS.currency)
  const base: Intl.NumberFormatOptions = { style: 'currency', currency }
  const merged: Intl.NumberFormatOptions = { ...base, ...(opts?.options || {}) }
  return new Intl.NumberFormat(locale, merged).format(amount)
}

export function formatDateTime(
  value: Date | number | string,
  opts?: { locale?: string; timeZone?: string; options?: Intl.DateTimeFormatOptions }
): string {
  const locale = canonicalizeLocale(opts?.locale ?? resolveBrowserLocale())
  const timeZone = String(opts?.timeZone ?? resolveBrowserTimeZone())
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat(locale, { timeZone, ...(opts?.options || {}) }).format(date)
}

export function formatUnit(
  value: number,
  unit: string,
  opts?: { locale?: string; unitDisplay?: Intl.NumberFormatOptions['unitDisplay']; options?: Intl.NumberFormatOptions }
): string {
  const locale = canonicalizeLocale(opts?.locale ?? resolveBrowserLocale())
  const merged: Intl.NumberFormatOptions = {
    style: 'unit',
    unit,
    unitDisplay: opts?.unitDisplay ?? 'short',
    ...(opts?.options || {}),
  }
  return new Intl.NumberFormat(locale, merged).format(value)
}

export function compareByLocale(
  a: string,
  b: string,
  opts?: { locale?: string; options?: Intl.CollatorOptions }
): number {
  const locale = canonicalizeLocale(opts?.locale ?? resolveBrowserLocale())
  const collator = new Intl.Collator(locale, { sensitivity: 'base', ...(opts?.options || {}) })
  return collator.compare(a, b)
}

export function getPluralCategory(
  value: number,
  opts?: { locale?: string; type?: Intl.PluralRulesOptions['type'] }
): string {
  const locale = canonicalizeLocale(opts?.locale ?? resolveBrowserLocale())
  const type = opts?.type ?? 'cardinal'
  return new Intl.PluralRules(locale, { type }).select(value)
}

export function kmToMiles(km: number): number {
  return km / UNIT_CONVERSION.kmPerMile
}

export function milesToKm(miles: number): number {
  return miles * UNIT_CONVERSION.kmPerMile
}

export function kgToLb(kg: number): number {
  return kg * UNIT_CONVERSION.lbPerKg
}

export function lbToKg(lb: number): number {
  return lb / UNIT_CONVERSION.lbPerKg
}

export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32
}

export function fahrenheitToCelsius(fahrenheit: number): number {
  return ((fahrenheit - 32) * 5) / 9
}

export function resolveRegionalPreferences(input?: Partial<RegionalPreferences>): RegionalPreferences {
  const locale = canonicalizeLocale(input?.locale ?? resolveBrowserLocale())
  const timeZone = String(input?.timeZone ?? resolveBrowserTimeZone())
  const numberingSystem = input?.numberingSystem ?? parseLocaleParts(locale).numberingSystem
  const measurementSystem = input?.measurementSystem ?? resolveMeasurementSystem(locale)
  const weekStart = input?.weekStart ?? resolveWeekStart(locale)
  const currency = input?.currency
  return { locale, timeZone, currency, numberingSystem, measurementSystem, weekStart }
}
