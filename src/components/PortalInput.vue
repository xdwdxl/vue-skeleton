<!--
  @file PortalInput.vue - Input component
  @author Vicky Zhu
  @date 2026-03-16
  @description Wraps el-input with bordered style and full slot support
-->
<template>
  <div class="portal-input-container">
    <el-input
      :size="size"
      :class="{ 'portal-input--bordered': bordered && type !== 'textarea' }"
      v-model="model"
      :type="type"
      :placeholder="resolvedPlaceholder"
      :clearable="clearable"
      :clear-icon="clearIcon"
      :disabled="disabled"
      :readonly="readonly"
      :maxlength="maxlength"
      :minlength="minlength"
      :show-word-limit="showWordLimit"
      :word-limit-position="wordLimitPosition"
      :show-password="showPassword"
      :rows="rows"
      :autosize="autosize"
      :resize="resize"
      :autocomplete="autocomplete"
      :name="name"
      :autofocus="autofocus"
      :form="form"
      :aria-label="ariaLabel"
      :tabindex="tabindex"
      :validate-event="validateEvent"
      :input-style="inputStyle"
      :prefix-icon="prefixIcon"
      :suffix-icon="suffixIcon"
      :formatter="formatter"
      :parser="parser"
      :inputmode="inputmode"
      v-bind="$attrs"
      @input="input"
      @change="change"
      @focus="focus"
      @blur="blur"
      @clear="clear"
      @keydown="keydown"
      @mouseleave="mouseleave"
      @mouseenter="mouseenter"
      @compositionstart="compositionstart"
      @compositionupdate="compositionupdate"
      @compositionend="compositionend"
    >
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
      <template
        v-if="$slots.prepend"
        #prepend
      >
        <slot name="prepend" />
      </template>
      <template
        v-if="$slots.append"
        #append
      >
        <slot name="append" />
      </template>
    </el-input>
  </div>
</template>

