export type AuditOperator = {
  type: 'user' | 'guest' | 'system'
  id?: string
  roles?: string[]
}

export type AuditEvent = {
  event_id: string
  timestamp: number
  service?: string
  env?: string
  action_code: string
  action_i18n_key?: string
  object_type?: string
  object_id?: string
  object_i18n_key?: string
  result_code?: string
  result_i18n_key?: string
  params?: Record<string, unknown>
  operator?: AuditOperator
  visitor_id?: string
  tenant_id?: string
  project_id?: string
  request_id?: string
  trace_id?: string
  user_agent?: string
}

export type AuditQueueStatus = {
  pending: number
  lastFlushAt?: number
  lastFlushOk?: boolean
  lastError?: string
}

