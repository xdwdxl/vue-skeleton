<!--
  @file PortalTree.vue - Tree component
  @author Vicky Zhu
  @date 2026-03-13
  @description Wraps el-tree with folder/document icons, expand/collapse toggle, checkbox, drag-and-drop and lazy loading
-->
<template>
  <div class="portal-tree-container">
    <el-tree
      ref="treeRef"
      :style="{ maxWidth: maxWidth }"
      :data="data"
      :props="treeProps"
      :icon="icon"
      :render-after-expand="renderAfterExpand"
      :render-content="renderContent"
      :default-expand-all="defaultExpandAll"
      :default-expanded-keys="defaultExpandedKeys"
      :node-key="nodeKey"
      :empty-text="emptyText"
      :highlight-current="highlightCurrent"
      :expand-on-click-node="expandOnClickNode"
      :check-on-click-node="checkOnClickNode"
      :check-on-click-leaf="checkOnClickLeaf"
      :auto-expand-parent="autoExpandParent"
      :show-checkbox="showCheckbox"
      :check-strictly="checkStrictly"
      :default-checked-keys="defaultCheckedKeys"
      :current-node-key="currentNodeKey"
      :filter-node-method="filterNodeMethod"
      :accordion="accordion"
      :indent="indent"
      :lazy="lazy"
      :load="load"
      :draggable="draggable"
      :allow-drag="allowDrag"
      :allow-drop="allowDrop"
      @node-click="onNodeClick"
      @node-contextmenu="onNodeContextmenu"
      @check-change="onCheckChange"
      @check="onCheck"
      @current-change="onCurrentChange"
      @node-expand="onNodeExpand"
      @node-collapse="onNodeCollapse"
      @node-drag-start="onNodeDragStart"
      @node-drag-enter="onNodeDragEnter"
      @node-drag-leave="onNodeDragLeave"
      @node-drag-over="onNodeDragOver"
      @node-drag-end="onNodeDragEnd"
      @node-drop="onNodeDrop"
    >
      <template #default="{ node, data: nodeData }">
        <slot
          name="default"
          :node="node"
          :data="nodeData"
        >
          <span class="custom-tree-node">
            <span
              v-if="node.childNodes?.length"
              class="toggle-icon"
            >
              {{ node.expanded ? '−' : '+' }}
            </span>
            <el-icon class="folder-icon">
              <FolderOpened v-if="node.expanded && node.childNodes?.length" />
              <Folder v-else-if="node.childNodes?.length" />
              <Document v-else />
            </el-icon>
            <span class="node-label">{{ node.label }}</span>
          </span>
        </slot>
      </template>
      <template
        v-if="$slots.empty"
        #empty
      >
        <slot name="empty" />
      </template>
    </el-tree>
  </div>
</template>

