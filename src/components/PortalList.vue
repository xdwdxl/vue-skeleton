<!--
  @file PortalList.vue - Themed data list with toolbar, column visibility, and pagination
  @author Cooper Wang
  @date 2026-03-13
  @description Reusable list component wrapping ElTable with themed header, search toolbar,
               column visibility control, custom sort indicators, pagination footer, and full slot/attr support.
               Business logic (data fetching, editing, etc.) belongs to the page layer.
-->
<template>
    <div class="portal-list">
        <!-- Header: title + toolbar -->
        <div v-if="title || showToolbar" class="portal-list__header">
            <div v-if="title" class="portal-list__title">{{ t(title) }}</div>
            <template v-if="showToolbar">
                <slot name="toolbar">
                    <div class="portal-list__toolbar">
                        <div class="portal-list__toolbar-left">
                            <slot name="toolbar-left" />
                            <PortalSearch
                                v-if="showSearch" class="portal-list__search" v-model="query"
                                :placeholder="searchPlaceholder || t('common.search')"
                                variant="append" :show-clear="false" @search="emit('search', query)"
                            />
                        </div>
                        <div class="portal-list__toolbar-right">
                            <slot name="toolbar-right" />
                            <el-dropdown v-if="showColumns" trigger="click" class="portal-list__col-dropdown" :teleported="false">
                                <PortalButton type="square" size="md" color="primary">
                                    <ElIcon><Setting /></ElIcon>
                                </PortalButton>
                                <template #dropdown>
                                    <el-dropdown-menu>
                                        <el-dropdown-item>
                                            <button class="portal-list__reset-link" @click.stop="resetColumns">{{ t('common.reset') }}</button>
                                        </el-dropdown-item>
                                        <el-dropdown-item v-for="col in columns" :key="col.prop" @click.stop="handleToggle(col.prop)">
                                            <el-checkbox v-model="visibility[col.prop]" @click.stop>{{ t(col.label) }}</el-checkbox>
                                        </el-dropdown-item>
                                    </el-dropdown-menu>
                                </template>
                            </el-dropdown>
                        </div>
                    </div>
                </slot>
            </template>
        </div>

        <!-- Table -->
        <div class="portal-list__table-wrap" :class="{ 'portal-list__table-wrap--has-footer': showPagination }">
            <el-table
                ref="tableRef" v-loading="loading" :data="data" :row-key="rowKey"
                :highlight-current-row="highlightCurrentRow"
                header-row-class-name="portal-list__header-row"
                v-bind="$attrs"
                @selection-change="handleSelection"
                @sort-change="(sort: any) => emit('sort-change', sort)"
                @row-click="(row: any, col: any, e: Event) => emit('row-click', row, col, e)"
                @row-dblclick="(row: any, col: any, e: Event) => emit('row-dblclick', row, col, e)"
                @current-change="(cur: any, old: any) => emit('current-change', cur, old)"
            >
                <el-table-column v-if="showSelection" type="selection" width="40" align="center" :selectable="selectable" />
                <el-table-column v-if="showIndex" type="index" label="#" width="50" align="center" />

                <el-table-column
                    v-for="col in visibleColumns" :key="col.prop"
                    :label="t(col.label)" :align="col.align || 'left'" :prop="col.prop"
                    :width="col.width" :min-width="col.minWidth" :sortable="col.sortable"
                    :show-overflow-tooltip="col.showOverflowTooltip !== false" :fixed="col.fixed"
                >
                    <template #default="scope">
                        <slot v-if="col.template" :name="col.template" :row="scope.row" :column="col" :index="scope.$index" />
                        <template v-else-if="col.formatter">{{ col.formatter(scope.row[col.prop], scope.row, scope.$index) }}</template>
                        <template v-else>{{ scope.row[col.prop] }}</template>
                    </template>
                </el-table-column>

                <el-table-column v-if="showOperation" :label="operationLabel" :width="operationWidth" align="center" fixed="right">
                    <template #default="scope">
                        <div class="portal-list__row-ops">
                            <slot name="operation" :row="scope.row" :index="scope.$index" />
                        </div>
                    </template>
                </el-table-column>

                <template v-for="(_, name) in elTableSlots" :key="name" #[name]="slotData">
                    <slot :name="name" v-bind="slotData ?? {}" />
                </template>
            </el-table>
        </div>

        <!-- Footer -->
        <div v-if="showPagination" class="portal-list__footer">
            <slot name="pagination">
                <PortalPaging :total="total" :page="page" :limit="limit"
                    @pagination="handlePagination" @refresh="emit('refresh')"
                />
            </slot>
            <div v-if="$slots['footer-actions']" class="portal-list__footer-actions">
                <slot name="footer-actions" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * @component PortalList - Themed data list with toolbar, column visibility, and pagination
 * @author Cooper Wang
 * @date 2026-03-13
 * @props See Props interface below
 * @emits selection-change / page-change / sort-change / search / refresh / column-toggle / row-click / row-dblclick / current-change
 * @slot toolbar / toolbar-left / toolbar-right / pagination / footer-actions / operation / [column templates]
 */
