<!--
  @file PortalSelect.vue - Select dropdown component
  @author Vicky Zhu
  @date 2026-03-13
  @description Wraps el-select with grouped/flat options, full slot support and expose methods
-->
<template>
  <div class="portal-select-container">
    <el-select
      ref="selectRef"
      :size="size"
      :class="{ 'portal-select--bordered': bordered }"
      v-model="model"
      :placeholder="resolvedPlaceholder"
      :disabled="disabled"
      :clearable="clearable"
      :multiple="multiple"
      :collapse-tags="collapseTags"
      :collapse-tags-tooltip="collapseTagsTooltip"
      :tag-tooltip="tagTooltip"
      :multiple-limit="multipleLimit"
      :filterable="filterable"
      :allow-create="allowCreate"
      :filter-method="filterMethod"
      :remote="remote"
      :remote-method="remoteMethod"
      :remote-show-suffix="remoteShowSuffix"
      :loading="loading"
      :loading-text="loadingText"
      :no-match-text="noMatchText"
      :no-data-text="noDataText"
      :effect="effect"
      :autocomplete="autocomplete"
      :id="id"
      :name="name"
      :value-key="valueKey"
      :reserve-keyword="reserveKeyword"
      :default-first-option="defaultFirstOption"
      :teleported="teleported"
      :persistent="persistent"
      :automatic-dropdown="automaticDropdown"
      :fit-input-width="fitInputWidth"
      :suffix-icon="suffixIcon"
      :tag-type="tagType"
      :validate-event="validateEvent"
      :placement="placement"
      :max-collapse-tags="maxCollapseTags"
      :popper-options="popperOptions"
      :aria-label="ariaLabel"
      :empty-values="emptyValues"
      :value-on-clear="valueOnClear"
      :suffix-transition="suffixTransition"
      :debounce="debounce"
      :popper-style="popperStyle"
      :append-to="appendTo"
      :clear-icon="clearIcon"
      :tag-effect="tagEffect"
      :offset="offset"
      :show-arrow="showArrow"
      :fallback-placements="fallbackPlacements"
      :tabindex="tabindex"
      :props="optionProps"
      :popper-class="`portal-select-popper ${popperClass || ''}`"
      :transition="transition"
      :show-after="showAfter"
      :hide-after="hideAfter"
      :auto-close="autoClose"
      @change="change"
      @visible-change="visibleChange"
      @remove-tag="removeTag"
      @clear="clear"
      @blur="blur"
      @focus="focus"
      @popup-scroll="onPopupScroll"
    >
      <template
        v-if="$slots.default"
        #default
      >
        <slot name="default" />
      </template>
      <template v-if="!$slots.default && grouped">
        <el-option-group
          v-for="group in options"
          :key="group[labelKey]"
          :label="group[labelKey]"
          :disabled="group.disabled"
        >
          <slot
            name="option-group"
            :group="group"
          >
            <el-option
              v-for="item in group.children"
              :key="item[valueKey]"
              :label="item[labelKey]"
              :value="item[valueKey]"
              :disabled="item.disabled"
            />
          </slot>
        </el-option-group>
      </template>
      <template v-if="!$slots.default && !grouped">
        <el-option
          v-for="item in options"
          :key="item[valueKey]"
          :label="item[labelKey]"
          :value="item[valueKey]"
          :disabled="item.disabled"
        />
      </template>
      <template
        v-if="$slots.header"
        #header
      >
        <slot name="header" />
      </template>
      <template
        v-if="$slots.footer"
        #footer
      >
        <slot name="footer" />
      </template>
      <template
        v-if="$slots.prefix"
        #prefix
      >
        <slot name="prefix" />
      </template>
      <template
        v-if="$slots.empty"
        #empty
      >
        <slot name="empty" />
      </template>
      <template
        v-if="$slots.tag"
        #tag="scope"
      >
        <slot
          name="tag"
          v-bind="scope"
        />
      </template>
      <template
        v-if="$slots.loading"
        #loading
      >
        <slot name="loading" />
      </template>
      <template
        v-if="$slots.label"
        #label="scope"
      >
        <slot
          name="label"
          v-bind="scope"
        />
      </template>
    </el-select>
  </div>
