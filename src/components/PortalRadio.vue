<!--
  @file PortalRadio.vue - Radio group component
  @author Vicky Zhu
  @date 2026-03-13
  @description Wraps el-radio-group with support for radio and radio-button modes
-->
<template>
  <div class="portal-radio-container">
    <el-radio-group
      v-model="model"
      :disabled="disabled"
      :size="size"
      :validate-event="validateEvent"
      :text-color="textColor"
      :fill="fill"
      :aria-label="ariaLabel"
      :name="name"
      :id="id"
      @change="change"
    >
      <component
        :is="isButton ? ElRadioButton : ElRadio"
        v-for="item in options"
        :key="item.value"
        :value="item.value"
        :label="item.label"
        :disabled="item.disabled"
        :border="border"
        :size="size"
        :name="name"
      >
        <slot :item="item">{{ item.label }}</slot>
      </component>
      <slot name="group" />
    </el-radio-group>
  </div>
</template>

<script setup lang="ts">
  /**
   * @component PortalRadio - Radio group component
   * @author Vicky Zhu
   * @date 2026-03-13
   * @props {RadioOption[]} options - Radio option list
   * @props {boolean} [disabled=false] - Whether the entire group is disabled
   * @props {boolean} [isButton=false] - Whether to render as button style
   * @props {boolean} [border=false] - Whether to show border around each radio
   * @props {string} [size] - Radio size: large, default, small
   * @emits {string|number} change - Triggered when selected value changes
   * @slot default - Custom label content for each radio item
   * @slot group - Custom group content appended after default options
   */

  import { ElRadio, ElRadioButton } from 'element-plus'
  import type { RadioOption } from '@/types/components'

  interface Props {
    options?: RadioOption[]
    disabled?: boolean
    isButton?: boolean
    border?: boolean
    size?: 'large' | 'default' | 'small'
    name?: string
    validateEvent?: boolean
    textColor?: string
    fill?: string
    ariaLabel?: string
    id?: string
  }

  defineOptions({ name: 'PortalRadio' })

  const model = defineModel<string | number | boolean>({ default: '' })

  withDefaults(defineProps<Props>(), {
    options: () => [],
    disabled: false,
    isButton: false,
    border: false,
    validateEvent: true,
    textColor: 'var(--color-white)',
    fill: 'var(--color-primary)',
  })

  const emit = defineEmits<{
    change: [value: string | number]
  }>()

  /**
   * Handle radio group value change
   * @author Vicky Zhu
   * @param {string|number} val - New selected value
   */
  const change = (val: string | number) => {
    emit('change', val)
  }
</script>

<style lang="scss" scoped>
  .portal-radio-container {
    :deep(.el-radio__inner:after) {
      content: none;
    }
  }
</style>
