<!--
  @file PortalCheckbox.vue - Checkbox group component
  @author Vicky Zhu
  @date 2026-03-13
  @description Wraps el-checkbox-group with support for checkbox and checkbox-button modes
-->
<template>
  <div class="portal-checkbox-container">
    <el-checkbox-group
      v-model="model"
      :disabled="disabled"
      :min="min"
      :max="max"
      :size="size"
      :text-color="textColor"
      :fill="fill"
      :tag="tag"
      :validate-event="validateEvent"
      :aria-label="ariaLabel"
      @change="change"
    >
      <slot name="group">
        <component
          :is="isButton ? ElCheckboxButton : ElCheckbox"
          v-for="item in options"
          :key="String(item.value)"
          :value="item.value"
          :label="item.label"
          :disabled="item.disabled"
          :checked="item.checked"
          :indeterminate="item.indeterminate"
          :border="item.border ?? border"
          :size="item.size ?? size"
          :true-value="item.trueValue"
          :false-value="item.falseValue"
          :name="name"
        >
          <slot :item="item">{{ item.label }}</slot>
        </component>
      </slot>
    </el-checkbox-group>
  </div>
</template>

<script setup lang="ts">
  /**
   * @component PortalCheckbox - Checkbox group component
   * @author Vicky Zhu
   * @date 2026-03-13
   * @props {CheckboxOption[]} options - Checkbox option list
   * @props {boolean} [disabled=false] - Whether the entire group is disabled
   * @props {boolean} [isButton=false] - Whether to render as button style
   * @props {boolean} [border=false] - Whether to show border around each checkbox
   * @props {CheckboxSize} [size='default'] - Checkbox size
   * @emits {(string|number)[]} change - Triggered when selected values change
   * @slot default - Custom label content for each checkbox item
   * @slot group - Custom group content replacing default options rendering
   */

  import { ElCheckbox, ElCheckboxButton } from 'element-plus'
  import type { CheckboxOption } from '@/types/components'

  type CheckboxSize = 'large' | 'default' | 'small'

  interface Props {
    options?: CheckboxOption[]
    disabled?: boolean
    min?: number
    max?: number
    name?: string
    isButton?: boolean
    border?: boolean
    size?: CheckboxSize
    textColor?: string
    fill?: string
    tag?: string
    validateEvent?: boolean
    ariaLabel?: string
  }

  defineOptions({ name: 'PortalCheckbox' })

  const model = defineModel<(string | number | boolean)[]>({ default: () => [] })

  withDefaults(defineProps<Props>(), {
    options: () => [],
    disabled: false,
    min: 1,
    max: 10,
    name: '',
    isButton: false,
    border: false,
    size: 'default',
    textColor: 'var(--color-white)',
    fill: 'var(--color-primary)',
    tag: 'div',
    validateEvent: true,
    ariaLabel: '',
  })

  const emit = defineEmits<{
    change: [value: (string | number)[]]
  }>()

  /**
   * Handle checkbox group value change
   * @author Vicky Zhu
   * @param {(string|number)[]} val - New selected values
   */
  const change = (val: (string | number)[]) => {
    emit('change', val)
  }
</script>

<style lang="scss" scoped>
  .portal-checkbox-container {
    :deep(.el-checkbox__inner) {
      border-radius: var(--radius-base);
    }
  }
</style>
