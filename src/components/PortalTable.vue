<!--
  @file PortalTable.vue - Themed data table with optional pagination
  @author Cooper Wang
  @date 2026-03-13
  @description Wraps ElTable with portal design tokens, column config, slot forwarding, and ElPagination integration
-->
<template>
  <div class="portal-table-wrapper">
    <ElTable ref="elRef" class="portal-table" v-bind="tableAttrs">
      <template v-for="(_, name) in forwardedSlots" :key="name" #[name]="scope">
        <slot :name="name" v-bind="scope ?? {}" />
      </template>
      <template v-if="columns && columns.length">
        <ElTableColumn
          v-for="(col, idx) in columns"
          :key="String(col.key ?? col.prop ?? col.slot ?? col.label ?? idx)"
          v-bind="pickElColumnAttrs(col)"
        >
          <template v-if="col.headerSlot" #header="scope">
            <slot :name="col.headerSlot" v-bind="scope ?? {}" />
          </template>
          <template v-if="col.slot" #default="scope">
            <slot :name="col.slot" v-bind="scope ?? {}" />
          </template>
        </ElTableColumn>
      </template>
    </ElTable>
    <div v-if="pagination" class="portal-table-pagination">
      <ElPagination
        popper-class="portal-table-pagination__el-pagination"
        v-bind="paginationAttrs"
        @current-change="handlePageChange"
        @size-change="handlePageSizeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useAttrs, useSlots } from 'vue'
import { ElPagination, ElTable, ElTableColumn } from 'element-plus'
import 'element-plus/es/components/table/style/css'
import 'element-plus/es/components/pagination/style/css'

defineOptions({ inheritAttrs: false })

export type PortalTableColumnDef = {
  key?: string | number
  prop?: string
  label?: string
  width?: number | string
  minWidth?: number | string
  fixed?: boolean | 'left' | 'right'
  align?: 'left' | 'center' | 'right'
  headerAlign?: 'left' | 'center' | 'right'
  sortable?: boolean | 'custom'
  showOverflowTooltip?: boolean
  slot?: string
  headerSlot?: string
  [k: string]: unknown
}

const props = withDefaults(defineProps<{
  columns?: ReadonlyArray<PortalTableColumnDef>
  pagination?: boolean
  page?: number
  pageSize?: number
  total?: number
  pageSizes?: number[]
  paginationMode?: 'page' | 'cursor'
  hasNext?: boolean
}>(), {
  columns: () => [],
  pagination: false,
  page: 1,
  pageSize: 10,
  total: 0,
  pageSizes: () => [10, 20, 50, 100],
  paginationMode: 'page',
  hasNext: false,
})

const emit = defineEmits<{
  'update:page': [value: number]
  'page-change': [value: number]
  'update:pageSize': [value: number]
  'page-size-change': [value: number]
}>()

const attrs = useAttrs()
const slots = useSlots()
const elRef = ref<InstanceType<typeof ElTable> | null>(null)

/* Merge user attrs with sensible defaults for ElTable */
const tableAttrs = computed(() => {
  const next: Record<string, unknown> = { ...attrs }
  if (!('stripe' in next)) next.stripe = true
  if (!('tableLayout' in next) && !('table-layout' in next)) next.tableLayout = 'fixed'
  return next
})

/* When columns prop is used, exclude default slot to avoid conflict */
const forwardedSlots = computed(() => {
  if (props.columns.length) {
    const { default: _, ...rest } = slots
    return rest
  }
  return slots
})

const paginationAttrs = computed(() => {
  const page = Math.max(1, props.page)
  const size = Math.max(1, props.pageSize)

  if (props.paginationMode === 'cursor') {
    const baseTotal = page * size
    return {
      background: true,
      layout: 'sizes, prev, next',
      currentPage: page,
      pageSize: size,
      total: props.hasNext ? baseTotal + 1 : baseTotal,
      pageSizes: props.pageSizes,
    }
  }

  return {
    background: true,
    layout: 'sizes, prev, pager, next',
    currentPage: page,
    pageSize: size,
    total: Math.max(0, props.total),
    pageSizes: props.pageSizes,
  }
})

/**
 * Extract ElTableColumn-compatible attrs from column definition
 * @author Cooper Wang
 * @param {PortalTableColumnDef} col - Column definition with custom fields
 * @returns {Record<string, unknown>} - Attrs safe to pass to ElTableColumn
 */
function pickElColumnAttrs(col: PortalTableColumnDef): Record<string, unknown> {
  const { key: ___, slot: _, headerSlot: __, ...rest } = col
  return rest
}

/**
 * Handle pagination page change
 * @author Cooper Wang
 * @param {number} value - New page number
 */
function handlePageChange(value: number) {
  const next = Math.max(1, Number(value || 1))
  emit('update:page', next)
  emit('page-change', next)
}

/**
 * Handle pagination size change
 * @author Cooper Wang
 * @param {number} value - New page size
 */
function handlePageSizeChange(value: number) {
  const next = Math.max(1, Number(value || 1))
  emit('update:pageSize', next)
  emit('page-size-change', next)
}

defineExpose({
  elRef,
})
</script>

<style scoped>
.portal-table-wrapper {
  width: 100%;
  height: 100%;
}

.portal-table {
  height: calc(100% - var(--table-row-height));
}

.portal-table :deep(.el-table__header-wrapper th.el-table__cell) {
  height: var(--table-header-height);
  background-color: var(--table-header-bg);
  text-align: left;
  padding: 0;
}

.portal-table :deep(.el-table__cell) {
  padding: 0;
}

.portal-table :deep(.el-table__header-wrapper th.el-table__cell .cell) {
  font-family: var(--font-family-semibold);
  font-size: var(--font-size-tiny);
  color: var(--table-header-text-color);
  line-height: var(--table-header-height);
}

.portal-table :deep(.el-table__body-wrapper td.el-table__cell) {
  height: var(--table-row-height);
  text-align: left;
  background-color: var(--table-row-bg);
}

.portal-table :deep(.el-table__body-wrapper td.el-table__cell .cell) {
  font-family: var(--font-family-regular);
  font-size: var(--font-size-mini);
  color: var(--table-body-text-color);
  line-height: var(--table-row-height);
}

.portal-table :deep(.el-table__body tr.el-table__row--striped td.el-table__cell) {
  background-color: var(--table-row-bg-striped);
}

.portal-table :deep(.el-table__header-wrapper th.el-table__cell:first-child .cell),
.portal-table :deep(.el-table__body-wrapper td.el-table__cell:first-child .cell) {
  padding-left: var(--spacing-sm);
}

.portal-table-pagination {
  display: flex;
  justify-content: flex-end;
  padding: var(--spacing-sm) var(--spacing-sm) 0;
}

/* Pagination dropdown item style */
:deep(.el-select-dropdown__wrap .el-select-dropdown__item) {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-primary);
  font-size: var(--font-size-mini);
}
</style>
