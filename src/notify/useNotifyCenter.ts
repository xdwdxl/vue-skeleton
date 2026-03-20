import { computed, ref, watch } from 'vue'
import bus from '../bus'
import { API } from '../api'
import { useI18n } from '../i18n/vue'
import { I18nManager } from '../i18n/manager'
import { storage, useStorage } from '../storage'
import { get, unwrapBffData } from '../http/api'

type NotifyAction = { type: string; payload?: Record<string, unknown>; meta?: Record<string, unknown> }
type NotifyActionHandler = (ctx: { action: NotifyAction; item: InboxItem }) => void | boolean | Promise<void | boolean>
type RegisterOptions = { consumePending?: boolean; onlyLatestPending?: boolean }

const NOTIFY_BADGE_MAX = 99
const NOTIFY_INBOX_LIMIT = 50
const NOTIFY_ITEM_ACTIONS_MAX = 3
const NOTIFY_UNREAD_STORAGE_KEY = 'notify.unread'
const NOTIFY_DEFAULT_SOURCE_NAME = 'System'
const PENDING_ITEM_ID = '__pending__'
const META_OBJECT_ID_CANDIDATE_KEYS = [
  'ticketId',
  'issueIdReadable',
  'idReadable',
  'orderId',
  'objectId',
  'id',
] as const

const ACTION_PARAM_KEYS = {
  action: '__action',
  actions: '__actions',
  display: '__display',
  meta: '__meta',
  system: '__system',
} as const

const ACTION_REGISTRY_KEY = '__PORTAL_NOTIFY_ACTION_REGISTRY__'
const HOOK_REGISTRY_KEY = '__PORTAL_NOTIFY_HOOK_REGISTRY__'
const PENDING_ACTIONS_KEY = 'portal.notify.pendingActions'
const TOPIC_UNREAD_CHANGED = 'notify.unread.count.changed'

let unreadBridgeBound = false
let unreadWarmupDone = false
let unreadWarmupInFlight: Promise<void> | null = null

function bindUnreadBridge(): void {
  if (unreadBridgeBound) return
  unreadBridgeBound = true
  bus.subscribe(TOPIC_UNREAD_CHANGED, (msg) => {
    const payload = (msg?.payload ?? {}) as Record<string, unknown>
    if (!('unread' in payload)) return
    const next = Number((payload as any).unread)
    if (!Number.isFinite(next)) return
    try { storage.set('notify.unread', next, { scope: 'user' }) } catch {}
  })
}

async function warmupUnread(): Promise<void> {
  if (unreadWarmupDone) return
  if (unreadWarmupInFlight) return await unreadWarmupInFlight
  unreadWarmupInFlight = (async () => {
    try {
      const res = await get('/notify/inbox', { limit: 1 }, undefined, { silent: true, bizSilent: true, timeout: 8000 })
      const data = unwrapBffData<Record<string, unknown> | undefined>(res)
      const payload = (data ?? {}) as Record<string, unknown>
      if (!('unread' in payload)) return
      const n = Number((payload as any).unread)
      if (!Number.isFinite(n)) return
      try { storage.set('notify.unread', n, { scope: 'user' }) } catch {}
    } catch {
    } finally {
      unreadWarmupDone = true
      unreadWarmupInFlight = null
    }
  })()
  return await unreadWarmupInFlight
}

function getActionRegistry(): { handlers: Map<string, NotifyActionHandler> } {
  const g = globalThis as any
  const existing = g?.[ACTION_REGISTRY_KEY]
  if (existing && existing.handlers instanceof Map) return existing
  const created = { handlers: new Map<string, NotifyActionHandler>() }
  try { g[ACTION_REGISTRY_KEY] = created } catch {}
  return created
}

function getHookRegistry(): { hooks: Array<{ matcher: NotifyHookMatcher; handlers: NotifyHookHandler[] }> } {
  const g = globalThis as any
  const existing = g?.[HOOK_REGISTRY_KEY]
  if (existing && Array.isArray(existing.hooks)) return existing
  const created = { hooks: [] as Array<{ matcher: NotifyHookMatcher; handlers: NotifyHookHandler[] }> }
  try { g[HOOK_REGISTRY_KEY] = created } catch {}
  return created
}