<script setup lang="ts">
  /**
   * @component PortalInput - Input component
   * @author Vicky Zhu
   * @date 2026-03-16
   * @props {string} [type='text'] - Input type: text, textarea, password
   * @props {boolean} [clearable=false] - Whether to show clear button
   * @props {boolean} [bordered=true] - Whether to show border style
   * @props {boolean} [disabled=false] - Whether input is disabled
   * @props {boolean} [readonly=false] - Whether input is readonly
   * @props {string|number} [maxlength=1000] - Maximum input length
   * @props {boolean} [showWordLimit=false] - Whether to show word count
   * @props {boolean} [showPassword=false] - Whether to show password toggle
   * @props {string} [size='small'] - Input size: large, default, small
   * @props {number} [rows=2] - Number of rows for textarea
   * @props {boolean|object} [autosize=false] - Auto height for textarea
   * @emits {string|number} input - Triggered on input
   * @emits {string|number} change - Triggered when value changes
   * @emits {FocusEvent} focus - Triggered when input gains focus
   * @emits {FocusEvent} blur - Triggered when input loses focus
   * @emits clear - Triggered when input is cleared
   * @emits {KeyboardEvent} keydown - Triggered on keydown
   * @emits {MouseEvent} mouseleave - Triggered when mouse leaves input
   * @emits {MouseEvent} mouseenter - Triggered when mouse enters input
   * @emits {CompositionEvent} compositionstart - Triggered on IME composition start
   * @emits {CompositionEvent} compositionupdate - Triggered on IME composition update
   * @emits {CompositionEvent} compositionend - Triggered on IME composition end
   * @slot prefix - Input prefix content
   * @slot suffix - Input suffix content
   * @slot prepend - Input prepend content
   * @slot append - Input append content
   */
  import { computed, type Component } from 'vue'
  import { useI18n } from '@/i18n'

  const { t } = useI18n()

  type InputType = 'text' | 'textarea' | 'password'
  type InputAutosize = boolean | { minRows?: number; maxRows?: number }

  interface Props {
    type?: InputType
    placeholder?: string
    clearable?: boolean
    clearIcon?: string | Component
    bordered?: boolean
    disabled?: boolean
    readonly?: boolean
    maxlength?: string | number
    minlength?: number
    showWordLimit?: boolean
    wordLimitPosition?: 'inside' | 'outside'
    showPassword?: boolean
    size?: 'large' | 'default' | 'small'
    prefixIcon?: string | Component
    suffixIcon?: string | Component
    rows?: number
    autosize?: InputAutosize
    autocomplete?: string
    name?: string
    validateEvent?: boolean
    resize?: 'none' | 'both' | 'horizontal' | 'vertical'
    autofocus?: boolean
    form?: string
    ariaLabel?: string
    tabindex?: string | number
    inputStyle?: string | Record<string, string>
    formatter?: (value: string | number) => string
    parser?: (value: string) => string
    inputmode?: string
  }

  defineOptions({ name: 'PortalInput' })

  const model = defineModel<string | number>()

  const props = withDefaults(defineProps<Props>(), {
    type: 'text',
    placeholder: '',
    clearable: false,
    bordered: true,
    disabled: false,
    readonly: false,
    maxlength: 1000,
    showWordLimit: false,
    wordLimitPosition: 'inside',
    showPassword: false,
    size: 'small',
    rows: 2,
    autosize: false,
    autocomplete: 'off',
    autofocus: false,
    validateEvent: true,
  })

  const emit = defineEmits<{
    input: [value: string | number]
    change: [value: string | number]
    focus: [event: FocusEvent]
    blur: [event: FocusEvent]
    clear: []
    keydown: [event: KeyboardEvent]
    mouseleave: [event: MouseEvent]
    mouseenter: [event: MouseEvent]
    compositionstart: [event: CompositionEvent]
    compositionupdate: [event: CompositionEvent]
    compositionend: [event: CompositionEvent]
  }>()

  const resolvedPlaceholder = computed(() => props.placeholder || t('common.please_input'))

  /**
   * Handle input event
   * @author Vicky Zhu
   * @param {string|number} val - Current input value
   */
  const input = (val: string | number) => {
    emit('input', val)
  }

  /**
   * Handle value change event
   * @author Vicky Zhu
   * @param {string|number} val - Changed value
   */
  const change = (val: string | number) => {
    emit('change', val)
  }

  /**
   * Handle focus event
   * @author Vicky Zhu
   * @param {FocusEvent} event - Focus event object
   */
  const focus = (event: FocusEvent) => {
    emit('focus', event)
  }

  /**
   * Handle blur event
   * @author Vicky Zhu
   * @param {FocusEvent} event - Blur event object
   */
  const blur = (event: FocusEvent) => {
    emit('blur', event)
  }

  /**
   * Handle clear event
   * @author Vicky Zhu
   */
  const clear = () => {
    emit('clear')
  }

  /**
   * Handle keydown event
   * @author Vicky Zhu
   * @param {KeyboardEvent} event - Keyboard event object
   */
  const keydown = (event: KeyboardEvent) => {
    emit('keydown', event)
  }

  /**
   * Handle mouseleave event
   * @author Vicky Zhu
   * @param {MouseEvent} event - Mouse event object
   */
  const mouseleave = (event: MouseEvent) => {
    emit('mouseleave', event)
  }

  /**
   * Handle mouseenter event
   * @author Vicky Zhu
   * @param {MouseEvent} event - Mouse event object
   */
  const mouseenter = (event: MouseEvent) => {
    emit('mouseenter', event)
  }

  /**
   * Handle compositionstart event
   * @author Vicky Zhu
   * @param {CompositionEvent} event - Composition event object
   */
  const compositionstart = (event: CompositionEvent) => {
    emit('compositionstart', event)
  }

  /**
   * Handle compositionupdate event
   * @author Vicky Zhu
   * @param {CompositionEvent} event - Composition event object
   */
  const compositionupdate = (event: CompositionEvent) => {
    emit('compositionupdate', event)
  }

  /**
   * Handle compositionend event
   * @author Vicky Zhu
   * @param {CompositionEvent} event - Composition event object
   */
  const compositionend = (event: CompositionEvent) => {
    emit('compositionend', event)
  }
</script>

<style lang="scss" scoped>
  .portal-input-container {
    &--bordered {
      border: 1px solid var(--color-border-base);
      border-radius: var(--radius-base);
    }

    :deep() {
      .el-input__wrapper {
        box-shadow: none;
      }

      .el-input__clear {
        font-size: var(--spacing-xl-minus);

        &:hover {
          color: var(--color-danger);
        }

        svg path:last-child {
          display: none;
        }
      }

      .el-input__prefix {
        color: var(--color-primary);
        font-weight: bold;
        font-size: var(--font-size-extra-small);
      }

      .el-input-group__append,
      .el-input-group__prepend {
        padding: 0;
      }

      .el-textarea__inner {
        padding: var(--spacing-xs) var(--spacing-sm-plus);
      }
    }
  }
</style>
