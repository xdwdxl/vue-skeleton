<template>
  <section class="layout-settings">
    <CidsCard title="Dashboard Layout">
      <div v-if="!isAdmin" class="layout-guard">Admin only</div>
      <el-tabs v-else v-model="activeTab">
        <el-tab-pane label="User" name="user">
          <div class="toolbar">
            <el-input v-model="userSearchText" placeholder="Search users" style="max-width: 260px" />
            <el-button :disabled="loading" @click="searchUsers">Search</el-button>
            <el-select v-model="userId" filterable placeholder="userId" style="min-width: 420px">
              <el-option v-for="u in userOptions" :key="u.id" :label="u.label" :value="u.id" />
            </el-select>
            <el-button type="primary" :disabled="loading || !userId.trim()" @click="loadUser">Load</el-button>
            <el-button type="primary" :disabled="loading || !userId.trim()" @click="saveUser">Save</el-button>
            <el-button :disabled="loading || !userId.trim()" @click="resetUserToGroup">Reset to Group</el-button>
            <el-button :disabled="loading || !userId.trim()" @click="resetUserToGlobal">Reset to Global</el-button>
          </div>
          <div class="editor">
            <div class="panel-left">
              <div class="panel-title">Cards</div>
              <div class="card-list">
                <div v-if="registryCards.length === 0" class="card-list-empty">No cards found in runtime</div>
                <div
                  v-for="c in registryCards"
                  :key="c.cardId"
                  class="card-list-item"
                  draggable="true"
                  @dragstart="onCardDragStart($event, c.cardId)"
                >
                  <div class="card-list-item__title">{{ c.title }}</div>
                  <div class="card-list-item__meta">{{ c.meta }}</div>
                </div>
              </div>
            </div>
            <div class="panel-right">
              <div class="panel-title">Layout</div>
              <div class="layout-status">
                <div v-if="selectedItem" class="layout-status__text">
                  {{ selectedItem.cardId }} — x:{{ selectedItem.x }} y:{{ selectedItem.y }} w:{{ selectedItem.w }} h:{{ selectedItem.h }}
                </div>
                <div v-else class="layout-status__text">Select a card to edit</div>
                <div class="layout-status__actions">
                  <el-button size="small" :disabled="!selectedItem" @click="duplicateSelected">Duplicate</el-button>
                  <el-button size="small" type="danger" text :disabled="!selectedItem" @click="removeSelected">Delete</el-button>
                </div>
              </div>
              <div class="layout-dropzone" :style="dropzoneStyle" @dragover.prevent @drop.prevent="onGridDrop">
                <GridLayout
                  v-model:layout="layoutModel"
                  :col-num="gridCfg.cols"
                  :row-height="gridCfg.rowHeight"
                  :max-rows="gridCfg.maxRows"
                  :margin="[gridCfg.marginX, gridCfg.marginY]"
                  :is-draggable="true"
                  :is-resizable="true"
                  :is-bounded="true"
                  :prevent-collision="false"
                  :vertical-compact="true"
                  :use-css-transforms="true"
                  :use-style-cursor="true"
                >
                  <GridItem
                    v-for="it in layoutModel"
                    :key="it.i"
                    :x="it.x"
                    :y="it.y"
                    :w="it.w"
                    :h="it.h"
                    :i="it.i"
                    :min-w="it.minW"
                    :min-h="it.minH"
                    :max-w="it.maxW"
                    :max-h="it.maxH"
                    :drag-allow-from="'.grid-item__header'"
                    :drag-ignore-from="'.grid-item__actions, a, button, input, textarea'"
                    :resize-ignore-from="'.grid-item__actions, a, button, input, textarea'"
                    @move="onItemMove"
                    @moved="onItemMoved"
                    @resize="onItemResize"
                    @resized="onItemResized"
                  >
                    <div class="grid-item" :class="{ 'grid-item--hidden': it.hidden, 'grid-item--selected': it.i === selectedId }" @click.stop="selectItem(it.i)">
                      <div class="grid-item__header">
                        <div class="grid-item__title">{{ it.cardId }}</div>
                        <div class="grid-item__actions">
                          <el-checkbox v-model="it.hidden" size="small">Hidden</el-checkbox>
                          <el-button size="small" text type="danger" @click.stop="removeItem(it.i)">Remove</el-button>
                        </div>
                      </div>
                    </div>
                  </GridItem>
                </GridLayout>
              </div>
              <div v-if="userError" class="error">{{ userError }}</div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="Group" name="group">
          <div class="toolbar">
            <el-select
              v-model="groupId"
              filterable
              allow-create
              default-first-option
              placeholder="groupId"
              style="min-width: 260px"
            >
              <el-option v-for="g in groupOptions" :key="g" :label="g" :value="g" />
            </el-select>
            <el-button :disabled="loading" @click="refreshGroups">Refresh</el-button>
            <el-button type="primary" :disabled="loading || !groupId.trim()" @click="loadGroup">Load</el-button>
            <el-button type="primary" :disabled="loading || !groupId.trim()" @click="saveGroup">Save</el-button>
            <el-button :disabled="loading" @click="resetGroupToGlobal">Reset to Global</el-button>
          </div>
          <div class="editor">
            <div class="panel-left">
              <div class="panel-title">Cards</div>
              <div class="card-list">
                <div v-if="registryCards.length === 0" class="card-list-empty">No cards found in runtime</div>
                <div
                  v-for="c in registryCards"
                  :key="c.cardId"
                  class="card-list-item"
                  draggable="true"
                  @dragstart="onCardDragStart($event, c.cardId)"
                >
                  <div class="card-list-item__title">{{ c.title }}</div>
                  <div class="card-list-item__meta">{{ c.meta }}</div>
                </div>
              </div>
            </div>
            <div class="panel-right">
              <div class="panel-title">Layout</div>
              <div class="layout-status">
                <div v-if="selectedItem" class="layout-status__text">
                  {{ selectedItem.cardId }} — x:{{ selectedItem.x }} y:{{ selectedItem.y }} w:{{ selectedItem.w }} h:{{ selectedItem.h }}
                </div>
                <div v-else class="layout-status__text">Select a card to edit</div>
                <div class="layout-status__actions">
                  <el-button size="small" :disabled="!selectedItem" @click="duplicateSelected">Duplicate</el-button>
                  <el-button size="small" type="danger" text :disabled="!selectedItem" @click="removeSelected">Delete</el-button>
                </div>
              </div>
              <div class="layout-dropzone" :style="dropzoneStyle" @dragover.prevent @drop.prevent="onGridDrop">
                <GridLayout
                  v-model:layout="layoutModel"
                  :col-num="gridCfg.cols"
                  :row-height="gridCfg.rowHeight"
                  :max-rows="gridCfg.maxRows"
                  :margin="[gridCfg.marginX, gridCfg.marginY]"
                  :is-draggable="true"
                  :is-resizable="true"
                  :is-bounded="true"
                  :prevent-collision="false"
                  :vertical-compact="true"
                  :use-css-transforms="true"
                  :use-style-cursor="true"
                >
                  <GridItem
                    v-for="it in layoutModel"
                    :key="it.i"
                    :x="it.x"
                    :y="it.y"
                    :w="it.w"
                    :h="it.h"
                    :i="it.i"
                    :min-w="it.minW"
                    :min-h="it.minH"
                    :max-w="it.maxW"
                    :max-h="it.maxH"
                    :drag-allow-from="'.grid-item__header'"
                    :drag-ignore-from="'.grid-item__actions, a, button, input, textarea'"
                    :resize-ignore-from="'.grid-item__actions, a, button, input, textarea'"
                    @move="onItemMove"
                    @moved="onItemMoved"
                    @resize="onItemResize"
                    @resized="onItemResized"
                  >
                    <div class="grid-item" :class="{ 'grid-item--hidden': it.hidden, 'grid-item--selected': it.i === selectedId }" @click.stop="selectItem(it.i)">
                      <div class="grid-item__header">
                        <div class="grid-item__title">{{ it.cardId }}</div>
                        <div class="grid-item__actions">
                          <el-checkbox v-model="it.hidden" size="small">Hidden</el-checkbox>
                          <el-button size="small" text type="danger" @click.stop="removeItem(it.i)">Remove</el-button>
                        </div>
                      </div>
                    </div>
                  </GridItem>
                </GridLayout>
              </div>
              <div v-if="groupError" class="error">{{ groupError }}</div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </CidsCard>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElNotification } from 'element-plus'
