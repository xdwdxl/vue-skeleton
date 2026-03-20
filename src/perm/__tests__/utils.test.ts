import { describe, it, expect } from 'vitest'
import { ADMIN_GROUP, isAdminGroup, normalizeStringList } from '../utils'

describe('perm utils', () => {
  it('normalizes string list', () => {
    const out = normalizeStringList([' a ', 'b', 'a', null, undefined, ''])
    expect(out).toEqual(['a', 'b'])
  })

  it('detects admin group', () => {
    expect(isAdminGroup([ADMIN_GROUP])).toBe(true)
    expect(isAdminGroup(['/team/admin'])).toBe(true)
    expect(isAdminGroup(['/user'])).toBe(false)
  })

  it('handles non-array input', () => {
    expect(isAdminGroup(null)).toBe(false)
    expect(normalizeStringList('x')).toEqual([])
  })
})
