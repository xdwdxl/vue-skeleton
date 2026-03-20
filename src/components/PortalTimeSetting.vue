<!--
  @file PortalTimeSetting.vue - Frequency and time schedule configuration component
  @author Cooper Wang
  @date 2026-03-13
  @description Provides configurable frequency tabs with interval, time picker, and day selection controls
-->
<template>
  <div class="portal-time-setting" :class="{ 'portal-time-setting--disabled': disabled }" v-bind="$attrs">
    <!-- Frequency tabs -->
    <div class="portal-time-setting__tabs">
      <button v-for="f in frequencies" :key="f" :disabled="disabled"
        :class="['portal-time-setting__tab', { 'portal-time-setting__tab--active': s.frequency === f }]"
        @click="s.frequency = f">
        <span class="portal-time-setting__tab-text">{{ t(`timeSetting.${f}`) }}</span>
      </button>
    </div>

    <!-- Simple mode: minutely / hourly / daily -->
    <template v-if="isSimple">
      <div class="portal-time-setting__row portal-time-setting__row--every">
        <span class="portal-time-setting__label">{{ t('timeSetting.every') }}</span>
        <PortalSpinnerInput v-model="s.interval" :min="1" :disabled="disabled" />
        <span class="portal-time-setting__unit-label">{{ unitLabel }}</span>
      </div>
      <div class="portal-time-setting__row portal-time-setting__row--time">
        <span class="portal-time-setting__label portal-time-setting__label--time">{{ t('timeSetting.time') }}</span>
        <div class="portal-time-setting__time-group">
          <label class="portal-time-setting__check">
            <input type="checkbox" v-model="s.startEnabled" :disabled="disabled" /><span>{{ t('timeSetting.start') }}</span>
          </label>
          <div class="portal-time-setting__picker-wrap" @mousedown.capture="onPickerMouse($event)" @click.capture="onPickerClick($event, startRef)">
            <ElTimePicker ref="startRef" v-model="s.startTime" format="HH:mm" value-format="HH:mm" :disabled="disabled || !s.startEnabled" class="portal-time-setting__time-picker" popper-class="portal-time-setting__time-popper" :clearable="false" />
          </div>
        </div>
        <div v-if="showEnd" class="portal-time-setting__time-group">
          <label class="portal-time-setting__check">
            <input type="checkbox" v-model="s.endEnabled" :disabled="disabled" /><span>{{ t('timeSetting.end') }}</span>
          </label>
          <div class="portal-time-setting__picker-wrap" @mousedown.capture="onPickerMouse($event)" @click.capture="onPickerClick($event, endRef)">
            <ElTimePicker ref="endRef" v-model="s.endTime" format="HH:mm" value-format="HH:mm" :disabled="disabled || !s.endEnabled" class="portal-time-setting__time-picker" popper-class="portal-time-setting__time-popper" :clearable="false" />
          </div>
        </div>
      </div>
    </template>

    <!-- Advanced mode: weekly / monthly -->
    <template v-else>
      <!-- Radio: Every [interval] [unit] -->
      <div class="portal-time-setting__row portal-time-setting__row--radio">
        <label class="portal-time-setting__radio">
          <input type="radio" :name="radioName" value="every" v-model="advancedMode" :disabled="disabled" /><span>{{ t('timeSetting.every') }}</span>
        </label>
        <PortalSpinnerInput v-model="s.interval" :min="1" :disabled="disabled" class="portal-time-setting__interval-inline" />
        <span class="portal-time-setting__unit-label">{{ unitLabel }}</span>
      </div>

      <!-- Weekly: Fixed Date radio + day checkboxes -->
      <template v-if="s.frequency === 'weekly'">
        <div class="portal-time-setting__row portal-time-setting__row--radio">
          <label class="portal-time-setting__radio">
            <input type="radio" :name="radioName" value="fixedDate" v-model="advancedMode" :disabled="disabled" /><span>{{ t('timeSetting.fixedDate') }}</span>
          </label>
        </div>
        <div class="portal-time-setting__row portal-time-setting__row--days">
          <label v-for="d in weekDays" :key="d" class="portal-time-setting__day-check">
            <input type="checkbox" :value="d" v-model="s.selectedDays" :disabled="disabled" /><span>{{ t(`timeSetting.${d}`) }}</span>
          </label>
        </div>
      </template>

      <!-- Monthly: Day [n] of month radio -->
      <div v-if="s.frequency === 'monthly'" class="portal-time-setting__row portal-time-setting__row--radio">
        <label class="portal-time-setting__radio">
          <input type="radio" :name="radioName" value="day" v-model="advancedMode" :disabled="disabled" /><span>{{ t('timeSetting.day') }}</span>
        </label>
        <div class="portal-time-setting__freq-input-group portal-time-setting__interval-inline">
          <input type="text" class="portal-time-setting__freq-input" :value="s.monthDay" :disabled="disabled" @input="parseInput($event, 'monthDay', 1, 31)" />
          <div class="portal-time-setting__freq-suffix"><svg viewBox="0 0 10 6" width="8" height="5"><polyline points="1,1 5,5 9,1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        </div>
        <span class="portal-time-setting__unit-label">{{ t('timeSetting.ofMonth') }}</span>
      </div>

      <!-- Time Mode label (weekly only) -->
      <div v-if="s.frequency === 'weekly'" class="portal-time-setting__row portal-time-setting__row--time-mode-label">
        <span class="portal-time-setting__time-mode-text">{{ t('timeSetting.timeMode') }}</span>
      </div>

      <!-- Shared time mode content (weekly: div, monthly: fieldset) -->
      <component :is="s.frequency === 'monthly' ? 'fieldset' : 'div'"
        :class="s.frequency === 'monthly' ? 'portal-time-setting__time-mode-fieldset' : 'portal-time-setting__time-mode-box'">
        <legend v-if="s.frequency === 'monthly'" class="portal-time-setting__time-mode-legend">{{ t('timeSetting.timeMode') }}</legend>
        <div class="portal-time-setting__time-mode-row">
          <span class="portal-time-setting__time-mode-row-label">{{ t('timeSetting.time') }}</span>
          <label class="portal-time-setting__check"><input type="checkbox" v-model="s.startEnabled" :disabled="disabled" /><span>{{ t('timeSetting.start') }}</span></label>
          <div class="portal-time-setting__picker-wrap" @mousedown.capture="onPickerMouse($event)" @click.capture="onPickerClick($event, startRef)">
            <ElTimePicker ref="startRef" v-model="s.startTime" format="HH:mm" value-format="HH:mm" :disabled="disabled || !s.startEnabled" class="portal-time-setting__time-picker" popper-class="portal-time-setting__time-popper" :clearable="false" />
          </div>
        </div>
        <div v-if="showFreqRow" class="portal-time-setting__time-mode-row">
          <span class="portal-time-setting__time-mode-row-label">{{ t('timeSetting.frequency') }}</span>
          <label class="portal-time-setting__check portal-time-setting__check--freq"><input type="checkbox" v-model="s.freqHoursEnabled" :disabled="disabled" /><span>{{ t('timeSetting.hours') }}</span></label>
          <div class="portal-time-setting__freq-input-group">
            <input type="text" class="portal-time-setting__freq-input" :value="s.freqHours" :disabled="disabled" @input="parseInput($event, 'freqHours', 0, 23)" />
            <div class="portal-time-setting__freq-suffix"><svg viewBox="0 0 10 6" width="8" height="5"><polyline points="1,1 5,5 9,1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
          </div>
          <label class="portal-time-setting__check portal-time-setting__check--freq"><input type="checkbox" v-model="s.freqMinutesEnabled" :disabled="disabled" /><span>{{ t('timeSetting.minutes') }}</span></label>
          <div class="portal-time-setting__freq-input-group">
            <input type="text" class="portal-time-setting__freq-input" :value="s.freqMinutes" :disabled="disabled" @input="parseInput($event, 'freqMinutes', 0, 59)" />
            <div class="portal-time-setting__freq-suffix"><svg viewBox="0 0 10 6" width="8" height="5"><polyline points="1,1 5,5 9,1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
          </div>
        </div>
      </component>
    </template>

    <!-- Footer slot for custom actions -->
    <slot name="footer" />
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch, inject, ref } from 'vue'
import { ElTimePicker } from 'element-plus'
import 'element-plus/es/components/time-picker/style/css'
import PortalSpinnerInput from './PortalSpinnerInput.vue'
import '../styles/portal-time-setting.css'