</template>

<script setup lang="ts">
  /**
   * @component PortalSelect - Select dropdown component
   * @author Vicky Zhu
   * @date 2026-03-13
   * @props {OptionItem[]} options - Option data source
   * @props {boolean} [multiple=false] - Whether to enable multiple selection
   * @props {boolean} [filterable=false] - Whether to enable search filtering
   * @props {boolean} [remote=false] - Whether to enable remote search
   * @props {boolean} [grouped=false] - Whether to render options as groups
   * @emits {string|number|array} change - Triggered when selected value changes
   * @emits {boolean} visibleChange - Triggered when dropdown visibility changes
   * @emits {string|number} removeTag - Triggered when a tag is removed in multiple mode
   * @emits clear - Triggered when the select is cleared
   * @emits {Event} popupScroll - Triggered when the dropdown scrolls
   * @slot default - Custom option list content
   * @slot header - Dropdown header content
   * @slot footer - Dropdown footer content
   * @slot prefix - Select prefix content
   * @slot empty - Content when no options available
   * @slot tag - Custom tag content in multiple mode
   * @slot loading - Custom loading content
   * @slot label - Custom label content
   * @slot option-group - Custom content within each option group
   */

  import { computed, ref } from 'vue'
  import { useI18n } from '@/i18n'

  const { t } = useI18n()

  interface OptionItem {
    [key: string]: any
    disabled?: boolean
  }

  interface Props {
    options?: OptionItem[]
    placeholder?: string
    bordered?: boolean
    disabled?: boolean
    clearable?: boolean
    multiple?: boolean
    collapseTags?: boolean
    collapseTagsTooltip?: boolean
    tagTooltip?: Record<string, any>
    multipleLimit?: number
    filterable?: boolean
    allowCreate?: boolean
    filterMethod?: (query: string) => void
    remote?: boolean
    remoteMethod?: (query: string) => void
    remoteShowSuffix?: boolean
    loading?: boolean
    loadingText?: string
    noMatchText?: string
    noDataText?: string
    effect?: 'dark' | 'light' | string
    autocomplete?: string
    id?: string
    name?: string
    valueKey?: string
    labelKey?: string
    size?: 'large' | 'default' | 'small'
    reserveKeyword?: boolean
    defaultFirstOption?: boolean
    teleported?: boolean
    persistent?: boolean
    automaticDropdown?: boolean
    fitInputWidth?: boolean
    suffixIcon?: string | object
    tagType?: 'success' | 'info' | 'warning' | 'danger'
    validateEvent?: boolean
    placement?: string
    maxCollapseTags?: number
    popperOptions?: Record<string, any>
    ariaLabel?: string
    emptyValues?: any[]
    valueOnClear?: any
    suffixTransition?: boolean
    debounce?: number
    popperStyle?: string | Record<string, any>
    appendTo?: string
    clearIcon?: string | object
    tagEffect?: 'light' | 'dark' | 'plain'
    offset?: number
    showArrow?: boolean
    fallbackPlacements?: string[]
    tabindex?: string | number
    popperClass?: string
    transition?: string
    showAfter?: number
    hideAfter?: number
    autoClose?: number
    optionProps?: {
      value?: string
      label?: string
      options?: string
      disabled?: string
    }
    grouped?: boolean
  }

  defineOptions({ name: 'PortalSelect' })

  const model = defineModel<string | number | string[] | number[]>()

  const props = withDefaults(defineProps<Props>(), {
    options: () => [],
    placeholder: '',
    bordered: true,
    disabled: false,
    clearable: false,
    multiple: false,
    collapseTags: false,
    collapseTagsTooltip: false,
    tagTooltip: () => ({}),
    multipleLimit: 0,
    filterable: false,
    allowCreate: false,
    remote: false,
    remoteShowSuffix: false,
    loading: false,
    effect: 'light',
    autocomplete: 'off',
    valueKey: 'value',
    labelKey: 'label',
    size: 'small',
    reserveKeyword: true,
    defaultFirstOption: false,
    teleported: true,
    persistent: true,
    automaticDropdown: false,
    fitInputWidth: true,
    tagType: 'info',
    validateEvent: true,
    maxCollapseTags: 1,
    suffixTransition: true,
    debounce: 300,
    tagEffect: 'light',
    offset: 12,
    showArrow: true,
    fallbackPlacements: () => ['bottom-start', 'top-start', 'right', 'left'],
    optionProps: () => ({
      value: 'value',
      label: 'label',
      options: 'options',
      disabled: 'disabled',
    }),
    grouped: false,
  })

  const emit = defineEmits<{
    change: [value: string | number | string[] | number[]]
    visibleChange: [visible: boolean]
    removeTag: [tag: string | number]
    clear: []
    blur: [event: FocusEvent]
    focus: [event: FocusEvent]
    popupScroll: [event: Event]
  }>()

  const selectRef = ref()

  const resolvedPlaceholder = computed(() => props.placeholder || t('common.select'))

  /**
   * Handle selection change
   * @author Vicky Zhu
   * @param {string|number|string[]|number[]} val - New selected value(s)
   */
  const change = (val: string | number | string[] | number[]) => {
    emit('change', val)
  }

  /**
   * Handle dropdown visibility change
   * @author Vicky Zhu
   * @param {boolean} visible - Whether dropdown is visible
   */
  const visibleChange = (visible: boolean) => {
    emit('visibleChange', visible)
  }

  /**
   * Handle tag removal in multiple mode
   * @author Vicky Zhu
   * @param {string|number} tag - Removed tag value
   */
  const removeTag = (tag: string | number) => {
    emit('removeTag', tag)
  }

  /**
   * Handle clear event
   * @author Vicky Zhu
   */
  const clear = () => {
    emit('clear')
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
   * Handle focus event
   * @author Vicky Zhu
   * @param {FocusEvent} event - Focus event object
   */
  const focus = (event: FocusEvent) => {
    emit('focus', event)
  }

  /**
   * Handle popup scroll event
   * @author Vicky Zhu
   * @param {Event} event - Scroll event object
   */
  const onPopupScroll = (event: Event) => {
    emit('popupScroll', event)
  }

  defineExpose({
    selectRef,
    focus: () => selectRef.value?.focus(),
    blur: () => selectRef.value?.blur(),
    selectedLabel: () => selectRef.value?.selectedLabel,
  })
</script>

<style lang="scss" scoped>
  .portal-select-container {
    &--bordered {
      border: 1px solid var(--color-border-base);
      border-radius: var(--radius-base);
    }

    :deep() {
      .el-select {
        width: 100%;
      }

      .el-select__wrapper {
        box-shadow: none;
        padding: 0 2px 0 12px;
      }

      .el-select__prefix,
      .el-select__suffix {
        background-color: var(--color-primary);
        color: var(--color-white);
        font-weight: bold;
        width: var(--size-xl);
        height: var(--size-xl);
        justify-content: center;
        border-radius: var(--radius-base);
      }

      .el-select__caret {
        color: var(--color-white);
      }

      .el-tag {
        background: var(--color-background-tag);
      }

      .el-tag .el-tag__close {
        background: var(--color-background-tag);
        color: var(--color-text-default);
        font-size: var(--font-size-micro) !important;

        &:hover {
          color: var(--color-danger);
        }
      }

      .el-tag.el-tag--info {
        color: var(--color-secondary);
        font-size: var(--font-size-micro) !important;
      }
    }
  }
</style>

<style lang="scss">
  .portal-select-popper {
    .el-select-dropdown__item:hover,
    .el-select-dropdown__item.hover {
      background-color: var(--select-color-hover);
    }

    .el-select-dropdown__item.is-selected {
      background-color: var(--select-color-pressed);
      border-left: 3px solid var(--color-primary);
      color: var(--color-secondary);
      font-weight: 500;
    }
  }
</style>
