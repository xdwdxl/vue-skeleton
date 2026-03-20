/**
 * Error notifier
 * @author Lorin Luo
 * @description Renders user-facing prompts using Element Plus
 */

import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'
import type { ErrorDisplay, ErrorLevel, NormalizedError } from './types'

function toElementType(level: ErrorLevel): 'success' | 'warning' | 'info' | 'error' {
  if (level === 'warn') return 'warning'
  if (level === 'error' || level === 'fatal') return 'error'
  return 'info'
}

function compactDetail(err: NormalizedError): string {
  const parts: string[] = []
  if (err.requestId) parts.push(`requestId: ${err.requestId}`)
  if (err.traceId) parts.push(`traceId: ${err.traceId}`)
  if (typeof err.status === 'number' && err.status > 0) parts.push(`status: ${err.status}`)
  if (err.code) parts.push(`code: ${err.code}`)
  return parts.join(' | ')
}

export class ErrorNotifier {
  /**
   * Display error notification
   * @param {NormalizedError} err - Error object
   */
  notify(err: NormalizedError): void {
    const display: ErrorDisplay = err.display
    const type = toElementType(err.level)
    const detail = compactDetail(err)
    const message = detail ? `${err.message}\n${detail}` : err.message

    if (display === 'none' || display === 'inline') return

    if (display === 'toast') {
      ElMessage({ type, message, duration: err.level === 'error' || err.level === 'fatal' ? 4500 : 3000, showClose: true })
      return
    }

    if (display === 'notification') {
      ElNotification({ type, title: err.level === 'fatal' ? 'Error' : 'Notice', message, duration: err.level === 'fatal' ? 0 : 4500 })
      return
    }

    ElMessageBox.alert(message, err.level === 'fatal' ? 'Error' : 'Notice', { type, confirmButtonText: 'OK' }).catch(() => {})
  }
}

