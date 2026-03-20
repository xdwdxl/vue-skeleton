/**
 * @file src/pages/__tests__/remoteLoaders.test.ts
 * @author Lorin Luo
 * @description Unit tests for remote loaders registry
 */
import { describe, it, expect } from 'vitest'
import { REMOTE_LOADERS } from '../remoteLoaders'

const DASHBOARD_PATH = '/dashboard'
const HELPDESK_PATH = '/dashboard/helpdesk'
const INVOICES_PATH = '/dashboard/invoices'

describe('remoteLoaders', () => {
  it('contains required loader keys', () => {
    expect(Object.keys(REMOTE_LOADERS)).toContain(DASHBOARD_PATH)
    expect(Object.keys(REMOTE_LOADERS)).toContain(HELPDESK_PATH)
    expect(Object.keys(REMOTE_LOADERS)).toContain(INVOICES_PATH)
  })

  it('loads remote modules for known paths', () => {
    const loadDashboard = REMOTE_LOADERS[DASHBOARD_PATH]
    const loadHelpdesk = REMOTE_LOADERS[HELPDESK_PATH]
    expect(typeof loadDashboard).toBe('function')
    expect(typeof loadHelpdesk).toBe('function')
  })
})
