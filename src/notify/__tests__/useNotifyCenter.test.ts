import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../bus', () => ({
  default: { subscribe: vi.fn() },
}))
vi.mock('../../api', () => ({ API: {} }))
vi.mock('../../i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('../../storage', () => ({
  storage: { set: vi.fn() },
  useStorage: () => ({ value: 0 }),
}))
vi.mock('../../http/api', () => ({ unwrapBffData: (v: unknown) => v }))

import { registerNotifyAction } from '../useNotifyCenter'

const PENDING_ACTIONS_KEY = 'portal.notify.pendingActions'

function resetRegistry() {
  delete (globalThis as any).__PORTAL_NOTIFY_ACTION_REGISTRY__
  delete (globalThis as any).__PORTAL_NOTIFY_HOOK_REGISTRY__
}

describe('registerNotifyAction', () => {
  beforeEach(() => {
    resetRegistry()
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('consumes pending actions by default', () => {
    const handler = vi.fn()
    sessionStorage.setItem(
      PENDING_ACTIONS_KEY,
      JSON.stringify({
        demo: [
          { type: 'demo', payload: { id: 1 } },
          { type: 'demo', payload: { id: 2 } },
        ],
      })
    )
    registerNotifyAction('demo', handler)
    expect(handler).toHaveBeenCalledTimes(2)
    const stored = sessionStorage.getItem(PENDING_ACTIONS_KEY) || ''
    expect(stored).toBe(JSON.stringify({}))
  })

  it('consumes only latest pending action when configured', () => {
    const handler = vi.fn()
    sessionStorage.setItem(
      PENDING_ACTIONS_KEY,
      JSON.stringify({
        demo: [
          { type: 'demo', payload: { id: 1 } },
          { type: 'demo', payload: { id: 2 } },
        ],
      })
    )
    registerNotifyAction('demo', handler, { onlyLatestPending: true })
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler.mock.calls[0][0].action.payload).toEqual({ id: 2 })
  })

  it('keeps pending actions when consumePending is false', () => {
    const handler = vi.fn()
    sessionStorage.setItem(
      PENDING_ACTIONS_KEY,
      JSON.stringify({
        demo: [{ type: 'demo', payload: { id: 3 } }],
      })
    )
    registerNotifyAction('demo', handler, { consumePending: false })
    expect(handler).not.toHaveBeenCalled()
    const stored = sessionStorage.getItem(PENDING_ACTIONS_KEY) || ''
    expect(JSON.parse(stored).demo.length).toBe(1)
  })
})
