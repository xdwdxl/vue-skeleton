<template>
  <div class="perm-tree">
    <div class="perm-tree__title">{{ title }}</div>
    <ElInput v-model="filterText" clearable :placeholder="$t('perm.filter_perms')" />
    <ElScrollbar :height="height">
      <ElTree
        ref="treeRef"
        class="perm-tree__tree"
        :data="treeData"
        node-key="id"
        show-checkbox
        :default-expand-all="!lazy"
        :expand-on-click-node="false"
        :check-on-click-node="true"
        :filter-node-method="filterNode"
        :lazy="lazy"
        :load="internalLoad"
        @check="handleCheck"
      />
    </ElScrollbar>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ElInput, ElScrollbar, ElTree } from 'element-plus'
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/scrollbar/style/css'
import 'element-plus/es/components/tree/style/css'
type PermCatalogItem = {
  key: string
  name: string
  appId: string
  path?: string[]
  action?: string
  moduleLabel?: string
  domainLabel?: string
  actionLabel?: string
}
type TreeNode = {
  id: string
  label: string
  children?: TreeNode[]
}
const PATH_NODE_PREFIX = '__perm_path__'
const UNKNOWN_ROOT_ID = '__perm_unknown__'
const props = withDefaults(defineProps<{
  modelValue: string[]
  items: PermCatalogItem[]
  title?: string
  height?: number | string
  lazy?: boolean
  load?: (node: any, resolve: (data: TreeNode[]) => void) => void
  isKnown?: (key: string) => boolean
}>(), {
  title: undefined,
  height: 420,
})
const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()
const treeRef = ref<InstanceType<typeof ElTree> | null>(null)
const filterText = ref('')
const knownKeySet = computed(() => new Set(props.items.map((x) => String(x?.key ?? '').trim()).filter(Boolean)))
const unknownKeys = computed(() => {
  const out: string[] = []
  const seen = new Set<string>()
  for (const k of props.modelValue || []) {
    const s = String(k ?? '').trim()
    if (!s || seen.has(s)) continue
    let isKnown = false
    if (props.isKnown) {
      if (props.isKnown(s)) isKnown = true
    } else {
      if (knownKeySet.value.has(s)) isKnown = true
    }
    if (isKnown) continue
    seen.add(s)
    out.push(s)
  }
  return out
})
function buildLeafLabel(it: PermCatalogItem): string {
  const action = String(it?.actionLabel ?? it?.action ?? '').trim()
  const name = String(it?.name ?? '').trim()
  const head = action ? `${name} · ${action}` : name
  return head ? `${head} (${it.key})` : it.key
}
function pickPathSegments(it: PermCatalogItem): string[] {
  const raw = Array.isArray(it?.path) ? it.path : []
  const segs = raw.map((x) => String(x ?? '').trim()).filter(Boolean)
  if (segs.length > 0) return segs
  const appId = String(it?.appId ?? '').trim()
  return appId ? [appId] : []
}
function pickPathLabel(it: PermCatalogItem, seg: string, idx: number): string {
  if (idx === 0) return String(it?.moduleLabel ?? seg).trim() || seg
  if (idx === 1) return String(it?.domainLabel ?? seg).trim() || seg
  return seg
}
function buildTree(items: PermCatalogItem[], unknown: string[]): TreeNode[] {
  const roots: TreeNode[] = []
  const index = new Map<string, TreeNode>()
  function ensureNode(id: string, label: string): TreeNode {
    const existing = index.get(id)
    if (existing) return existing
    const node: TreeNode = { id, label, children: [] }
    index.set(id, node)
    return node
  }
  function linkChild(parent: TreeNode, child: TreeNode): void {
    const arr = parent.children || (parent.children = [])
    if (!arr.some((x) => x.id === child.id)) arr.push(child)
  }
  for (const it of items || []) {
    const key = String(it?.key ?? '').trim()
    const name = String(it?.name ?? '').trim()
    if (!key || !name) continue
    const segs = pickPathSegments(it)
    const appId = String(it?.appId ?? '').trim() || 'app'
    let parent: TreeNode | null = null
    let currentPath = ''
    for (let i = 0; i < segs.length; i += 1) {
      const seg = segs[i]
      currentPath = currentPath ? `${currentPath}/${seg}` : seg
      const id = `${PATH_NODE_PREFIX}:${appId}:${currentPath}`
      const label = pickPathLabel(it, seg, i)
      const node = ensureNode(id, label)
      if (parent) {
        linkChild(parent, node)
      } else if (!roots.some((x) => x.id === node.id)) {
        roots.push(node)
      }
      parent = node
    }
    const leaf: TreeNode = { id: key, label: buildLeafLabel(it) }
    if (parent) {
      linkChild(parent, leaf)
    } else {
      roots.push(leaf)
    }
  }
  if (unknown.length > 0) {
    const root: TreeNode = { id: UNKNOWN_ROOT_ID, label: 'Unknown', children: [] }
    for (const k of unknown) {
      root.children!.push({ id: k, label: `Unknown (${k})` })
    }
    roots.push(root)
  }
  return roots
}
const treeData = computed(() => {
  if (props.lazy) return []
  return buildTree(props.items, unknownKeys.value)
})
function internalLoad(node: any, resolve: (data: TreeNode[]) => void): void {
  if (node.level === 0) {
    const roots: TreeNode[] = []
    const finish = () => {
      if (unknownKeys.value.length > 0) {
        const root: TreeNode = { id: UNKNOWN_ROOT_ID, label: 'Unknown', children: [] }
        for (const k of unknownKeys.value) {
          root.children = root.children || []
          root.children.push({ id: k, label: `Unknown (${k})` })
        }
        roots.push(root)
      }
      resolve(roots)
      nextTick(() => syncChecked())
    }
    if (props.load) {
      props.load(node, (data) => {
        if (Array.isArray(data)) roots.push(...data)
        finish()
      })
    } else {
      finish()
    }
  } else if (node.data.id === UNKNOWN_ROOT_ID) {
    const children = unknownKeys.value.map((k) => ({ id: k, label: `Unknown (${k})`, isLeaf: true }))
    resolve(children)
    nextTick(() => syncChecked())
  } else {
    if (props.load) {
      props.load(node, (data) => {
        resolve(data)
        nextTick(() => syncChecked())
      })
    } else {
      resolve([])
    }
  }
}
function normalizeSelected(keys: unknown): string[] {
  const raw = Array.isArray(keys) ? keys : []
  const out: string[] = []
  const seen = new Set<string>()
  for (const v of raw) {
    const s = String(v ?? '').trim()
    if (!s || seen.has(s)) continue
    if (s.startsWith(PATH_NODE_PREFIX) || s === UNKNOWN_ROOT_ID) continue
    seen.add(s)
    out.push(s)
  }
  return out
}
function syncChecked(): void {
  const keys = normalizeSelected(props.modelValue)
  try { treeRef.value?.setCheckedKeys(keys, false) } catch {}
}
function handleCheck(): void {
  const loadedKeys = new Set<string>()
  try {
    const nodesMap = (treeRef.value?.store as any)?.nodesMap || {}
    for (const k in nodesMap) {
      const node = nodesMap[k]
      // Only consider loaded leaf nodes or nodes that are actually in the tree structure
      if (node && !node.isLeaf) continue 
      // Actually checking if it is a leaf in our data model
      // But node.isLeaf is from Element Plus. 
      // If we assume all permissions are leaves, checking node.isLeaf is correct for loaded nodes.
      // But 'Unknown' nodes are also leaves.
      if (node && node.checked !== undefined) loadedKeys.add(String(k))
    }
  } catch {}
  
  // Current checked keys from tree (only loaded ones)
  const currentChecked = (() => {
    try { return treeRef.value?.getCheckedKeys(true) } catch { return [] }
  })()
  const currentCheckedSet = new Set(normalizeSelected(currentChecked))
  
  // Keys in modelValue that are NOT loaded/visible in the tree should be preserved
  const preserved: string[] = []
  for (const k of props.modelValue) {
    if (!loadedKeys.has(k)) {
      preserved.push(k)
    }
  }
  
  emit('update:modelValue', normalizeSelected([...preserved, ...currentCheckedSet]))
}
function filterNode(value: string, data: unknown): boolean {
  const v = String(value ?? '').trim().toLowerCase()
  if (!v) return true
  const label = String((data as { label?: unknown } | null)?.label ?? '')
  return label.toLowerCase().includes(v)
}
watch(filterText, (v) => {
  try { treeRef.value?.filter(String(v ?? '')) } catch {}
})
watch([() => props.items, () => props.modelValue], async () => {
  await nextTick()
  syncChecked()
}, { immediate: true })
</script>
<style scoped>
.perm-tree { display: flex; flex-direction: column; gap: var(--spacing-sm-plus); width: 100%; }
.perm-tree__title { font-weight: 600; }
.perm-tree__tree { padding: var(--spacing-sm) 0; }
</style>
