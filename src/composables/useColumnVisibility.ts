/**
 * @file useColumnVisibility.ts - Column visibility composable for PortalList
 * @description Manages column show/hide state, syncs with column config, and filters visible columns.
 */
import { ref, computed, watch, type Ref } from 'vue'

export function useColumnVisibility<T extends { prop: string; visible?: boolean }>(columns: Ref<T[]>) {
    const visibility = ref<Record<string, boolean>>({})

    /** Sync visibility state when columns change */
    watch(columns, (cols) => {
        cols.forEach(col => {
            if (!(col.prop in visibility.value)) visibility.value[col.prop] = col.visible !== false
        })
    }, { immediate: true })

    /** Columns filtered by visibility */
    const visibleColumns = computed(() =>
        columns.value.filter(col => visibility.value[col.prop] !== false)
    )

    /** Reset all columns to visible */
    const resetColumns = () => {
        Object.keys(visibility.value).forEach(k => { visibility.value[k] = true })
    }

    /** Toggle a single column's visibility */
    const toggleColumn = (prop: string) => {
        visibility.value[prop] = !visibility.value[prop]
    }

    return { visibility, visibleColumns, resetColumns, toggleColumn }
}
