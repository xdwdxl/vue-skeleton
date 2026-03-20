<template>
  <div class="portal-table-wrapper">
    <ElTable class="portal-table" v-bind="tableAttrs">
      <template v-for="(_, name) in forwardedSlots" :key="name" #[name]="scope">
        <slot :name="name" v-bind="scope" />
      </template>
      <template v-if="columns && columns.length">
        <ElTableColumn
          v-for="(col, idx) in columns"
          :key="String(col.key ?? col.prop ?? col.slot ?? col.label ?? idx)"
          v-bind="pickElColumnAttrs(col)"
        >
          <template v-if="col.headerSlot" #header="scope">
            <slot :name="col.headerSlot" v-bind="scope" />
          </template>
          <template v-if="col.slot" #default="scope">
            <slot :name="col.slot" v-bind="scope" />
          </template>
        </ElTableColumn>
      </template>
    </ElTable>
    <div v-if="showPagination" class="portal-table-pagination">
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
import { computed, useAttrs, useSlots } from 'vue'
import { ElPagination, ElTable, ElTableColumn } from 'element-plus'
import 'element-plus/es/components/table/style/css'
import 'element-plus/es/components/pagination/style/css'

type PortalTableColumnDef = {
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

const props = defineProps<{
  columns?: ReadonlyArray<PortalTableColumnDef>
  pagination?: boolean
  page?: number
  pageSize?: number
  total?: number
  pageSizes?: number[]
  paginationMode?: 'page' | 'cursor'
  hasNext?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:page', value: number): void
  (e: 'page-change', value: number): void
  (e: 'update:pageSize', value: number): void
  (e: 'page-size-change', value: number): void
}>()

const attrs = useAttrs()
const slots = useSlots()

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 10

const tableAttrs = computed(() => {
  const next: Record<string, unknown> = { ...attrs }
  if (!('stripe' in next)) next.stripe = true
  if (!('tableLayout' in next) && !('table-layout' in next)) next.tableLayout = 'fixed'
  return next
})

const forwardedSlots = computed(() => {
  if (props.columns && props.columns.length) {
    const { default: _, ...rest } = slots
    return rest
  }
  return slots
})

const showPagination = computed(() => {
  return !!props.pagination
})

const paginationAttrs = computed(() => {
  const mode = props.paginationMode === 'cursor' ? 'cursor' : 'page'
  const page = Math.max(1, Number(props.page ?? DEFAULT_PAGE))
  const size = Math.max(1, Number(props.pageSize ?? DEFAULT_PAGE_SIZE))
  const sizes = Array.isArray(props.pageSizes) && props.pageSizes.length
    ? props.pageSizes
    : [10, 20, 50, 100]
  if (mode === 'cursor') {
    const hasNext = !!props.hasNext
    const baseTotal = page * size
    const total = hasNext ? baseTotal + 1 : baseTotal
    return {
      background: true,
      layout: 'sizes, prev, next',
      currentPage: page,
      pageSize: size,
      total,
      pageSizes: sizes,
    }
  }
  const total = Math.max(0, Number(props.total ?? 0))
  return {
    background: true,
    layout: 'sizes, prev, pager, next',
    currentPage: page,
    pageSize: size,
    total,
    pageSizes: sizes,
  }
})

function pickElColumnAttrs(col: PortalTableColumnDef): Record<string, unknown> {
  const { key: ___, slot: _, headerSlot: __, ...rest } = col
  return rest
}

/**
 * Handle pagination page change
 * @author Lorin Luo
 * @param {number} value - New page index
 * @returns {void}
 */
function handlePageChange(value: number): void {
  const next = Math.max(1, Number(value || 1))
  emit('update:page', next)
  emit('page-change', next)
}

/**
 * Handle pagination size change
 * @author Lorin Luo
 * @param {number} value - New page size
 * @returns {void}
 */
function handlePageSizeChange(value: number): void {
  const next = Math.max(1, Number(value || 1))
  emit('update:pageSize', next)
  emit('page-size-change', next)
}
</script>

<style scoped>
.portal-table-wrapper {
  width: 100%;
  height: 100%;
}

:deep(.card-table-wrapper){
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
  font-size: var(--el-font-size-small);
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
  font-size: var(--el-font-size-base);
  color: var(--table-body-text-color);
  line-height: var(--table-row-height);
}

.portal-table :deep(.el-table__body tr.el-table__row--striped td.el-table__cell) {
  background-color: var(--table-row-bg-striped);
}

.portal-table :deep(.el-table__header-wrapper th.el-table__cell:first-child .cell) {
  padding-left: var(--table-first-col-padding-left);
}

.portal-table :deep(.el-table__body-wrapper td.el-table__cell:first-child .cell) {
  padding-left: var(--table-first-col-padding-left);
}

.portal-table-pagination {
  display: flex;
  justify-content: flex-end;
  padding: var(--table-pagination-padding-top) var(--table-pagination-padding-x) 0;
}
</style>
<style>
.el-select-dropdown__wrap .el-select-dropdown__item {
  color: var(--color-text-primary);
  font-weight: var(--fk-font-weight);
  font-size: var(--font-size-mini);
}
</style>
