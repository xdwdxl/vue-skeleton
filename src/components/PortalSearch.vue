<!--
  @file PortalSearch.vue - Search input component
  @author Vicky Zhu
  @date 2026-03-13
  @description Search input with three layout variants (underline, append, button), supporting Enter key search and clear
-->
<template>
  <div
    class="portal-search-container"
    :class="`portal-search--${variant}`"
  >
    <el-input
      v-model="model"
      v-bind="inputProps"
      v-on="inputEvents"
      :class="variant === 'underline' ? 'input-box-bottom' : 'input-box'"
      :clearable="variant !== 'button'"
      :prefix-icon="variant === 'underline' ? Search : undefined"
    >
      <template
        v-if="$slots.prefix"
        #prefix
      >
        <slot name="prefix" />
      </template>
      <template
        v-if="$slots.suffix && variant !== 'append'"
        #suffix
      >
        <slot name="suffix" />
      </template>
      <template
        v-if="variant === 'append'"
        #append
      >
        <slot name="append">
          <el-button
            type="primary"
            :icon="Search"
            @click="onSearch"
            class="search-button"
          ></el-button>
        </slot>
      </template>
    </el-input>
    <template v-if="variant === 'button'">
      <el-button
        type="primary"
        :icon="Search"
        :disabled="disabled"
        @click="onSearch"
        class="search-button-margin"
      ></el-button>
      <el-button
        v-if="showClear"
        type="danger"
        :icon="CloseBold"
        :disabled="disabled"
        @click="onClear"
        class="search-button-margin"
      ></el-button>
    </template>
  </div>
</template>

<script setup lang="ts">
  /**
   * @component PortalSearch - Search input component
   * @author Vicky Zhu
   * @date 2026-03-13
   * @props {string} [variant='button'] - Layout variant: underline, append, button
   * @props {boolean} [showClear=true] - Whether to show clear button in button variant
   * @props {string} [width='300px'] - Component width
   * @props {boolean} [disabled=false] - Whether the input is disabled
   * @emits {string} search - Triggered when search is performed
   * @emits clear - Triggered when input is cleared
   * @slot prefix - Custom prefix content
   * @slot suffix - Custom suffix content (not available in append variant)
   * @slot append - Custom append content (only in append variant)
   */

  import { computed } from 'vue'
  import { Search, CloseBold } from '@element-plus/icons-vue'
  import { useI18n } from '@/i18n'

  const { t } = useI18n()

  interface Props {
    placeholder?: string
    variant?: 'underline' | 'append' | 'button'
    showClear?: boolean
    width?: string
    disabled?: boolean
    readonly?: boolean
    size?: 'large' | 'default' | 'small'
    maxlength?: string | number
    minlength?: number
    autofocus?: boolean
  }

  defineOptions({ name: 'PortalSearch' })

  const model = defineModel<string>({ default: '' })

  const props = withDefaults(defineProps<Props>(), {
    placeholder: '',
    variant: 'button',
    showClear: true,
    width: '300px',
    disabled: false,
    readonly: false,
    size: 'default',
    autofocus: false,
  })

  const emit = defineEmits<{
    search: [value: string]
    clear: []
    input: [value: string]
    change: [value: string]
    focus: [event: FocusEvent]
    blur: [event: FocusEvent]
  }>()

  const inputProps = computed(() => ({
    placeholder: props.placeholder || t('common.search'),
    disabled: props.disabled,
    readonly: props.readonly,
    size: props.size,
    maxlength: props.maxlength,
    minlength: props.minlength,
    autofocus: props.autofocus,
  }))

  /**
   * Trigger search with current input value
   * @author Vicky Zhu
   */
  function onSearch() {
    emit('search', model.value)
  }

  /**
   * Clear input value and emit clear event
   * @author Vicky Zhu
   */
  function onClear() {
    model.value = ''
    emit('clear')
  }

  const inputEvents = {
    clear: onClear,
    input: (val: string | number) => emit('input', String(val)),
    change: (val: string | number) => emit('change', String(val)),
    focus: (event: FocusEvent) => emit('focus', event),
    blur: (event: FocusEvent) => emit('blur', event),
    keydown: (event: KeyboardEvent) => {
      if (event.key === 'Enter') onSearch()
    },
  }
</script>

<style lang="scss" scoped>
  .portal-search-container {
    display: flex;
    align-items: center;
    width: v-bind(width);

    .input-box {
      border: 1px solid var(--color-border-base);
      border-radius: var(--radius-base);
    }

    .input-box-bottom {
      border-bottom: 2px solid var(--color-primary);
    }

    .search-button-margin {
      min-width: var(--size-xxl) !important;
      height: var(--size-xxl) !important;
      text-align: center;
      padding: 0 !important;
      border-radius: var(--radius-base) !important;
      margin-left: var(--spacing-sm-plus) !important;
      font-size: var(--font-size-mini);
    }

    :deep(.search-button) {
      color: var(--color-white) !important;
      background-color: var(--color-primary) !important;
      border-color: var(--color-primary) !important;
      margin: 0 var(--spacing-xxs);
      min-width: var(--size-xl) !important;
      height: var(--size-xl) !important;
      text-align: center;
      padding: 0 !important;
      border-radius: var(--radius-base) !important;

      .el-icon {
        font-size: var(--font-size-micro);
      }
    }

    :deep() {
      .el-input-group__append,
      .el-input-group__prepend {
        padding: 0;
      }

      .el-input__wrapper,
      .el-input-group__append {
        box-shadow: none;
      }

      .el-input__prefix {
        color: var(--color-primary);
        font-weight: bold;
        font-size: var(--font-size-extra-small);
      }

      .el-input__inner {
        height: var(--spacing-lg);
      }
    }
  }
</style>