import { ref, computed, toRef, useSlots } from 'vue'
import { ElIcon } from 'element-plus'
import { Setting } from '@element-plus/icons-vue'
import { useI18n } from '@/i18n'
import { useColumnVisibility } from '@/composables/useColumnVisibility'
import PortalPaging from './PortalPaging.vue'
import PortalButton from './PortalButton.vue'
import PortalSearch from './PortalSearch.vue'
import '@/styles/portal-list.css'

defineOptions({ name: 'PortalList', inheritAttrs: false })

const { t } = useI18n()

export interface ColumnConfig {
    prop: string
    label: string
    visible?: boolean
    align?: 'left' | 'center' | 'right'
    width?: string | number
    minWidth?: string | number
    sortable?: boolean | string
    showOverflowTooltip?: boolean
    fixed?: boolean | 'left' | 'right'
    template?: string
    formatter?: (value: unknown, row: Record<string, unknown>, index: number) => string
    [key: string]: unknown
}

interface Props {
    columns?: ColumnConfig[]
    data?: any[]
    loading?: boolean
    total?: number
    page?: number
    limit?: number
    title?: string
    searchPlaceholder?: string
    rowKey?: string
    selectable?: (row: any, index: number) => boolean
    operationLabel?: string
    operationWidth?: number
    showToolbar?: boolean
    showSearch?: boolean
    showColumns?: boolean
    showSelection?: boolean
    showIndex?: boolean
    showPagination?: boolean
    showOperation?: boolean
    highlightCurrentRow?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    columns: () => [], data: () => [], loading: false, total: 0, page: 0, limit: 25,
    title: '', searchPlaceholder: '', rowKey: 'id', selectable: () => () => true,
    operationLabel: '', operationWidth: 120,
    showToolbar: true, showSearch: true, showColumns: true, showSelection: true,
    showIndex: false, showPagination: true, showOperation: false, highlightCurrentRow: true,
})

const emit = defineEmits<{
    'selection-change': [rows: any[]]
    'page-change': [data: { page: number; limit: number }]
    'sort-change': [sort: any]
    'search': [query: string]
    'refresh': []
    'column-toggle': [column: ColumnConfig]
    'row-click': [row: any, column: any, event: Event]
    'row-dblclick': [row: any, column: any, event: Event]
    'current-change': [currentRow: any, oldCurrentRow: any]
}>()

const query = defineModel<string>('query', { default: '' })
const tableRef = ref<InstanceType<typeof import('element-plus')['ElTable']> | null>(null)
const selectedRows = ref<any[]>([])
const slots = useSlots()

/* Column visibility (extracted composable) */
const { visibility, visibleColumns, resetColumns, toggleColumn } = useColumnVisibility(toRef(props, 'columns'))

const handleToggle = (prop: string) => {
    toggleColumn(prop)
    const col = props.columns.find(c => c.prop === prop)
    if (col) emit('column-toggle', col)
}

/** Slot names managed by PortalList (excluded from ElTable forwarding) */
const PORTAL_SLOT_NAMES = new Set(['toolbar', 'toolbar-left', 'toolbar-right', 'pagination', 'footer-actions', 'operation'])

const elTableSlots = computed(() => {
    const tpls = new Set(props.columns.map(c => c.template).filter(Boolean))
    const result: Record<string, any> = {}
    for (const name of Object.keys(slots)) {
        if (!PORTAL_SLOT_NAMES.has(name) && !tpls.has(name)) result[name] = slots[name]
    }
    return result
})

const handleSelection = (rows: any[]) => { selectedRows.value = rows; emit('selection-change', rows) }
const handlePagination = (val: { page: number; limit: number }) => { emit('page-change', val) }

defineExpose({
    tableRef, selectedRows,
    getSelection: () => tableRef.value?.getSelectionRows() || [],
    clearSelection: () => tableRef.value?.clearSelection(),
    toggleRowSelection: (row: any, selected?: boolean) => tableRef.value?.toggleRowSelection(row, selected),
})
</script>