import { GridItem, GridLayout } from 'grid-layout-plus'
import { API } from '../api'
import CidsCard from '../components/CidsCard.vue'

type KcUserItem = { id: string; username?: string; email?: string; displayName?: string }

type LayoutItem = {
  i: string
  cardId: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  hidden?: boolean
}

type LayoutJson = { version: number; cols: number; maxRows: number; items: LayoutItem[] }

const activeTab = ref<'user' | 'group'>('user')
const loading = ref(false)
const userError = ref('')
const groupError = ref('')
const isAdmin = ref(false)

const userId = ref('')
const groups = ref<string[]>([])
const userSearchText = ref('')
const users = ref<KcUserItem[]>([])
const allGroups = ref<string[]>([])

const groupId = ref('')
const userLayout = ref<LayoutJson | null>(null)
const groupLayout = ref<LayoutJson | null>(null)
const runtime = ref<any>(null)
const selectedId = ref('')

function safeString(value: unknown): string {
  return String(value || '').trim()
}

function safeObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {}
  return value as Record<string, unknown>
}

function safeNumber(value: unknown, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function getRuntime(): any {
  return runtime.value ?? (globalThis as any)?.window?.__PORTAL_RUNTIME__
}

function normalizeGroupId(raw: string): string {
  const s = safeString(raw)
  if (!s) return ''
  const parts = s.split('/').map((x) => safeString(x)).filter(Boolean)
  return safeString(parts[parts.length - 1])
}

function normalizeStringList(input: unknown[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const v of input) {
    const s = safeString(v)
    if (!s) continue
    if (seen.has(s)) continue
    seen.add(s)
    out.push(s)
  }
  out.sort()
  return out
}

function pickUserLabel(u: KcUserItem): string {
  const name = safeString(u?.displayName)
  const email = safeString(u?.email)
  const username = safeString(u?.username)
  const main = name || email || username || safeString(u?.id)
  const tail = email && main !== email ? ` <${email}>` : ''
  return `${main}${tail}`.trim()
}

const userOptions = computed(() => users.value.map((u) => ({ id: safeString(u.id), label: pickUserLabel(u) })).filter((x) => x.id))

const groupOptions = computed(() => {
  const rt = getRuntime()?.dashboard?.layout
  const priority = Array.isArray(rt?.groupPriority) ? (rt.groupPriority as unknown[]) : []
  const base = normalizeStringList(priority.map((x) => safeString(x)).filter((x) => x && x !== 'other'))
  const known = normalizeStringList(groups.value.map((x) => normalizeGroupId(x)).filter(Boolean))
  const adminList = normalizeStringList((allGroups.value ?? []).map((x) => normalizeGroupId(x)).filter(Boolean))
  const merged = normalizeStringList([...base, ...known, ...adminList, safeString(groupId.value)])
  return merged.filter((x) => x && x !== 'other')
})

const registryCards = computed(() => {
  const reg = getRuntime()?.dashboard?.cards?.registry
  const list = Array.isArray(reg) ? reg : []
  return list
    .map((x: any) => {
      const cardId = safeString(x?.cardId)
      if (!cardId) return null
      const ds = x?.defaultSize ?? {}
      const w = Math.max(1, safeNumber(ds?.w, 2))
      const h = Math.max(1, safeNumber(ds?.h, 6))
      return {
        cardId,
        title: safeString(x?.titleKey) || cardId,
        meta: `${w}×${h}`,
        defaultSize: {
          w,
          h,
          minW: Math.max(1, safeNumber(ds?.minW, 1)),
          minH: Math.max(1, safeNumber(ds?.minH, 1)),
          maxW: Math.max(1, safeNumber(ds?.maxW, 999)),
          maxH: Math.max(1, safeNumber(ds?.maxH, 999)),
        },
      }
    })
    .filter(Boolean) as Array<{ cardId: string; title: string; meta: string; defaultSize: any }>
})

function buildGlobalDefaultLayout(): LayoutJson {
  const grid = getRuntime()?.dashboard?.layout?.grid ?? {}
  const cols = Math.max(1, Number(grid?.cols || 10))
  const maxRows = Math.max(1, Number(grid?.maxRows || 50))
  const half = Math.max(1, Math.floor(cols / 2))
  const leftW = half
  const rightW = cols - leftW

  const reg = getRuntime()?.dashboard?.cards?.registry
  const list = Array.isArray(reg) ? reg : []
  const getH = (cardId: string, fallback: number) => {
    const it = list.find((x: any) => safeString(x?.cardId) === cardId)
    const h = Number(it?.defaultSize?.h ?? fallback)
    return Math.max(1, Math.min(maxRows, Number.isFinite(h) ? h : fallback))
  }

  const topH = Math.max(getH('helpdesk', 16), getH('wiki', 16))
  const projectH = getH('project', 18)

  return {
    version: 1,
    cols,
    maxRows,
    items: [
      { i: 'helpdesk', cardId: 'helpdesk', x: 0, y: 0, w: leftW, h: getH('helpdesk', 16), minW: 1, minH: 1, maxW: cols, maxH: maxRows },
      { i: 'wiki', cardId: 'wiki', x: leftW, y: 0, w: rightW, h: getH('wiki', 16), minW: 1, minH: 1, maxW: cols, maxH: maxRows },
      { i: 'project', cardId: 'project', x: 0, y: topH, w: cols, h: projectH, minW: 1, minH: 1, maxW: cols, maxH: maxRows },
      { i: 'payment', cardId: 'payment', x: 0, y: topH + projectH, w: leftW, h: getH('payment', 16), minW: 1, minH: 1, maxW: cols, maxH: maxRows },
      { i: 'offer', cardId: 'offer', x: leftW, y: topH + projectH, w: rightW, h: getH('offer', 16), minW: 1, minH: 1, maxW: cols, maxH: maxRows },
    ],
  }
}

function clampItem(it: LayoutItem, cols: number, maxRows: number): LayoutItem {
  const w = Math.max(1, Math.min(cols, safeNumber(it.w, 1)))
  const h = Math.max(1, Math.min(maxRows, safeNumber(it.h, 1)))
  const x = Math.max(0, Math.min(cols - w, safeNumber(it.x, 0)))
  const y = Math.max(0, Math.min(maxRows - h, safeNumber(it.y, 0)))
  return { ...it, x, y, w, h }
}

function isOverlap(a: LayoutItem, b: LayoutItem): boolean {
  const ax2 = a.x + a.w
  const ay2 = a.y + a.h
  const bx2 = b.x + b.w
  const by2 = b.y + b.h
  if (ax2 <= b.x) return false
  if (bx2 <= a.x) return false
  if (ay2 <= b.y) return false
  if (by2 <= a.y) return false
  return true
}

function findFirstFreeSpot(items: LayoutItem[], cols: number, maxRows: number, w: number, h: number): { x: number; y: number } {
  const ww = Math.max(1, Math.min(cols, w))
  const hh = Math.max(1, Math.min(maxRows, h))
  for (let y = 0; y <= maxRows - hh; y += 1) {
    for (let x = 0; x <= cols - ww; x += 1) {
      const probe: LayoutItem = { i: 'probe', cardId: 'probe', x, y, w: ww, h: hh }
      let ok = true
      for (const it of items) {
        if (isOverlap(probe, it)) {
          ok = false
          break
        }
      }
      if (ok) return { x, y }
    }
  }
  return { x: 0, y: 0 }
}

function uniqItemId(cardId: string, items: LayoutItem[]): string {
  const base = safeString(cardId) || 'item'
  const seen = new Set(items.map((x) => safeString(x.i)).filter(Boolean))
  if (!seen.has(base)) return base
  let i = 2
  while (seen.has(`${base}-${i}`)) i += 1
  return `${base}-${i}`
}

function parseBackendLayout(payload: unknown): LayoutJson | null {
  if (!payload || typeof payload !== 'object') return null
  const layout = (payload as any).layout
  if (!layout || typeof layout !== 'object') return null
  const items = Array.isArray((layout as any).items) ? (layout as any).items : []
  if (!Array.isArray(items)) return null
  const cols = safeNumber((layout as any).cols, gridCfg.value.cols)
  const maxRows = safeNumber((layout as any).maxRows, gridCfg.value.maxRows)
  return {
    version: safeNumber((layout as any).version, 1),
    cols,
    maxRows,
    items: items
      .map((x: any) => ({
        i: safeString(x?.id) || safeString(x?.cardId),
        cardId: safeString(x?.cardId),
        x: safeNumber(x?.x, 0),
        y: safeNumber(x?.y, 0),
        w: safeNumber(x?.w, 1),
        h: safeNumber(x?.h, 1),
        minW: x?.minW != null ? safeNumber(x.minW, 1) : undefined,
        minH: x?.minH != null ? safeNumber(x.minH, 1) : undefined,
        maxW: x?.maxW != null ? safeNumber(x.maxW, cols) : undefined,
        maxH: x?.maxH != null ? safeNumber(x.maxH, maxRows) : undefined,
        hidden: typeof x?.hidden === 'boolean' ? x.hidden : undefined,
      }))
      .filter((x: LayoutItem) => x.cardId),
  }
}

function normalizeLayout(layout: LayoutJson): LayoutJson {
  const cols = gridCfg.value.cols
  const maxRows = gridCfg.value.maxRows
  const base: LayoutJson = {
    version: safeNumber(layout.version, 1),
    cols,
    maxRows,
    items: (Array.isArray(layout.items) ? layout.items : [])
      .map((x) => ({ ...x, i: safeString((x as any).i) || safeString((x as any).id) || safeString((x as any).cardId) }))
      .filter((x) => safeString(x.i) && safeString(x.cardId))
      .map((x) => clampItem(x, cols, maxRows)),
  }
  const placed: LayoutItem[] = []
  for (const raw of [...base.items].sort((a, b) => (a.y - b.y) || (a.x - b.x))) {
    let it = clampItem(raw, cols, maxRows)
    let moved = true
    while (moved) {
      moved = false
      for (const p of placed) {
        if (!isOverlap(it, p)) continue
        it = clampItem({ ...it, y: it.y + 1 }, cols, maxRows)
        moved = true
        break
      }
      if (it.y + it.h > maxRows) break
    }
    placed.push(it)
  }
  return { ...base, items: placed }
}

function toBackendLayout(layout: LayoutJson): Record<string, unknown> {
  const cols = gridCfg.value.cols
  const maxRows = gridCfg.value.maxRows
  const normalized = normalizeLayout(layout)
  return {
    version: safeNumber(normalized.version, 1),
    cols,
    maxRows,
    items: normalized.items.map((it) => ({
      id: it.i,
      cardId: it.cardId,
      x: it.x,
      y: it.y,
      w: it.w,
      h: it.h,
      minW: it.minW,
      minH: it.minH,
      maxW: it.maxW,
      maxH: it.maxH,
      hidden: it.hidden === true ? true : undefined,
    })),
  }
}

const activeLayout = computed<LayoutJson>(() => {
  const base = activeTab.value === 'user' ? userLayout.value : groupLayout.value
  return normalizeLayout(base ?? buildGlobalDefaultLayout())
})

const gridCfg = computed(() => {
  const grid = getRuntime()?.dashboard?.layout?.grid ?? {}
  const cols = Math.max(1, safeNumber(grid?.cols, 10))
  const maxRows = Math.max(1, safeNumber(grid?.maxRows, 50))
  const rowHeight = 30
  const marginX = 8
  const marginY = 8
  return { cols, maxRows, rowHeight, marginX, marginY }
})

const dropzoneStyle = computed(() => {
  const w = '100%'
  const h = `${gridCfg.value.maxRows * gridCfg.value.rowHeight + gridCfg.value.marginY}px`
  return {
    width: w,
    height: h,
    '--cols': String(gridCfg.value.cols),
    '--row-height-px': `${gridCfg.value.rowHeight}px`,
  } as any
})

const layoutModel = computed<LayoutItem[]>({
  get: () => activeLayout.value.items,
  set: (next) => {
    const cols = gridCfg.value.cols
    const maxRows = gridCfg.value.maxRows
    const normalizedItems = (Array.isArray(next) ? next : []).map((x) => clampItem(x, cols, maxRows))
    const base = activeLayout.value
    const out: LayoutJson = { ...base, cols, maxRows, items: normalizedItems }
    if (activeTab.value === 'user') userLayout.value = out
    else groupLayout.value = out
  },
})

function removeItem(itemId: string): void {
  const id = safeString(itemId)
  if (!id) return
  const next = layoutModel.value.filter((x) => safeString(x.i) !== id)
  layoutModel.value = next
  if (selectedId.value === id) selectedId.value = ''
}

const selectedItem = computed(() => {
  const id = safeString(selectedId.value)
  if (!id) return null
  return layoutModel.value.find((x) => safeString(x.i) === id) ?? null
})

function selectItem(id: string): void {
  selectedId.value = safeString(id)
}

function removeSelected(): void {
  const it = selectedItem.value
  if (!it) return
  removeItem(it.i)
}

function duplicateSelected(): void {
  const it = selectedItem.value
  if (!it) return
  const cols = gridCfg.value.cols
  const maxRows = gridCfg.value.maxRows
  const items = [...layoutModel.value]
  const nextId = uniqItemId(it.cardId, items)
  const pos = findFirstFreeSpot(items, cols, maxRows, it.w, it.h)
  items.push(clampItem({ ...it, i: nextId, x: pos.x, y: pos.y }, cols, maxRows))
  layoutModel.value = items
  selectedId.value = nextId
}

function onItemMove(i: number | string, newX: number, newY: number): void {
  selectedId.value = safeString(i)
  const id = safeString(i)
  if (!id) return
  const items = [...layoutModel.value]
  const idx = items.findIndex((x) => safeString(x.i) === id)
  if (idx < 0) return
  items[idx] = { ...items[idx], x: newX, y: newY }
  layoutModel.value = items
}

function onItemMoved(i: number | string): void {
  selectedId.value = safeString(i)
}

function onItemResize(i: number | string, newH: number, newW: number): void {
  selectedId.value = safeString(i)
  const id = safeString(i)
  if (!id) return
  const items = [...layoutModel.value]
  const idx = items.findIndex((x) => safeString(x.i) === id)
  if (idx < 0) return
  items[idx] = { ...items[idx], w: newW, h: newH }
  layoutModel.value = items
}

function onItemResized(i: number | string): void {
  selectedId.value = safeString(i)
}

function onCardDragStart(ev: DragEvent, cardId: string): void {
  const id = safeString(cardId)
  if (!id) return
  try {
    ev.dataTransfer?.setData('text/plain', id)
    ev.dataTransfer?.setData('application/x-card-id', id)
  } catch {}
}

function addCardToLayout(cardId: string, dropX: number, dropY: number): void {
  const id = safeString(cardId)
  if (!id) return
  const cols = gridCfg.value.cols
  const maxRows = gridCfg.value.maxRows
  const items = [...layoutModel.value]
  const reg = registryCards.value.find((x) => x.cardId === id)
  const ds = reg?.defaultSize ?? { w: 2, h: 6, minW: 1, minH: 1, maxW: cols, maxH: maxRows }
  const w = Math.max(1, Math.min(cols, safeNumber(ds.w, 2)))
  const h = Math.max(1, Math.min(maxRows, safeNumber(ds.h, 6)))
  const desired = clampItem({ i: 'probe', cardId: id, x: dropX, y: dropY, w, h }, cols, maxRows)
  const pos = findFirstFreeSpot(items, cols, maxRows, desired.w, desired.h)
  const nextId = uniqItemId(id, items)
  items.push({
    i: nextId,
    cardId: id,
    x: pos.x,
    y: pos.y,
    w: desired.w,
    h: desired.h,
    minW: ds.minW,
    minH: ds.minH,
    maxW: ds.maxW,
    maxH: ds.maxH,
    hidden: false,
  })
  layoutModel.value = items
}

function onGridDrop(ev: DragEvent): void {
  const cardId = safeString(ev.dataTransfer?.getData('application/x-card-id') || ev.dataTransfer?.getData('text/plain'))
  if (!cardId) return
  const el = (ev.currentTarget as HTMLElement | null) ?? null
  const rect = el?.getBoundingClientRect()
  if (!rect) return
  const colW = rect.width / Math.max(1, gridCfg.value.cols)
  const x = Math.floor((ev.clientX - rect.left) / colW)
  const y = Math.floor((ev.clientY - rect.top) / gridCfg.value.rowHeight)
  addCardToLayout(cardId, x, y)
}

function hasRuntimeCards(rt: any): boolean {
  const reg = rt?.dashboard?.cards?.registry
  return Array.isArray(reg) && reg.length > 0
}

async function refreshRuntime(): Promise<void> {
  const winRt = (globalThis as any)?.window?.__PORTAL_RUNTIME__
  if (hasRuntimeCards(winRt)) {
    runtime.value = winRt
    return
  }
  try {
    const res = await (API as any).GetConfig({ dataId: 'portal-runtime.json', group: 'PORTAL_GROUP' })
    const next = (res as any)?.data ?? res
    if (hasRuntimeCards(next)) {
      runtime.value = next
      return
    }
  } catch {}
  runtime.value = winRt ?? null
}

async function bootstrap(): Promise<void> {
  loading.value = true
  userError.value = ''
  groupError.value = ''
  try {
    await refreshRuntime()
    const me = await API.PermMe()
    const data = safeObject((me as any)?.data)
    userId.value = safeString(data.userId)
    groups.value = Array.isArray((data as any).groups) ? ((data as any).groups as unknown[]).map((x) => safeString(x)).filter(Boolean) : []
    isAdmin.value = normalizeStringList(groups.value.map((g) => normalizeGroupId(g))).includes('admin')
    await refreshGroups()
    await searchUsers()
    if (!groupId.value && groupOptions.value.length) groupId.value = groupOptions.value[0]
    await loadUser()
  } finally {
    loading.value = false
  }
}

async function refreshGroups(): Promise<void> {
  try {
    const [g1, g2] = await Promise.all([(API as any).PermGroups(), (API as any).PermKeycloakGroups()])
    const a = Array.isArray(g1?.data?.items) ? (g1.data.items as any[]) : []
    const b = Array.isArray(g2?.data?.items) ? (g2.data.items as any[]) : []
    const fromA = a.map((x) => safeString(x?.group_path)).filter(Boolean)
    const fromB = b.map((x) => safeString(x)).filter(Boolean)
    allGroups.value = normalizeStringList([...fromA, ...fromB])
    isAdmin.value = true
  } catch {
    allGroups.value = []
  }
}

async function searchUsers(): Promise<void> {
  if (!isAdmin.value) return
  try {
    const q = safeString(userSearchText.value)
    const res = await (API as any).PermUsers({ search: q, first: 0, max: 100 })
    const items = Array.isArray(res?.data?.items) ? (res.data.items as any[]) : []
    users.value = items
      .filter((x) => x && typeof x.id === 'string' && safeString(x.id))
      .map((x) => ({
        id: safeString(x.id),
        username: safeString(x.username) || undefined,
        email: safeString(x.email) || undefined,
        displayName: safeString(x.displayName) || undefined,
      }))
  } catch {
    users.value = []
  }
}

async function loadUser(): Promise<void> {
  const uid = safeString(userId.value)
  if (!uid) return
  loading.value = true
  userError.value = ''
  try {
    const res = await API.DashboardLayoutUserGet({ userId: uid })
    const payload = (res as any)?.data
    const parsed = parseBackendLayout(payload)
    userLayout.value = parsed ? normalizeLayout(parsed) : normalizeLayout(buildGlobalDefaultLayout())
  } catch (e) {
    userError.value = String((e as any)?.message || 'Load failed')
  } finally {
    loading.value = false
  }
}

async function saveUser(): Promise<void> {
  const uid = safeString(userId.value)
  const layout = uid ? activeLayout.value : null
  if (!uid || !layout) return
  loading.value = true
  userError.value = ''
  try {
    await API.DashboardLayoutUserPut({ userId: uid, layout: toBackendLayout(layout) })
    ElNotification({ title: 'Saved', message: 'User layout saved.', type: 'success' })
  } catch (e) {
    userError.value = String((e as any)?.message || 'Save failed')
    ElNotification({ title: 'Save failed', message: userError.value, type: 'error' })
  } finally {
    loading.value = false
  }
}

async function resetUserToGroup(): Promise<void> {
  const uid = safeString(userId.value)
  if (!uid) return
  loading.value = true
  userError.value = ''
  try {
    await API.DashboardLayoutUserDelete({ userId: uid })
    userLayout.value = null
    ElNotification({ title: 'Reset', message: 'User layout deleted.', type: 'success' })
  } catch (e) {
    userError.value = String((e as any)?.message || 'Reset failed')
    ElNotification({ title: 'Reset failed', message: userError.value, type: 'error' })
  } finally {
    loading.value = false
  }
}

function resetUserToGlobal(): void {
  userError.value = ''
  userLayout.value = normalizeLayout(buildGlobalDefaultLayout())
}

async function loadGroup(): Promise<void> {
  const gid = safeString(groupId.value)
  if (!gid) return
  loading.value = true
  groupError.value = ''
  try {
    const res = await API.DashboardLayoutGroupGet({ groupId: gid })
    const payload = (res as any)?.data
    const parsed = parseBackendLayout(payload)
    groupLayout.value = parsed ? normalizeLayout(parsed) : normalizeLayout(buildGlobalDefaultLayout())
  } catch (e) {
    groupError.value = String((e as any)?.message || 'Load failed')
  } finally {
    loading.value = false
  }
}

async function saveGroup(): Promise<void> {
  const gid = safeString(groupId.value)
  const layout = gid ? activeLayout.value : null
  if (!gid || !layout) return
  loading.value = true
  groupError.value = ''
  try {
    await API.DashboardLayoutGroupPut({ groupId: gid, layout: toBackendLayout(layout) })
    ElNotification({ title: 'Saved', message: 'Group layout saved.', type: 'success' })
  } catch (e) {
    groupError.value = String((e as any)?.message || 'Save failed')
    ElNotification({ title: 'Save failed', message: groupError.value, type: 'error' })
  } finally {
    loading.value = false
  }
}

function resetGroupToGlobal(): void {
  groupError.value = ''
  groupLayout.value = normalizeLayout(buildGlobalDefaultLayout())
}

onMounted(() => {
  bootstrap().catch(() => {})
})

const onKeydown = (ev: KeyboardEvent) => {
  if (ev.key === 'Delete' || ev.key === 'Backspace') removeSelected()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.layout-settings {
  padding: var(--spacing-md);
}

.layout-guard {
  padding: var(--spacing-sm) 0;
  color: var(--color-text-secondary);
}

.error {
  margin-top: var(--spacing-md);
  color: var(--el-color-danger);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  flex-wrap: wrap;
}

.editor {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: var(--spacing-md);
  align-items: start;
}

.panel-title {
  font-family: var(--font-family-semibold);
  margin-bottom: var(--spacing-sm);
}

.panel-left {
  border: 1px solid var(--el-border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  background: var(--color-bg-card, var(--el-bg-color));
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  max-height: 620px;
  overflow: auto;
}

.card-list-empty {
  padding: var(--spacing-sm);
  color: var(--color-text-secondary);
}

.card-list-item {
  border: 1px solid var(--el-border-color);
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm);
  background: var(--el-bg-color);
  cursor: grab;
  user-select: none;
}

.card-list-item:active {
  cursor: grabbing;
}

.card-list-item__title {
  color: var(--color-text-primary);
}

.card-list-item__meta {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
}

.panel-right {
  border: 1px solid var(--el-border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  background: var(--color-bg-card, var(--el-bg-color));
  overflow: auto;
}

.layout-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) 0;
  margin-bottom: var(--spacing-sm);
}

.layout-status__text {
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.layout-status__actions {
  display: inline-flex;
  gap: var(--spacing-sm);
  flex: 0 0 auto;
}

.layout-dropzone {
  border: 1px solid var(--el-border-color);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.layout-dropzone :deep(.vgl-layout) {
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px);
  background-size: calc(100% / var(--cols)) var(--row-height-px);
  background-repeat: repeat;
}

.grid-item {
  height: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: var(--radius-sm);
  background: var(--el-bg-color);
  overflow: hidden;
}

.grid-item--hidden {
  opacity: 0.45;
}

.grid-item--selected {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -2px;
}

.grid-item__header {
  padding: var(--spacing-xs) var(--spacing-sm);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: move;
}

.grid-item__title {
  font-family: var(--font-family-semibold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.grid-item__actions {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 0 0 auto;
}

.layout-dropzone :deep(.vgl-item__resizer) {
  width: 10px;
  height: 10px;
  right: 0;
  bottom: 0;
  border-right: 2px solid rgba(0,0,0,0.35);
  border-bottom: 2px solid rgba(0,0,0,0.35);
}
</style>
