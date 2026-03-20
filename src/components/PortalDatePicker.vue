<!--
  @file PortalDatePicker.vue - Date picker component
  @author Cooper Wang
  @date 2026-03-13
  @description Wraps ElDatePicker with portal design tokens, custom calendar styling, and optional today shortcut
-->
<template>
    <div class="portal-date-picker" :style="{ '--_width': width }">
        <ElDatePicker
            ref="pickerRef"
            v-model="model"
            :type="type"
            :format="format"
            :value-format="valueFormat"
            :placeholder="resolvedPlaceholder"
            :start-placeholder="startPlaceholder"
            :end-placeholder="endPlaceholder"
            :range-separator="rangeSeparator"
            :shortcuts="resolvedShortcuts"
            :disabled="disabled"
            :clearable="clearable"
            :editable="editable"
            :readonly="readonly"
            :size="size"
            :disabled-date="disabledDate"
            :default-value="defaultValue"
            :default-time="defaultTime"
            :validate-event="validateEvent"
            :unlink-panels="unlinkPanels"
            :prefix-icon="prefixIcon"
            :clear-icon="clearIcon"
            :teleported="teleported"
            :aria-label="ariaLabel"
            :tabindex="tabindex"
            :popper-class="`portal-date-picker-popper ${popperClass}`"
            class="portal-date-picker__input"
            v-bind="$attrs"
            @change="change"
            @focus="focus"
            @blur="blur"
            @visible-change="visibleChange"
            @calendar-change="calendarChange"
            @panel-change="panelChange"
        >
            <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
                <slot :name="name" v-bind="slotData ?? {}" />
            </template>
        </ElDatePicker>
    </div>
</template>

<script setup lang="ts">
/**
 * @component PortalDatePicker - Date picker component
 * @author Cooper Wang
 * @date 2026-03-13
 * @props See Props interface below
 * @emits change / focus / blur / visibleChange / calendarChange / panelChange
 * @slot default - Custom cell content
 * @slot range-separator - Custom range separator
 */
import { computed, ref, nextTick, onMounted, onBeforeUnmount, type Component } from 'vue'
import { ElDatePicker } from 'element-plus'
import { useI18n } from '@/i18n'
import 'element-plus/es/components/date-picker/style/css'
import '@/styles/portal-date-picker.css'

defineOptions({ name: 'PortalDatePicker', inheritAttrs: false })

const { t } = useI18n()

export interface DatePickerShortcut {
    text: string
    value: Date | (() => Date)
}

type DatePickerType = 'date' | 'daterange' | 'datetime' | 'datetimerange' | 'month' | 'year' | 'week'
type ModelValue = string | Date | number | [string, string] | [Date, Date] | null

interface Props {
    type?: DatePickerType
    format?: string
    valueFormat?: string
    placeholder?: string
    startPlaceholder?: string
    endPlaceholder?: string
    rangeSeparator?: string
    width?: string
    shortcuts?: DatePickerShortcut[]
    showTodayShortcut?: boolean
    disabled?: boolean
    clearable?: boolean
    editable?: boolean
    readonly?: boolean
    size?: 'large' | 'default' | 'small'
    disabledDate?: (date: Date) => boolean
    defaultValue?: Date | [Date, Date]
    defaultTime?: Date | [Date, Date]
    validateEvent?: boolean
    unlinkPanels?: boolean
    prefixIcon?: string | Component
    clearIcon?: string | Component
    teleported?: boolean
    ariaLabel?: string
    tabindex?: string | number
    popperClass?: string
}

const model = defineModel<ModelValue>()

const props = withDefaults(defineProps<Props>(), {
    type: 'date',
    format: 'YYYY-MM-DD',
    valueFormat: 'YYYY-MM-DD',
    width: '238px',
    showTodayShortcut: true,
    disabled: false,
    clearable: false,
    editable: true,
    readonly: false,
    size: 'small',
    validateEvent: true,
    teleported: true,
    popperClass: '',
})

const emit = defineEmits<{
    change: [value: ModelValue]
    focus: [event: FocusEvent]
    blur: [event: FocusEvent]
    visibleChange: [visible: boolean]
    calendarChange: [dates: [Date]]
    panelChange: [date: Date, mode: string]
}>()

const pickerRef = ref<InstanceType<typeof ElDatePicker>>()

/** Resolve placeholder with i18n fallback */
const resolvedPlaceholder = computed(() => props.placeholder || t('datePicker.placeholder'))

/** Merge custom shortcuts with optional "Today" shortcut */
const resolvedShortcuts = computed(() => {
    if (props.shortcuts) return props.shortcuts
    if (!props.showTodayShortcut) return []
    return [{ text: t('datePicker.today'), value: new Date() }]
})

/* Event handlers — transparent forwarding */
const change = (val: ModelValue) => { emit('change', val ?? null) }
const focus = (event: FocusEvent) => { emit('focus', event) }
const blur = (event: FocusEvent) => { emit('blur', event) }
const visibleChange = (visible: boolean) => { emit('visibleChange', visible) }
const calendarChange = (dates: [Date]) => { emit('calendarChange', dates) }

let prevPanelMode = ''
const panelChange = (date: Date, mode: string) => {
    if (prevPanelMode === 'year' && mode === 'month') {
        prevPanelMode = mode
        nextTick(() => {
            const popper = document.querySelector('.portal-date-picker-popper')
            const cell = popper?.querySelector('.el-month-table td.current .el-date-table-cell') as HTMLElement | null
            cell?.click()
        })
    } else {
        prevPanelMode = mode
    }
    emit('panelChange', date, mode)
}

const handleLabelToggle = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    const popper = target.closest('.portal-date-picker-popper')
    if (!popper) return

    const label = target.closest('.el-date-picker__header-label')
    if (!label) return

    const labels = popper.querySelectorAll('.el-date-picker__header-label')
    const isYearLabel = label === labels[0]
    const isMonthLabel = label === labels[1]
    const yearTable = popper.querySelector('.el-year-table')
    const monthTable = popper.querySelector('.el-month-table')

    /* Year label clicked while year table open → select current year (triggers year→month→date skip) */
    if (isYearLabel && yearTable) {
        e.stopImmediatePropagation()
        e.preventDefault()
        const cell = yearTable.querySelector('td.current .el-date-table-cell') as HTMLElement | null
        cell?.click()
        return
    }

    /* Month label clicked while month table open → select current month (returns to date view) */
    if (isMonthLabel && monthTable) {
        e.stopImmediatePropagation()
        e.preventDefault()
        const cell = monthTable.querySelector('td.current .el-date-table-cell') as HTMLElement | null
        cell?.click()
    }
}

onMounted(() => { document.addEventListener('click', handleLabelToggle, true) })
onBeforeUnmount(() => { document.removeEventListener('click', handleLabelToggle, true) })

defineExpose({
    elRef: pickerRef,
    focus: () => (pickerRef.value as any)?.focus?.(),
})
</script>
