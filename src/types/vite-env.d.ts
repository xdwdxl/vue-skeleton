/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_API_TIMEOUT?: string
  readonly VITE_APP_ID?: string
  readonly VITE_APP_VERSION?: string
  readonly VITE_AUTH_REFRESH_URL?: string
  readonly VITE_AUTH_REFRESH_WITH_COOKIE?: string
  readonly VITE_HTTP_METRICS_GROUP?: string
  readonly VITE_HTTP_METRICS_DATA_ID?: string
  readonly VITE_HTTP_METRICS_SAMPLING?: string
  readonly VITE_HTTP_METRICS_SLOW_MS?: string
  readonly VITE_HTTP_METRICS_BURST?: string
  readonly VITE_STORAGE_CHANNEL?: string
  readonly VITE_STORAGE_POLICY_DATA_ID?: string
  readonly VITE_STORAGE_POLICY_GROUP?: string
  readonly VITE_BUS_CHANNEL?: string
  readonly VITE_ERROR_I18N_GROUP?: string
  readonly VITE_ERROR_I18N_MAP_DATA_ID?: string
  readonly VITE_ERROR_I18N_BUNDLE_TEMPLATE?: string
  readonly VITE_AUDIT_ENDPOINT?: string
  readonly VITE_AUDIT_BATCH_SIZE?: string
  readonly VITE_AUDIT_FLUSH_INTERVAL_MS?: string
  readonly VITE_AUDIT_MAX_QUEUE_SIZE?: string
  readonly VITE_AUDIT_QUEUE_TTL_MS?: string
  readonly MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

