/**
 * @file src/audit/__tests__/index.test.ts
 * @author Lorin Luo
 * @description Unit tests for audit barrel file
 */
import { describe, it, expect } from 'vitest'
import * as AuditModule from '../index'

describe('Audit Module', () => {
  it('should export audit singleton', () => {
    expect(AuditModule.audit).toBeDefined()
    expect(typeof AuditModule.audit.log).toBe('function')
  })
})
