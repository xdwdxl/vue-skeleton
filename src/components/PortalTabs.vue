<!--
  @file PortalTabs.vue - Themed tab navigation component
  @author Cooper Wang
  @date 2026-03-13
  @description Wraps ElTabs with portal design tokens, supporting page and section tab styles with label slots
-->
<template>
  <div class="portal-tabs" :class="[`portal-tabs--${tabType}`, { 'portal-tabs--no-content': !showContent }]">
    <ElTabs v-model="activeId" v-bind="$attrs" @tab-click="handleTabClick">
      <ElTabPane
        v-for="tab in tabs"
        :key="tab.id"
        :name="String(tab.id)"
        :disabled="tab.disabled"
        :lazy="true"
      >
        <template #label>
          <slot :name="`label-${tab.id}`" :tab="tab">
            <span class="portal-tabs__label">{{ tab.label }}</span>
          </slot>
        </template>
        <slot :name="String(tab.id)" :tab="tab">
          <slot :activeTab="activeTab" />
        </slot>
      </ElTabPane>

      <!-- Forward ElTabs slots (e.g. add-icon) -->
      <template v-if="$slots['add-icon']" #add-icon>
        <slot name="add-icon" />
      </template>
    </ElTabs>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElTabs, ElTabPane } from 'element-plus'
import type { TabsPaneContext } from 'element-plus'
import 'element-plus/es/components/tabs/style/css'

defineOptions({ inheritAttrs: false })

export interface TabItem {
  id: string | number
  label: string
  disabled?: boolean
  [key: string]: unknown
}

const props = withDefaults(defineProps<{
  modelValue: string | number
  tabs: TabItem[]
  tabType?: 'page' | 'section'
  showContent?: boolean
}>(), {
  tabType: 'page',
  showContent: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'tab-click': [tab: TabItem]
}>()

/**
 * Find a tab item by its id
 * @author Cooper Wang
 * @param {string | number} id - Tab identifier to search for
 * @returns {TabItem | undefined} - Matched tab item
 */
function findTab(id: string | number) {
  return props.tabs.find(t => String(t.id) === String(id))
}

const activeId = computed({
  get: () => String(props.modelValue),
  set: (v: string) => {
    const tab = findTab(v)
    emit('update:modelValue', tab?.id ?? v)
  },
})

const activeTab = computed(() => findTab(activeId.value) ?? null)

/**
 * Handle ElTabs tab-click event and emit tab-click with full TabItem
 * @author Cooper Wang
 * @param {TabsPaneContext} pane - Element Plus tab pane context
 */
function handleTabClick(pane: TabsPaneContext) {
  const tab = findTab(pane.paneName as string)
  if (tab) emit('tab-click', tab)
}

defineExpose({ activeTab })
</script>

<style scoped>
/* ========== Base reset ========== */
.portal-tabs {
  width: 100%;
}

/* Hide content area when showContent is false */
.portal-tabs--no-content :deep(.el-tabs__content) {
  display: none;
}

/* Hide Element Plus default active bar (we use ::after on label instead) */
:deep(.el-tabs__active-bar) {
  display: none;
}

/* Header base: reset margin + shared border */
:deep(.el-tabs__header) {
  margin: 0;
  border: 1px solid var(--color-border-base);
  box-sizing: border-box;
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}

/* Active bar via pseudo-element: auto-matches text width */
.portal-tabs__label {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 100%;
}

:deep(.el-tabs__item.is-active) .portal-tabs__label::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: var(--color-primary);
}

/* Tab item base reset */
:deep(.el-tabs__item) {
  font-family: var(--font-family-bold);
  font-weight: 700;
  color: var(--color-text-title);
  transition: background-color 0.2s;
  line-height: normal;
  padding: 0 var(--spacing-sm-plus);
}

:deep(.el-tabs__item:hover),
:deep(.el-tabs__item.is-active),
:deep(.el-tabs__item.is-disabled) {
  color: var(--color-text-title);
}

:deep(.el-tabs__item.is-disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Scroll arrow base */
:deep(.el-tabs__nav-prev),
:deep(.el-tabs__nav-next) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--size-md);
  color: var(--color-text-title);
  font-size: var(--font-size-extra-small);
  line-height: 1;
}

:deep(.el-tabs__nav-prev:hover),
:deep(.el-tabs__nav-next:hover) {
  color: var(--color-primary);
}

/* Left padding only when not scrollable */
:deep(.el-tabs__nav-wrap:not(.is-scrollable)) {
  padding-left: var(--spacing-sm-plus);
}

/* ========== Page Tab ========== */
.portal-tabs--page :deep(.el-tabs__header) {
  background-color: var(--color-white);
}

.portal-tabs--page :deep(.el-tabs__item) {
  height: 40px;
  font-size: var(--font-size-mini);
}

.portal-tabs--page :deep(.el-tabs__item:hover:not(.is-disabled):not(.is-active)) {
  background-color: var(--select-color-hover);
}

/* ========== Section Tab ========== */
.portal-tabs--section :deep(.el-tabs__item) {
  height: 30px;
  font-size: var(--font-size-micro);
}

.portal-tabs--section :deep(.el-tabs__item:hover:not(.is-disabled):not(.is-active)) {
  background-color: #e4e5e6;
}

/* Section tab scroll arrows: full height + border separator */
.portal-tabs--section :deep(.el-tabs__nav-prev),
.portal-tabs--section :deep(.el-tabs__nav-next) {
  height: 100%;
  color: #5f6973;
}

.portal-tabs--section :deep(.el-tabs__nav-prev) {
  border-right: 1px solid var(--color-border-base);
}

.portal-tabs--section :deep(.el-tabs__nav-next) {
  border-left: 1px solid var(--color-border-base);
}

/* ========== Content ========== */
:deep(.el-tabs__content) {
  flex: 1;
  overflow: auto;
}
</style>
