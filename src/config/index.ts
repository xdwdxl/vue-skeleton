/**
 * Runtime config for Portal
 * @author Lorin Luo
 * @description Provides API baseURL and timeout from runtime config / env vars
 */
import flags from './config.js'

export default {
  ...flags,
  api: {
    baseURL: (globalThis as any)?.window?.__PORTAL_RUNTIME__?.portal?.api?.baseURL ?? import.meta.env.VITE_API_BASE_URL ?? '/api',
    timeout: Number((globalThis as any)?.window?.__PORTAL_RUNTIME__?.portal?.api?.timeout ?? import.meta.env.VITE_API_TIMEOUT) || 10000,
  },
}