type InboxItem = {
  id: string
  titleKey?: string
  bodyKey?: string
  params?: Record<string, unknown>
  createdAt?: number
  readAt?: number | null
}

type NotifyHookTrigger = 'item' | 'action'

type NotifyHookMeta = {
  notifyType: string
  objectId: string
  groupKey: string
  groupName: string
  sourceName: string
  linkUrl: string
}

type NotifyHookContext = {
  item: InboxItem
  trigger: NotifyHookTrigger
  action?: NotifyAction
  meta: NotifyHookMeta
}

type NotifyHookHandler = (ctx: NotifyHookContext) => void | boolean | Promise<void | boolean>

type NotifyHookMatcherObject = {
  trigger?: NotifyHookTrigger | NotifyHookTrigger[]
  id?: string
  actionType?: string
  notifyType?: string
  objectId?: string
  groupKey?: string
  groupName?: string
  sourceName?: string
  linkUrl?: string
}

type NotifyHookMatcher = NotifyHookMatcherObject | ((ctx: NotifyHookContext) => boolean)

type DisplayHint = { lines?: unknown }
type MetaLink = { url?: unknown; target?: unknown }
type MetaSource = { name?: unknown; type?: unknown }
type MetaObject = { type?: unknown; id?: unknown }
type MetaAvatar = { url?: unknown; text?: unknown }
type MetaGroup = { key?: unknown; name?: unknown }
type MetaSystem = { reason?: unknown; affectedScope?: unknown; suggestion?: unknown }
type NotifyActionButton = { label?: unknown; type?: unknown; payload?: unknown; meta?: unknown }

type InboxPayload = {
  items: InboxItem[]
  nextCursor: string
  unread?: number
}

function safeJsonParse<T = unknown>(text: string): T | null {
  try { return JSON.parse(text) as T } catch { return null }
}

