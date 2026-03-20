<!--
  @file PortalStep.vue - Arrow-style step indicator component
  @author Cooper Wang
  @date 2026-03-13
  @description Renders a horizontal step navigation bar with chevron arrow separators and active state highlighting
-->
<template>
  <div class="portal-step" v-bind="$attrs">
    <div
      v-for="(step, index) in steps"
      :key="step.id"
      class="portal-step__item"
      :class="{
        'portal-step__item--active': step.id === modelValue,
        'portal-step__item--last': index === steps.length - 1,
      }"
      @click="handleClick(step)"
    >
      <span class="portal-step__circle">{{ index + 1 }}</span>
      <span class="portal-step__label">{{ step.label }}</span>
      <!-- Chevron arrow separator (not on last item) -->
      <span v-if="index !== steps.length - 1" class="portal-step__arrow"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

export interface StepItem {
  id: string | number
  label: string
  [key: string]: unknown
}

const props = defineProps<{
  modelValue: string | number
  steps: StepItem[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  'step-click': [step: StepItem]
}>()

/**
 * Handle step click and emit selection change
 * @author Cooper Wang
 * @param {StepItem} step - Clicked step item
 */
function handleClick(step: StepItem) {
  emit('update:modelValue', step.id)
  emit('step-click', step)
}

defineExpose({
  /** Allow parent to read current steps data */
  steps: props.steps,
})
</script>

<style scoped>
/* Step height = 30px (from design 10*30) */
.portal-step {
  --_h: 30px;
  --_arrow-w: var(--spacing-sm-plus);
  --_border-color: var(--color-border-base);
  --_bg: var(--color-background-page);

  display: flex;
  align-items: center;
  padding-left: 32px;
}

.portal-step__item {
  display: flex;
  align-items: center;
  height: var(--_h);
  padding: 0 var(--spacing-sm-plus);
  background-color: var(--_bg);
  border-top: 1px solid var(--_border-color);
  border-bottom: 1px solid var(--_border-color);
  cursor: pointer;
  position: relative;
  flex: 1;
}

/* Circle: 20×20, numbered */
.portal-step__circle {
  width: var(--size-xl);
  height: var(--size-xl);
  min-width: var(--size-xl);
  border-radius: var(--radius-circle);
  background-color: var(--color-secondary);
  color: var(--color-white);
  font-size: var(--font-size-micro);
  font-family: var(--font-family-bold);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Label: 12px bold */
.portal-step__label {
  font-size: var(--font-size-micro);
  font-family: var(--font-family-bold);
  font-weight: 700;
  color: var(--color-text-title);
  white-space: nowrap;
  margin-left: 5px;
}

/* Chevron arrow > separator: 10×30, 1px outline same as border */
.portal-step__arrow {
  position: absolute;
  right: 5px;
  top: 0;
  width: 0;
  height: 0;
  /* Outer arrow (border color) — 10px wide, 30px tall */
  border-top: calc(var(--_h) / 2) solid transparent;
  border-bottom: calc(var(--_h) / 2) solid transparent;
  border-left: var(--_arrow-w) solid var(--_border-color);
  z-index: 2;
  transform: translateX(100%);
}

/* Inner arrow: 1px smaller on each edge to create 1px outline chevron */
.portal-step__arrow::after {
  content: '';
  position: absolute;
  top: calc(var(--_h) / -2 + 1px);
  left: calc(var(--_arrow-w) * -1);
  width: 0;
  height: 0;
  border-top: calc(var(--_h) / 2 - 1px) solid transparent;
  border-bottom: calc(var(--_h) / 2 - 1px) solid transparent;
  border-left: calc(var(--_arrow-w) - 1px) solid var(--_bg);
  z-index: 3;
}

/* Active step: blue circle */
.portal-step__item--active .portal-step__circle {
  background-color: var(--color-primary);
}

/* Active step: blue label */
.portal-step__item--active .portal-step__label {
  color: var(--color-primary);
}
</style>
