import type { FormKitValidationRule } from '@formkit/validation'
import { defaultConfig } from '@formkit/vue'

type RuleCtx = { name?: string; args?: Array<unknown>; value?: unknown }

function valToString(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return ''
}

export const phoneCN: FormKitValidationRule = ({ value }: RuleCtx) => {
  const v = valToString(value).trim()
  return /^1[3-9]\d{9}$/.test(v)
}

export const noEmoji: FormKitValidationRule = ({ value }: RuleCtx) => {
  const v = valToString(value)
  return !/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(v)
}

export const safeString: FormKitValidationRule = ({ value }: RuleCtx) => {
  const v = valToString(value)
  if (!v) return true
  if (/[<>]/.test(v)) return false
  if (/javascript:/i.test(v)) return false
  return true
}

export const strongPassword: FormKitValidationRule = ({ value }: RuleCtx) => {
  const v = valToString(value)
  if (v.length < 8) return false
  const hasUpper = /[A-Z]/.test(v)
  const hasLower = /[a-z]/.test(v)
  const hasNumber = /\d/.test(v)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_\-+=~[\]\\;'/]/.test(v)
  return hasUpper && hasLower && hasNumber && hasSpecial
}

export const idCardCN: FormKitValidationRule = ({ value }: RuleCtx) => {
  const v = valToString(value).toUpperCase()
  return /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[0-9X]$/.test(v)
}

export const messages = {
  en: {
    ui: {
      submit: 'Submit',
      reset: 'Reset',
    },
    validation: {
      required: ({ name }: RuleCtx) => `Please fill out the ${name} field.`,
      email: ({ name }: RuleCtx) => `Enter a valid email for ${name}.`,
      url: ({ name }: RuleCtx) => `Enter a valid URL for ${name}.`,
      min: ({ name, args }: RuleCtx) => `${name} must be at least ${args?.[0]} characters.`,
      max: ({ name, args }: RuleCtx) => `${name} must be at most ${args?.[0]} characters.`,
      length: ({ name, args }: RuleCtx) => `${name} length must be ${args?.[0]} characters.`,
      phoneCN: ({ name }: RuleCtx) => `Enter a valid mainland China phone number for ${name}.`,
      noEmoji: ({ name }: RuleCtx) => `${name} must not contain emoji.`,
      safeString: ({ name }: RuleCtx) => `${name} contains unsafe characters.`,
      strongPassword: () => 'Password must include upper/lowercase, number and special character, 8+ length.',
      idCardCN: ({ name }: RuleCtx) => `Enter a valid Chinese ID number for ${name}.`,
    },
  },
  de: {
    ui: {
      submit: 'Absenden',
      reset: 'Zurücksetzen',
    },
    validation: {
      required: ({ name }: RuleCtx) => `Bitte das Feld ${name} ausfüllen.`,
      email: ({ name }: RuleCtx) => `Bitte eine gültige E-Mail für ${name} eingeben.`,
      url: ({ name }: RuleCtx) => `Bitte eine gültige URL für ${name} eingeben.`,
      min: ({ name, args }: RuleCtx) => `${name} muss mindestens ${args?.[0]} Zeichen lang sein.`,
      max: ({ name, args }: RuleCtx) => `${name} darf höchstens ${args?.[0]} Zeichen lang sein.`,
      length: ({ name, args }: RuleCtx) => `${name} muss genau ${args?.[0]} Zeichen lang sein.`,
      phoneCN: ({ name }: RuleCtx) => `Bitte eine gültige chinesische Mobilnummer für ${name} eingeben.`,
      noEmoji: ({ name }: RuleCtx) => `${name} darf keine Emojis enthalten.`,
      safeString: ({ name }: RuleCtx) => `${name} enthält unsichere Zeichen.`,
      strongPassword: () => 'Passwort muss Groß-/Kleinbuchstaben, Zahl und Sonderzeichen enthalten (mind. 8 Zeichen).',
      idCardCN: ({ name }: RuleCtx) => `Bitte eine gültige chinesische Ausweisnummer für ${name} eingeben.`,
    },
  },
}

export function getFormKitConfig() {
  return defaultConfig({
    rules: {
      phoneCN,
      noEmoji,
      safeString,
      strongPassword,
      idCardCN,
    },
    messages,
    locale: 'en',
    config: {
      classes: {
        input: 'fk-input',
        label: 'fk-label',
        help: 'fk-help',
        message: 'fk-message',
      },
    },
  })
}
