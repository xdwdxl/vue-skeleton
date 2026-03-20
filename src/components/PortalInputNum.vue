<!--
  @file PortalInputNum.vue - Number Input component
  @author Vicky Zhu
  @date 2026-03-16
  @description Wraps el-input-number with bordered style and full slot support
-->
<template>
  <div class="portal-input-num-container">
    <el-input-number
      :size="size"
      class="input-num portal-input--bordered"
      v-model="model"
      :min="min"
      :max="max"
      :step="step"
      :step-strictly="stepStrictly"
      :precision="precision"
      :controls="controls"
      :controls-position="controlsPosition"
      :disabled="disabled"
      :readonly="readonly"
      :name="name"
      :aria-label="ariaLabel"
      :placeholder="resolvedPlaceholder"
      :id="id"
      :value-on-clear="valueOnClear"
      :validate-event="validateEvent"
      :inputmode="inputmode"
      :align="align"
      :disabled-scientific="disabledScientific"
      v-bind="$attrs"
      @change="change"
      @focus="focus"
      @blur="blur"
    >
      <template
        v-if="$slots['decrease-icon']"
        #decrease-icon
      >
        <slot name="decrease-icon" />
      </template>
      <template
        v-if="$slots['increase-icon']"
        #increase-icon
      >
        <slot name="increase-icon" />
      </template>
      <template
        v-if="$slots.prefix"
        #prefix
      >
        <slot name="prefix" />
      </template>
      <template
        v-if="$slots.suffix"
        #suffix
      >
        <slot name="suffix" />
      </template>
    </el-input-number>
  </div>
</template>

<script setup lang="ts">
  /**
   * @component PortalInputNum - Number Input component
   * @author Vicky Zhu
   * @date 2026-03-16
   * @props {string} [size='small'] - Input size: large, default, small
   * @props {number} [min=1] - Minimum value
   * @props {number} [max=1000] - Maximum value
   * @props {number} [step=1] - Step increment
   * @props {boolean} [controls=true] - Whether to show increase/decrease buttons
   * @props {string} [controlsPosition='right'] - Position of number controls
   * @props {boolean} [disabled=false] - Whether input is disabled
   * @props {boolean} [readonly=false] - Whether input is readonly
   * @emits {number} change - Triggered when value changes
   * @emits {FocusEvent} focus - Triggered when input gains focus
   * @emits {FocusEvent} blur - Triggered when input loses focus
   * @slot prefix - Input prefix content
   * @slot suffix - Input suffix content
   * @slot decrease-icon - Custom decrease icon
   * @slot increase-icon - Custom increase icon
   */
  import { computed } from 'vue'
  import { useI18n } from '@/i18n'

  const { t } = useI18n()

  interface Props {
    placeholder?: string
    size?: 'large' | 'default' | 'small'
    disabled?: boolean
    readonly?: boolean
    name?: string
    ariaLabel?: string
    id?: string
    validateEvent?: boolean
    min?: number
    max?: number
    step?: number
    stepStrictly?: boolean
    precision?: number
    controls?: boolean
    controlsPosition?: '' | 'right'
    valueOnClear?: number | null | 'min' | 'max'
    inputmode?: string
    align?: 'left' | 'center' | 'right'
    disabledScientific?: boolean
  }

  defineOptions({ name: 'PortalInputNum' })

  const model = defineModel<number>()

  const props = withDefaults(defineProps<Props>(), {
    placeholder: '',
    size: 'small',
    disabled: false,
    readonly: false,
    validateEvent: true,
    min: 1,
    max: 1000,
    step: 1,
    stepStrictly: false,
    controls: true,
    controlsPosition: 'right',
    align: 'center',
    disabledScientific: false,
  })

  const emit = defineEmits<{
    change: [value: number]
    focus: [event: FocusEvent]
    blur: [event: FocusEvent]
  }>()

  const resolvedPlaceholder = computed(() => props.placeholder || t('common.please_input'))

  const change = (val: number) => {
    emit('change', val)
  }

  const focus = (event: FocusEvent) => {
    emit('focus', event)
  }

  const blur = (event: FocusEvent) => {
    emit('blur', event)
  }
</script>

<style lang="scss" scoped>
  .portal-input-num-container {
    &--bordered {
      border: 1px solid var(--color-border-base);
      border-radius: var(--radius-base);
    }

    .input-num {
      width: 100%;
    }

    :deep() {
      .el-input__wrapper {
        box-shadow: none;
      }

      .el-input__prefix {
        color: var(--color-primary);
        font-weight: bold;
        font-size: var(--font-size-extra-small);
      }

      .el-input-number__decrease,
      .el-input-number__increase {
        background-color: var(--color-primary);
        color: var(--color-white);
        width: var(--size-xl);
      }
    }
  }
</style>
