<!--
  @file PortalSpinnerInput.vue - Number input with increment/decrement spinner buttons
  @author Cooper Wang
  @date 2026-03-13
  @description Numeric text input with up/down arrow buttons, supporting min/max/step bounds and keyboard arrow keys
-->
<template>
  <div class="portal-spinner-input" :class="{ 'portal-spinner-input--disabled': disabled }" v-bind="$attrs">
    <input
      ref="inputRef"
      type="text"
      class="portal-spinner-input__field"
      :value="modelValue"
      :disabled="disabled"
      @input="handleInput"
      @blur="handleBlur"
      @keydown.up.prevent="stepBy(step)"
      @keydown.down.prevent="stepBy(-step)"
    />
    <div class="portal-spinner-input__btns">
      <button class="portal-spinner-input__btn" :disabled="disabled" @click="stepBy(step)" tabindex="-1">
        <svg viewBox="0 0 10 6" width="8" height="5"><polyline points="1,5 5,1 9,5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <button class="portal-spinner-input__btn" :disabled="disabled" @click="stepBy(-step)" tabindex="-1">
        <svg viewBox="0 0 10 6" width="8" height="5"><polyline points="1,1 5,5 9,1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  modelValue: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
}>(), { min: 0, max: Infinity, step: 1, disabled: false })

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const inputRef = ref<HTMLInputElement | null>(null)

/**
 * Clamp value within min/max bounds
 * @author Cooper Wang
 * @param {number} val - Value to clamp
 * @returns {number} Clamped value
 */
function clamp(val: number): number {
  return Math.min(props.max, Math.max(props.min, val))
}

/**
 * Parse text input and emit clamped value
 * @author Cooper Wang
 * @param {Event} e - Input event
 */
function handleInput(e: Event) {
  const v = parseInt((e.target as HTMLInputElement).value, 10)
  if (!isNaN(v)) emit('update:modelValue', clamp(v))
}

/**
 * Restore display to current modelValue on blur if input is invalid
 * @author Cooper Wang
 * @param {Event} e - Blur event
 */
function handleBlur(e: Event) {
  const el = e.target as HTMLInputElement
  const v = parseInt(el.value, 10)
  if (isNaN(v) || v !== props.modelValue) el.value = String(props.modelValue)
}

/**
 * Increment or decrement value by delta
 * @author Cooper Wang
 * @param {number} delta - Step delta (positive or negative)
 */
function stepBy(delta: number) {
  if (props.disabled) return
  const next = clamp(props.modelValue + delta)
  if (next !== props.modelValue) emit('update:modelValue', next)
}

defineExpose({ inputRef, focus: () => inputRef.value?.focus(), blur: () => inputRef.value?.blur() })
</script>

<style scoped>
.portal-spinner-input {
  display: flex;
  align-items: stretch;
  height: var(--size-3xl);
  border: 1px solid var(--color-border-base);
  border-radius: var(--radius-base);
  overflow: hidden;
  flex-shrink: 0;
}

.portal-spinner-input:focus-within { border-color: var(--color-primary); }
.portal-spinner-input--disabled { opacity: 0.6; cursor: not-allowed; }
.portal-spinner-input--disabled:focus-within { border-color: var(--color-border-base); }

.portal-spinner-input__field {
  width: var(--spinner-input-width, 50px);
  height: 100%;
  border: none;
  text-align: center;
  font-family: var(--font-family-regular);
  font-size: var(--font-size-micro);
  color: var(--color-text-title);
  background: var(--color-background-base);
  outline: none;
  padding: 0 var(--spacing-xs);
  -moz-appearance: textfield;
}

.portal-spinner-input__field:disabled { color: var(--color-text-disabled); cursor: not-allowed; }

.portal-spinner-input__field::-webkit-inner-spin-button,
.portal-spinner-input__field::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

.portal-spinner-input__btns {
  display: flex;
  flex-direction: column;
  width: var(--size-xl);
  flex-shrink: 0;
  background-color: var(--color-primary);
  border-radius: 0 var(--radius-base) var(--radius-base) 0;
}

.portal-spinner-input__btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--color-white);
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.portal-spinner-input__btn:hover { background: var(--hover-primary); }
.portal-spinner-input__btn:active { background: var(--pressed-primary); }
.portal-spinner-input__btn:disabled { cursor: not-allowed; opacity: 0.6; }
</style>