<script lang="ts" setup>
  /**
   * @component PortalTree - Tree component with custom node rendering
   * @author Vicky Zhu
   * @date 2026-03-16
   * @props {TreeNode[]} data - Tree data source
   * @props {string} [nodeKey='label'] - Unique identity key name for nodes
   * @props {string} [maxWidth='600px'] - Maximum width of tree container
   * @props {boolean} [defaultExpandAll=false] - Whether to expand all nodes by default
   * @props {(string|number)[]} [defaultExpandedKeys] - Array of keys of initially expanded nodes
   * @props {string} [labelKey='label'] - Key name for node label in data
   * @props {string} [childrenKey='children'] - Key name for child nodes in data
   * @props {string} [disabledKey='disabled'] - Key name for disabled state in data
   * @props {string} [isLeafKey=''] - Key name for leaf node flag (lazy load only)
   * @props {string} [emptyText=''] - Text displayed when data is empty
   * @props {boolean} [highlightCurrent=false] - Whether current node is highlighted
   * @props {boolean} [expandOnClickNode=true] - Whether to expand/collapse on node click
   * @props {boolean} [checkOnClickNode=false] - Whether to check/uncheck on node click
   * @props {boolean} [checkOnClickLeaf=true] - Whether to check/uncheck on leaf node click
   * @props {boolean} [autoExpandParent=true] - Whether to expand parent when child expands
   * @props {boolean} [showCheckbox=false] - Whether to show checkboxes
   * @props {boolean} [checkStrictly=false] - Whether check state does not affect parent/child
   * @props {(string|number)[]} [defaultCheckedKeys] - Array of keys of initially checked nodes
   * @props {string|number} [currentNodeKey] - Key of initially selected node
   * @props {Function} [filterNodeMethod] - Filter method executed on each node
   * @props {boolean} [accordion=false] - Whether only one node at same level can expand
   * @props {number} [indent=18] - Horizontal indentation in pixels
   * @props {Component|null} [icon=null] - Custom tree node icon component
   * @props {boolean} [renderAfterExpand=true] - Whether to render children only after parent expands
   * @props {Function} [renderContent] - Render function for tree node content
   * @props {boolean} [lazy=false] - Whether to lazy load leaf nodes
   * @props {Function} [load] - Method for loading subtree data (lazy mode only)
   * @props {boolean} [draggable=false] - Whether to enable drag-and-drop
   * @props {Function} [allowDrag] - Executed before dragging a node
   * @props {Function} [allowDrop] - Executed before dropping a node
   * @emits {TreeNode, any, any} node-click - Triggered when a node is clicked
   * @emits {Event, TreeNode, any, any} node-contextmenu - Triggered when node is right-clicked
   * @emits {TreeNode, boolean, boolean} check-change - Triggered when node check state changes
   * @emits {TreeNode, object} check - Triggered after clicking node checkbox
   * @emits {TreeNode, any} current-change - Triggered when current node changes
   * @emits {TreeNode, any, any} node-expand - Triggered when a node is expanded
   * @emits {TreeNode, any, any} node-collapse - Triggered when a node is collapsed
   * @emits {any, DragEvent} node-drag-start - Triggered when dragging starts
   * @emits {any, any, DragEvent} node-drag-enter - Triggered when dragging node enters another
   * @emits {any, any, DragEvent} node-drag-leave - Triggered when dragging node leaves a node
   * @emits {any, any, DragEvent} node-drag-over - Triggered when dragging over a node
   * @emits {any, any, string, DragEvent} node-drag-end - Triggered when dragging ends
   * @emits {any, any, string, DragEvent} node-drop - Triggered after node is dropped
   * @slot default - Custom node content, receives { node, data }
   * @slot empty - Content when tree has no data
   */

  import { ref, type Component } from 'vue'
  import { Folder, FolderOpened, Document } from '@element-plus/icons-vue'
  import type { TreeNode } from '@/types/components'

  interface Props {
    data?: TreeNode[]
    nodeKey?: string
    maxWidth?: string
    defaultExpandAll?: boolean
    defaultExpandedKeys?: (string | number)[]
    labelKey?: string
    childrenKey?: string
    disabledKey?: string
    isLeafKey?: string
    emptyText?: string
    highlightCurrent?: boolean
    expandOnClickNode?: boolean
    checkOnClickNode?: boolean
    checkOnClickLeaf?: boolean
    autoExpandParent?: boolean
    showCheckbox?: boolean
    checkStrictly?: boolean
    defaultCheckedKeys?: (string | number)[]
    currentNodeKey?: string | number
    filterNodeMethod?: (value: string, data: TreeNode, node: any) => boolean
    accordion?: boolean
    indent?: number
    icon?: Component | null
    renderAfterExpand?: boolean
    renderContent?: (h: any, context: { node: any; data: TreeNode; store: any }) => any
    lazy?: boolean
    load?: (node: any, resolve: (data: TreeNode[]) => void) => void
    draggable?: boolean
    allowDrag?: (node: any) => boolean
    allowDrop?: (draggingNode: any, dropNode: any, type: string) => boolean
  }

  defineOptions({ name: 'PortalTree' })

  const props = withDefaults(defineProps<Props>(), {
    data: () => [],
    nodeKey: 'label',
    maxWidth: '600px',
    defaultExpandAll: false,
    defaultExpandedKeys: () => [],
    labelKey: 'label',
    childrenKey: 'children',
    disabledKey: 'disabled',
    isLeafKey: '',
    emptyText: '',
    highlightCurrent: false,
    expandOnClickNode: true,
    checkOnClickNode: false,
    checkOnClickLeaf: true,
    autoExpandParent: true,
    showCheckbox: false,
    checkStrictly: false,
    defaultCheckedKeys: () => [],
    accordion: false,
    indent: 18,
    icon: null,
    renderAfterExpand: true,
    lazy: false,
    draggable: false,
  })

  const emit = defineEmits<{
    'node-click': [data: TreeNode, node: any, instance: any]
    'node-contextmenu': [event: Event, data: TreeNode, node: any, instance: any]
    'check-change': [data: TreeNode, checked: boolean, indeterminate: boolean]
    check: [
      data: TreeNode,
      checkedState: {
        checkedNodes: TreeNode[]
        checkedKeys: (string | number)[]
        halfCheckedNodes: TreeNode[]
        halfCheckedKeys: (string | number)[]
      },
    ]
    'current-change': [data: TreeNode, node: any]
    'node-expand': [data: TreeNode, node: any, instance: any]
    'node-collapse': [data: TreeNode, node: any, instance: any]
    'node-drag-start': [node: any, event: DragEvent]
    'node-drag-enter': [draggingNode: any, dropNode: any, event: DragEvent]
    'node-drag-leave': [draggingNode: any, dropNode: any, event: DragEvent]
    'node-drag-over': [draggingNode: any, dropNode: any, event: DragEvent]
    'node-drag-end': [draggingNode: any, dropNode: any, dropType: string, event: DragEvent]
    'node-drop': [draggingNode: any, dropNode: any, dropType: string, event: DragEvent]
  }>()

  const treeRef = ref()

  const treeProps = {
    children: props.childrenKey,
    label: props.labelKey,
    disabled: props.disabledKey,
    ...(props.isLeafKey && { isLeaf: props.isLeafKey }),
  }

  /**
   * Handle node click event
   * @author Vicky Zhu
   * @param {TreeNode} data - Node data
   * @param {any} node - Tree node instance
   * @param {any} instance - Tree component instance
   */
  const onNodeClick = (data: TreeNode, node: any, instance: any) => {
    emit('node-click', data, node, instance)
  }

  /**
   * Handle node context menu event
   * @author Vicky Zhu
   * @param {Event} event - Context menu event
   * @param {TreeNode} data - Node data
   * @param {any} node - Tree node instance
   * @param {any} instance - Tree component instance
   */
  const onNodeContextmenu = (event: Event, data: TreeNode, node: any, instance: any) => {
    emit('node-contextmenu', event, data, node, instance)
  }

  /**
   * Handle check state change for a single node
   * @author Vicky Zhu
   * @param {TreeNode} data - Node data
   * @param {boolean} checked - Whether the node is checked
   * @param {boolean} indeterminate - Whether the node is in indeterminate state
   */
  const onCheckChange = (data: TreeNode, checked: boolean, indeterminate: boolean) => {
    emit('check-change', data, checked, indeterminate)
  }

  /**
   * Handle checkbox click event with full checked state
   * @author Vicky Zhu
   * @param {TreeNode} data - Node data
   * @param {any} checkedState - Object containing checkedNodes, checkedKeys, halfCheckedNodes, halfCheckedKeys
   */
  const onCheck = (data: TreeNode, checkedState: any) => {
    emit('check', data, checkedState)
  }

  /**
   * Handle current node change
   * @author Vicky Zhu
   * @param {TreeNode} data - Node data
   * @param {any} node - Tree node instance
   */
  const onCurrentChange = (data: TreeNode, node: any) => {
    emit('current-change', data, node)
  }

  /**
   * Handle node expand event
   * @author Vicky Zhu
   * @param {TreeNode} data - Node data
   * @param {any} node - Tree node instance
   * @param {any} instance - Tree component instance
   */
  const onNodeExpand = (data: TreeNode, node: any, instance: any) => {
    emit('node-expand', data, node, instance)
  }

  /**
   * Handle node collapse event
   * @author Vicky Zhu
   * @param {TreeNode} data - Node data
   * @param {any} node - Tree node instance
   * @param {any} instance - Tree component instance
   */
  const onNodeCollapse = (data: TreeNode, node: any, instance: any) => {
    emit('node-collapse', data, node, instance)
  }

  /**
   * Handle node drag start event
   * @author Vicky Zhu
   * @param {any} node - Dragging node
   * @param {DragEvent} event - Drag event
   */
  const onNodeDragStart = (node: any, event: DragEvent) => {
    emit('node-drag-start', node, event)
  }

  /**
   * Handle node drag enter event
   * @author Vicky Zhu
   * @param {any} draggingNode - Dragging node
   * @param {any} dropNode - Target drop node
   * @param {DragEvent} event - Drag event
   */
  const onNodeDragEnter = (draggingNode: any, dropNode: any, event: DragEvent) => {
    emit('node-drag-enter', draggingNode, dropNode, event)
  }

  /**
   * Handle node drag leave event
   * @author Vicky Zhu
   * @param {any} draggingNode - Dragging node
   * @param {any} dropNode - Target drop node
   * @param {DragEvent} event - Drag event
   */
  const onNodeDragLeave = (draggingNode: any, dropNode: any, event: DragEvent) => {
    emit('node-drag-leave', draggingNode, dropNode, event)
  }

  /**
   * Handle node drag over event
   * @author Vicky Zhu
   * @param {any} draggingNode - Dragging node
   * @param {any} dropNode - Target drop node
   * @param {DragEvent} event - Drag event
   */
  const onNodeDragOver = (draggingNode: any, dropNode: any, event: DragEvent) => {
    emit('node-drag-over', draggingNode, dropNode, event)
  }

  /**
   * Handle node drag end event
   * @author Vicky Zhu
   * @param {any} draggingNode - Dragging node
   * @param {any} dropNode - Target drop node
   * @param {string} dropType - Drop type: before, after, inner
   * @param {DragEvent} event - Drag event
   */
  const onNodeDragEnd = (draggingNode: any, dropNode: any, dropType: string, event: DragEvent) => {
    emit('node-drag-end', draggingNode, dropNode, dropType, event)
  }

  /**
   * Handle node drop event
   * @author Vicky Zhu
   * @param {any} draggingNode - Dragging node
   * @param {any} dropNode - Target drop node
   * @param {string} dropType - Drop type: before, after, inner
   * @param {DragEvent} event - Drag event
   */
  const onNodeDrop = (draggingNode: any, dropNode: any, dropType: string, event: DragEvent) => {
    emit('node-drop', draggingNode, dropNode, dropType, event)
  }

  defineExpose({
    treeRef,
    filter: (value: string) => treeRef.value?.filter(value),
    updateKeyChildren: (key: string | number, data: TreeNode[]) =>
      treeRef.value?.updateKeyChildren(key, data),
    getCheckedNodes: (leafOnly?: boolean, includeHalfChecked?: boolean) =>
      treeRef.value?.getCheckedNodes(leafOnly, includeHalfChecked),
    setCheckedNodes: (nodes: TreeNode[]) => treeRef.value?.setCheckedNodes(nodes),
    getCheckedKeys: (leafOnly?: boolean) => treeRef.value?.getCheckedKeys(leafOnly),
    setCheckedKeys: (keys: (string | number)[]) => treeRef.value?.setCheckedKeys(keys),
    setChecked: (key: string | number, checked: boolean, deep?: boolean) =>
      treeRef.value?.setChecked(key, checked, deep),
    getHalfCheckedNodes: () => treeRef.value?.getHalfCheckedNodes(),
    getHalfCheckedKeys: () => treeRef.value?.getHalfCheckedKeys(),
    getCurrentKey: () => treeRef.value?.getCurrentKey(),
    getCurrentNode: () => treeRef.value?.getCurrentNode(),
    setCurrentKey: (key: string | number) => treeRef.value?.setCurrentKey(key),
    setCurrentNode: (node: any) => treeRef.value?.setCurrentNode(node),
    getNode: (key: string | number) => treeRef.value?.getNode(key),
    remove: (key: string | number) => treeRef.value?.remove(key),
    append: (data: TreeNode, parentKey: string | number) => treeRef.value?.append(data, parentKey),
    insertBefore: (data: TreeNode, refKey: string | number) =>
      treeRef.value?.insertBefore(data, refKey),
    insertAfter: (data: TreeNode, refKey: string | number) =>
      treeRef.value?.insertAfter(data, refKey),
  })
</script>

<style lang="scss" scoped>
  .portal-tree-container {
    .custom-tree-node {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);

      .toggle-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 15px;
        height: 15px;
        font-size: var(--font-size-mini);
        font-weight: bold;
        color: var(--color-white);
        background: var(--color-primary);
        border-radius: 3px;
        line-height: 1;
        user-select: none;
      }

      .folder-icon {
        font-size: var(--font-size-extra-small);
        color: var(--color-text-default);
      }

      .node-label {
        font-size: var(--font-size-mini);
        color: var(--color-text-default);
      }
    }

    :deep(.el-tree-node__expand-icon) {
      display: none;
    }
  }
</style>