defineOptions({ inheritAttrs: false })

export type FrequencyType = 'minutely' | 'hourly' | 'daily' | 'weekly' | 'monthly'

export interface TimeSettingValue {
  frequency: FrequencyType; interval: number
  startEnabled: boolean; startTime: string; endEnabled: boolean; endTime: string
  weeklyMode?: 'every' | 'fixedDate'; selectedDays?: string[]
  monthlyMode?: 'every' | 'day'; monthDay?: number
  freqHours?: number; freqMinutes?: number
  freqHoursEnabled?: boolean; freqMinutesEnabled?: boolean
}

const i18n = inject<{ t: (k: string, p?: Record<string, unknown>) => string } | null>('i18n', null)
const t = (k: string, p?: Record<string, unknown>): string => i18n?.t(k, p) ?? k

const props = withDefaults(defineProps<{
  modelValue?: TimeSettingValue
  frequencies?: FrequencyType[]
  weekDays?: string[]
  unitLabels?: Partial<Record<FrequencyType, string>>
  disabled?: boolean
}>(), {
  frequencies: () => ['minutely', 'hourly', 'daily', 'weekly', 'monthly'] as FrequencyType[],
  weekDays: () => ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  unitLabels: () => ({ minutely: 'minute_s', hourly: 'hour_s', daily: 'day_s', weekly: 'week_s', monthly: 'month_s' }),
  disabled: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: TimeSettingValue]; change: [value: TimeSettingValue] }>()