function readPendingActions(): Record<string, NotifyAction[]> {
  try {
    const raw = sessionStorage.getItem(PENDING_ACTIONS_KEY)
    if (!raw) return {}
    const parsed = safeJsonParse<Record<string, NotifyAction[]>>(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writePendingActions(next: Record<string, NotifyAction[]>): void {
  try {
    sessionStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(next || {}))
  } catch {}
}

function enqueuePendingAction(action: NotifyAction): void {
  const type = String(action?.type || '').trim()
  if (!type) return
  const current = readPendingActions()
  const arr = Array.isArray(current[type]) ? current[type] : []
  current[type] = [...arr, action]
  writePendingActions(current)
}

function consumePendingActions(type: string, onlyLatest: boolean): NotifyAction[] {
  const t = String(type || '').trim()
  if (!t) return []
  const current = readPendingActions()
  const arr = Array.isArray(current[t]) ? current[t] : []
  delete current[t]
  writePendingActions(current)
  if (!onlyLatest) return arr
  return arr.length > 0 ? [arr[arr.length - 1]] : []
}

export function registerNotifyAction(type: string, handler: NotifyActionHandler, options?: RegisterOptions): () => void {
  const t = String(type || '').trim()
  if (!t || typeof handler !== 'function') return () => {}
  const registry = getActionRegistry()
  registry.handlers.set(t, handler)
  const consume = options?.consumePending !== false
  if (consume) {
    const pending = consumePendingActions(t, Boolean(options?.onlyLatestPending))
    for (const action of pending) {
      try { void handler({ action, item: { id: PENDING_ITEM_ID, params: {} } }) } catch {}
    }
  }
  return () => { registry.handlers.delete(t) }
}

export function registerNotifyHooks(matcher: NotifyHookMatcher, handlers: NotifyHookHandler[] | NotifyHookHandler): () => void {
  const normalizedHandlers = (Array.isArray(handlers) ? handlers : [handlers]).filter((h) => typeof h === 'function')
  if (normalizedHandlers.length <= 0) return () => {}
  const registry = getHookRegistry()
  const entry = { matcher, handlers: normalizedHandlers }
  registry.hooks = [...registry.hooks, entry]
  return () => {
    const next = registry.hooks.filter((x) => x !== entry)
    registry.hooks = next
  }
}

function pickActionFromParams(params?: Record<string, unknown>): NotifyAction | null {
  const p = params || {}
  const raw = (p as any)?.[ACTION_PARAM_KEYS.action] ?? (p as any)?.action
  if (!raw || typeof raw !== 'object') return null
  const type = String((raw as any)?.type || '').trim()
  if (!type) return null
  const payload = ((raw as any)?.payload && typeof (raw as any)?.payload === 'object') ? (raw as any).payload as Record<string, unknown> : undefined
  const meta = ((raw as any)?.meta && typeof (raw as any)?.meta === 'object') ? (raw as any).meta as Record<string, unknown> : undefined
  return { type, payload, meta }
}

function pickActionsFromParams(params?: Record<string, unknown>): Array<{ label: string; action: NotifyAction }> {
  const p = params || {}
  const raw = (p as any)?.[ACTION_PARAM_KEYS.actions]
  const list = Array.isArray(raw) ? raw : []
  return list
    .map((x) => (x ?? {}) as NotifyActionButton)
    .map((x) => {
      const label = String(x?.label ?? '').trim()
      const type = String(x?.type ?? '').trim()
      const payload = (x?.payload && typeof x.payload === 'object') ? x.payload as Record<string, unknown> : undefined
      const meta = (x?.meta && typeof x.meta === 'object') ? x.meta as Record<string, unknown> : undefined
      return { label, action: { type, payload, meta } }
    })
    .filter((x) => Boolean(x.label) && Boolean(x.action.type))
}

function pickDisplayLinesFromParams(params?: Record<string, unknown>): string[] {
  const p = params || {}
  const hint = ((p as any)?.[ACTION_PARAM_KEYS.display] ?? (p as any)?.display) as DisplayHint | undefined
  const rawLines = (hint && typeof hint === 'object') ? (hint as any)?.lines : undefined
  const arr = Array.isArray(rawLines) ? rawLines : []
  return arr.map((x) => String(x ?? '').trim()).filter(Boolean)
}

function pickMetaFromParams(params?: Record<string, unknown>): Record<string, unknown> {
  const p = params || {}
  const meta = (p as any)?.[ACTION_PARAM_KEYS.meta]
  return (meta && typeof meta === 'object') ? meta as Record<string, unknown> : {}
}

function pickSystemFromParams(params?: Record<string, unknown>): MetaSystem {
  const p = params || {}
  const meta = pickMetaFromParams(p)
  const v1 = (meta as any)?.system
  const v2 = (p as any)?.[ACTION_PARAM_KEYS.system]
  const picked = (v1 && typeof v1 === 'object') ? v1 : ((v2 && typeof v2 === 'object') ? v2 : {})
  return picked as MetaSystem
}

function pickMetaSource(params?: Record<string, unknown>): MetaSource {
  const meta = pickMetaFromParams(params)
  const source = (meta as any)?.source
  if (typeof source === 'string') return { name: source, type: 'user' }
  if (source && typeof source === 'object') return source as MetaSource
  return {}
}

function pickMetaLink(params?: Record<string, unknown>): MetaLink {
  const meta = pickMetaFromParams(params)
  const link = (meta as any)?.link
  if (typeof link === 'string') return { url: link, target: '_blank' }
  if (link && typeof link === 'object') return link as MetaLink
  return {}
}

function pickMetaObject(params?: Record<string, unknown>): MetaObject {
  const meta = pickMetaFromParams(params)
  const object = (meta as any)?.object
  if (object && typeof object === 'object') return object as MetaObject
  return {}
}

function pickMetaAvatar(params?: Record<string, unknown>): MetaAvatar {
  const meta = pickMetaFromParams(params)
  const avatar = (meta as any)?.avatar
  if (typeof avatar === 'string') return { url: avatar }
  if (avatar && typeof avatar === 'object') return avatar as MetaAvatar
  return {}
}

function pickMetaGroup(params?: Record<string, unknown>): MetaGroup {
  const meta = pickMetaFromParams(params)
  const group = (meta as any)?.group
  if (typeof group === 'string') return { key: group, name: group }
  if (group && typeof group === 'object') return group as MetaGroup
  return {}
}

function pickMetaText(params: Record<string, unknown> | undefined, key: 'title' | 'body' | 'notifyType'): string {
  const p = params || {}
  const meta = pickMetaFromParams(p)
  const v = (meta as any)?.[key]
  if (typeof v === 'string') return v.trim()
  const legacy = (p as any)?.[key]
  return typeof legacy === 'string' ? legacy.trim() : ''
}

function pickMetaTime(params?: Record<string, unknown>): number | undefined {
  const meta = pickMetaFromParams(params)
  const raw = (meta as any)?.time
  return asNumber(raw)
}

function pickMetaObjectId(params?: Record<string, unknown>): string {
  const obj = pickMetaObject(params)
  const id = String(obj?.id ?? '').trim()
  if (id) return id
  const p = (params || {}) as any
  for (const key of META_OBJECT_ID_CANDIDATE_KEYS) {
    const v = String(p?.[key] ?? '').trim()
    if (v) return v
  }
  return ''
}

function matchNotifyHook(ctx: NotifyHookContext, matcher: NotifyHookMatcher): boolean {
  if (typeof matcher === 'function') {
    try { return Boolean(matcher(ctx)) } catch { return false }
  }

  const m = matcher || {}
  const triggers = Array.isArray(m.trigger) ? m.trigger : (m.trigger ? [m.trigger] : [])
  if (triggers.length > 0 && !triggers.includes(ctx.trigger)) return false

  if (m.id && m.id !== ctx.item.id) return false
  if (m.actionType && m.actionType !== (ctx.action?.type ?? '')) return false
  if (m.notifyType && m.notifyType !== ctx.meta.notifyType) return false
  if (m.objectId && m.objectId !== ctx.meta.objectId) return false
  if (m.groupKey && m.groupKey !== ctx.meta.groupKey) return false
  if (m.groupName && m.groupName !== ctx.meta.groupName) return false
  if (m.sourceName && m.sourceName !== ctx.meta.sourceName) return false
  if (m.linkUrl && m.linkUrl !== ctx.meta.linkUrl) return false

  return true
}

function buildNotifyHookMeta(item: InboxItem): NotifyHookMeta {
  const group = pickMetaGroup(item.params)
  const source = pickMetaSource(item.params)
  const link = pickMetaLink(item.params)
  const sourceName = String(source?.name ?? '').trim() || NOTIFY_DEFAULT_SOURCE_NAME
  const groupKey = String(group?.key ?? '').trim()
  const groupName = String(group?.name ?? '').trim() || groupKey
  return {
    notifyType: pickMetaText(item.params, 'notifyType'),
    objectId: pickMetaObjectId(item.params),
    groupKey,
    groupName,
    sourceName,
    linkUrl: String(link?.url ?? '').trim(),
  }
}

function buildNotifyHookContext(item: InboxItem, trigger: NotifyHookTrigger, action?: NotifyAction): NotifyHookContext {
  return { item, trigger, action, meta: buildNotifyHookMeta(item) }
}

async function runNotifyHooksForItem(item: InboxItem, trigger: NotifyHookTrigger, action?: NotifyAction): Promise<boolean> {
  const registry = getHookRegistry()
  const resolvedAction = action ?? pickActionFromParams(item?.params) ?? undefined
  const ctx = buildNotifyHookContext(item, trigger, resolvedAction)
  for (const entry of registry.hooks) {
    if (!matchNotifyHook(ctx, entry.matcher)) continue
    for (const handler of entry.handlers) {
      try {
        const res = await handler(ctx)
        if (res === false) return false
      } catch {}
    }
  }
  return true
}

async function fetchInbox(params: { limit: number; cursor?: string }): Promise<InboxPayload> {
  const res = await API.NotifyInbox(params)
  const data = unwrapBffData(res)
  return normalizeInboxPayload(data)
}

async function runNotifyAction(action: NotifyAction, item: InboxItem): Promise<boolean> {
  if (!action?.type) return false
  const handler = getActionRegistry().handlers.get(action.type)
  if (!handler) {
    enqueuePendingAction(action)
    return false
  }
  try {
    const res = await handler({ action, item })
    return res !== false
  } catch {
    return false
  }
}

async function runNotifyActionForItem(item: InboxItem): Promise<boolean> {
  const action = pickActionFromParams(item?.params)
  if (!action) return false
  return runNotifyAction(action, item)
}

function asNumber(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : undefined
}

function normalizeInboxPayload(payload: unknown): InboxPayload {
  if (Array.isArray(payload)) {
    return { items: payload as InboxItem[], nextCursor: '' }
  }
  const obj = (payload ?? {}) as Record<string, unknown>
  const rawItems = Array.isArray(obj.items) ? obj.items : []
  const items = rawItems
    .map((it) => (it ?? {}) as Record<string, unknown>)
    .map((it) => ({
      id: String(it.id ?? ''),
      titleKey: typeof it.titleKey === 'string' ? it.titleKey : (typeof (it as any).title_key === 'string' ? (it as any).title_key : undefined),
      bodyKey: typeof it.bodyKey === 'string' ? it.bodyKey : (typeof (it as any).body_key === 'string' ? (it as any).body_key : undefined),
      params: (it.params && typeof it.params === 'object') ? (it.params as Record<string, unknown>) : undefined,
      createdAt: asNumber((it as any).createdAt ?? (it as any).created_at),
      readAt: (((it as any).readAt ?? (it as any).read_at) === null || ((it as any).readAt ?? (it as any).read_at) === undefined)
        ? null
        : asNumber((it as any).readAt ?? (it as any).read_at),
    }))
    .filter((it) => Boolean(it.id))

  const cursor = typeof obj.next_cursor === 'string' ? obj.next_cursor : (typeof obj.nextCursor === 'string' ? obj.nextCursor : '')
  const unread = asNumber(obj.unread)
  return { items, nextCursor: cursor || '', unread }
}

export function useNotifyCenter() {
  bindUnreadBridge()

  let i18n: any
  try {
    i18n = useI18n()
  } catch {
    i18n = new I18nManager()
  }
  const unread = useStorage<number>(NOTIFY_UNREAD_STORAGE_KEY, 0, { scope: 'user' })

  const notifyDrawerOpen = ref(false)
  const inboxItems = ref<InboxItem[]>([])
  const nextCursor = ref('')
  const inboxLoading = ref(false)
  const loadMoreLoading = ref(false)

  void warmupUnread()

  const unreadCount = computed(() => {
    const v = Number(unread.value ?? 0)
    return Number.isFinite(v) && v > 0 ? Math.floor(v) : 0
  })

  const badgeValue = computed(() => {
    if (unreadCount.value <= 0) return 0
    return unreadCount.value > NOTIFY_BADGE_MAX ? `${NOTIFY_BADGE_MAX}+` : unreadCount.value
  })

  function openNotifyDrawer() {
    notifyDrawerOpen.value = true
  }

  async function refreshInbox(reset: boolean) {
    if (inboxLoading.value) return
    inboxLoading.value = true
    try {
      const normalized = await fetchInbox({ limit: NOTIFY_INBOX_LIMIT })
      inboxItems.value = reset ? normalized.items : [...inboxItems.value, ...normalized.items]
      nextCursor.value = normalized.nextCursor
      if (typeof normalized.unread === 'number') {
        unread.value = normalized.unread
      }
    } catch {
    } finally {
      inboxLoading.value = false
    }
  }

  async function loadMore() {
    if (!nextCursor.value) return
    if (loadMoreLoading.value) return
    loadMoreLoading.value = true
    try {
      const normalized = await fetchInbox({ cursor: nextCursor.value, limit: NOTIFY_INBOX_LIMIT })
      inboxItems.value = [...inboxItems.value, ...normalized.items]
      nextCursor.value = normalized.nextCursor
      if (typeof normalized.unread === 'number') {
        unread.value = normalized.unread
      }
    } catch {
    } finally {
      loadMoreLoading.value = false
    }
  }

  function resolveText(key?: string, params?: Record<string, unknown>): string {
    if (!key) return ''
    try { return i18n.t(key, params) } catch { return key }
  }

  function resolveTitle(item: InboxItem): string {
    const byKey = resolveText(item.titleKey, item.params)
    if (byKey) return byKey
    return pickMetaText(item.params, 'title')
  }

  function resolveBody(item: InboxItem): string {
    const byKey = resolveText(item.bodyKey, item.params)
    if (byKey) return byKey
    return pickMetaText(item.params, 'body')
  }

  function formatTime(ts?: number): string {
    if (!ts || !Number.isFinite(ts)) return ''
    try { return new Date(ts).toLocaleString() } catch { return '' }
  }

  function pickDisplayTime(item: InboxItem): number | undefined {
    const metaTime = pickMetaTime(item.params)
    if (typeof metaTime === 'number') return metaTime
    return item.createdAt
  }

  function pickSourceName(item: InboxItem): string {
    const source = pickMetaSource(item.params)
    const name = String(source?.name ?? '').trim()
    return name || NOTIFY_DEFAULT_SOURCE_NAME
  }

  function pickAvatarUrl(item: InboxItem): string {
    const avatar = pickMetaAvatar(item.params)
    return String(avatar?.url ?? '').trim()
  }

  function pickAvatarText(item: InboxItem): string {
    const avatar = pickMetaAvatar(item.params)
    const t = String(avatar?.text ?? '').trim()
    if (t) return t
    const s = pickSourceName(item)
    return s ? s.slice(0, 1).toUpperCase() : ''
  }

  function pickNotifyTypeText(item: InboxItem): string {
    return pickMetaText(item.params, 'notifyType')
  }

  function pickObjectIdText(item: InboxItem): string {
    return pickMetaObjectId(item.params)
  }

  function pickGroupName(item: InboxItem): string {
    const group = pickMetaGroup(item.params)
    return String(group?.name ?? group?.key ?? '').trim()
  }

  function pickLinkUrl(item: InboxItem): string {
    const link = pickMetaLink(item.params)
    return String(link?.url ?? '').trim()
  }

  function pickActions(item: InboxItem): Array<{ label: string; action: NotifyAction }> {
    const arr = pickActionsFromParams(item.params)
    return arr.length <= NOTIFY_ITEM_ACTIONS_MAX ? arr : arr.slice(0, NOTIFY_ITEM_ACTIONS_MAX)
  }

  async function handleItemActionClick(item: InboxItem, action: NotifyAction) {
    if (!item?.id) return
    if (!item.readAt) await markItemRead(item)
    const canProceed = await runNotifyHooksForItem(item, 'action', action)
    if (!canProceed) return
    const acted = await runNotifyAction(action, item)
    if (acted) {
      const keepOpen = Boolean(action?.meta?.keepDrawerOpen)
      if (!keepOpen) notifyDrawerOpen.value = false
    }
  }

  async function markAllRead() {
    if (inboxLoading.value) return
    inboxLoading.value = true
    try {
      await API.NotifyReadAll()
      const now = Date.now()
      inboxItems.value = inboxItems.value.map((it) => (it.readAt ? it : { ...it, readAt: now }))
      unread.value = 0
    } catch {
    } finally {
      inboxLoading.value = false
    }
  }

  async function markItemRead(item: InboxItem) {
    if (!item?.id) return
    if (item.readAt) return
    try {
      await API.NotifyRead({ ids: [item.id] })
      const now = Date.now()
      inboxItems.value = inboxItems.value.map((it) => (it.id === item.id ? { ...it, readAt: now } : it))
      unread.value = Math.max(0, unreadCount.value - 1)
    } catch {
    }
  }

  async function handleItemClick(item: InboxItem) {
    if (!item?.id) return
    if (!item.readAt) await markItemRead(item)
    const canProceed = await runNotifyHooksForItem(item, 'item')
    if (!canProceed) return
    const acted = await runNotifyActionForItem(item)
    if (acted) {
      const keepOpen = Boolean(pickActionFromParams(item?.params)?.meta?.keepDrawerOpen)
      if (!keepOpen) notifyDrawerOpen.value = false
    }
  }

  watch(
    notifyDrawerOpen,
    (open) => {
      if (!open) return
      refreshInbox(true)
    }
  )

  return {
    BADGE_MAX: NOTIFY_BADGE_MAX,
    ACTIONS_MAX: NOTIFY_ITEM_ACTIONS_MAX,
    badgeValue,
    formatTime,
    handleItemClick,
    handleItemActionClick,
    inboxItems,
    inboxLoading,
    loadMore,
    loadMoreLoading,
    markAllRead,
    markItemRead,
    nextCursor,
    notifyDrawerOpen,
    openNotifyDrawer,
    pickActions,
    pickAvatarText,
    pickAvatarUrl,
    pickDisplayLinesFromParams,
    pickDisplayTime,
    pickGroupName,
    pickLinkUrl,
    pickNotifyTypeText,
    pickObjectIdText,
    pickSourceName,
    pickSystemFromParams,
    refreshInbox,
    resolveBody,
    resolveText,
    resolveTitle,
    unreadCount,
  }
}
