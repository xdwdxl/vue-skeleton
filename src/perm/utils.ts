/**
 * Permission utilities for Portal
 * @author Lorin Luo
 * @description Helpers for permission group checks
 */

export const ADMIN_GROUP = '/admin'

export function normalizeStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const v of raw) {
    const s = String(v ?? '').trim()
    if (!s || seen.has(s)) continue
    seen.add(s)
    out.push(s)
  }
  return out
}

/**
 * Check whether the given groups contain admin group
 * @author Lorin Luo
 * @param {unknown} groups - Raw groups payload
 * @returns {boolean} - Returns true if user is in admin group
 */
export function isAdminGroup(groups: unknown): boolean {
  const list = Array.isArray(groups) ? groups : []
  for (const g of list) {
    const s = String(g || '').trim()
    if (!s) continue
    if (s === ADMIN_GROUP) return true
    if (s.endsWith(ADMIN_GROUP)) return true
  }
  return false
}