const startRef = ref()
const endRef = ref()
const _uid = Math.random().toString(36).slice(2, 8)

const s = reactive({
  frequency: props.modelValue?.frequency ?? 'minutely' as FrequencyType,
  interval: props.modelValue?.interval ?? 1,
  startEnabled: props.modelValue?.startEnabled ?? false,
  startTime: props.modelValue?.startTime ?? '00:00',
  endEnabled: props.modelValue?.endEnabled ?? false,
  endTime: props.modelValue?.endTime ?? '00:00',
  weeklyMode: (props.modelValue?.weeklyMode ?? 'every') as 'every' | 'fixedDate',
  selectedDays: props.modelValue?.selectedDays ?? [] as string[],
  monthlyMode: (props.modelValue?.monthlyMode ?? 'every') as 'every' | 'day',
  monthDay: props.modelValue?.monthDay ?? 1,
  freqHours: props.modelValue?.freqHours ?? 0,
  freqMinutes: props.modelValue?.freqMinutes ?? 0,
  freqHoursEnabled: props.modelValue?.freqHoursEnabled ?? false,
  freqMinutesEnabled: props.modelValue?.freqMinutesEnabled ?? false,
})

const isSimple = computed(() => !['weekly', 'monthly'].includes(s.frequency))
const showEnd = computed(() => !['daily'].includes(s.frequency))
const unitLabel = computed(() => t(`timeSetting.${props.unitLabels[s.frequency] ?? s.frequency}`))
const radioName = computed(() => `${s.frequency}-${_uid}`)
const showFreqRow = computed(() =>
  (s.frequency === 'weekly' && s.weeklyMode === 'fixedDate') ||
  (s.frequency === 'monthly' && s.monthlyMode === 'day')
)

/** Unified radio v-model for weekly/monthly mode */
const advancedMode = computed({
  get: () => s.frequency === 'weekly' ? s.weeklyMode : s.monthlyMode,
  set: (v: string) => {
    if (s.frequency === 'weekly') s.weeklyMode = v as 'every' | 'fixedDate'
    else s.monthlyMode = v as 'every' | 'day'
  },
})

/**
 * Generic numeric input handler with bounds check
 * @author Cooper Wang
 * @param {Event} e - Input event
 * @param {string} key - Reactive state key to update
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 */
function parseInput(e: Event, key: string, min: number, max: number) {
  const v = parseInt((e.target as HTMLInputElement).value, 10)
  if (!isNaN(v) && v >= min && v <= max) (s as any)[key] = v
}

/**
 * Prevent picker popup on input click, allow focus instead
 * @author Cooper Wang
 * @param {MouseEvent} e - Mousedown event
 */
function onPickerMouse(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('.el-input__suffix')) return
  e.stopPropagation()
  ;(e.currentTarget as HTMLElement).querySelector<HTMLInputElement>('.el-input__inner')?.focus()
}

/**
 * Open time picker popup only on suffix icon click
 * @author Cooper Wang
 * @param {MouseEvent} e - Click event
 * @param {{ handleOpen?: () => void }} pickerRef - Time picker ref
 */
function onPickerClick(e: MouseEvent, pickerRef: { handleOpen?: () => void }) {
  e.stopPropagation(); e.preventDefault()
  if ((e.target as HTMLElement).closest('.el-input__suffix')) pickerRef?.handleOpen?.()
}

/**
 * Collect current state into a TimeSettingValue
 * @author Cooper Wang
 * @returns {TimeSettingValue} Current form state
 */
function getFormValue(): TimeSettingValue {
  return { ...s }
}

function emitChange() { const v = getFormValue(); emit('update:modelValue', v); emit('change', v) }

defineExpose({ getFormValue })

watch(s, emitChange)

watch(() => props.modelValue, (v) => {
  if (!v) return
  Object.assign(s, {
    frequency: v.frequency, interval: v.interval,
    startEnabled: v.startEnabled, startTime: v.startTime,
    endEnabled: v.endEnabled, endTime: v.endTime,
    weeklyMode: v.weeklyMode ?? 'every', selectedDays: v.selectedDays ?? [],
    monthlyMode: v.monthlyMode ?? 'every', monthDay: v.monthDay ?? 1,
    freqHours: v.freqHours ?? 0, freqMinutes: v.freqMinutes ?? 0,
    freqHoursEnabled: v.freqHoursEnabled ?? false, freqMinutesEnabled: v.freqMinutesEnabled ?? false,
  })
})
</script>
