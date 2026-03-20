<!--
  @file PortalToolTip.vue - Tooltip component
  @author Vicky Zhu
  @date 2026-03-16
  @description Wraps el-tooltip with full attribute, event, slot and expose support
-->
<template>
  <div class="portal-tool-tip-container">
    <el-tooltip
      ref="tooltipRef"
      v-model:visible="visibleModel"
      :content="content"
      :raw-content="rawContent"
      :placement="placement"
      :fallback-placements="fallbackPlacements"
      :effect="effect"
      :trigger="trigger"
      :disabled="disabled"
      :offset="offset"
      :transition="transition"
      :popper-options="popperOptions"
      :arrow-offset="arrowOffset"
      :show-after="showAfter"
      :show-arrow="showArrow"
      :hide-after="hideAfter"
      :auto-close="autoClose"
      :popper-style="popperStyle"
      :enterable="enterable"
      :teleported="teleported"
      :virtual-triggering="virtualTriggering"
      :virtual-ref="virtualRef"
      :trigger-keys="triggerKeys"
      :persistent="persistent"
      :aria-label="ariaLabel"
      :focus-on-target="focusOnTarget"
      :append-to="appendTo"
      popper-class="portal-tool-tip-popper"
      @before-show="beforeShow"
      @show="show"
      @before-hide="beforeHide"
      @hide="hide"
    >
      <slot />
      <template
        v-if="$slots.content"
        #content
      >
        <slot name="content" />
      </template>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
  /**
   * @component PortalToolTip - Tooltip component
   * @author Vicky Zhu
   * @date 2026-03-16
   * @props {string} [content=''] - Display content, can be overridden via content slot
   * @props {boolean} [rawContent=false] - Whether content is treated as raw HTML
   * @props {string} [placement='top'] - Position of tooltip
   * @props {string} [effect='dark'] - Tooltip theme: dark or light
   * @props {string|string[]} [trigger='hover'] - How tooltip is triggered
   * @props {boolean} [disabled=false] - Whether tooltip is disabled
   * @props {number} [offset=12] - Offset of the tooltip
   * @props {boolean} [enterable=true] - Whether mouse can enter tooltip
   * @props {number} [showAfter=0] - Delay before appearance in milliseconds
   * @props {number} [hideAfter=200] - Delay before disappear in milliseconds
   * @props {number} [autoClose=0] - Timeout to hide tooltip in milliseconds
   * @emits beforeShow - Triggered before tooltip shows
   * @emits show - Triggered when tooltip shows
   * @emits beforeHide - Triggered before tooltip hides
   * @emits hide - Triggered when tooltip hides
   * @slot default - Tooltip trigger and reference element
   * @slot content - Custom tooltip content
   */

  import { ref } from 'vue'

  type Placement =
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'left'
    | 'left-start'
    | 'left-end'
    | 'right'
    | 'right-start'
    | 'right-end'

  interface Props {
    content?: string
    rawContent?: boolean
    placement?: Placement
    fallbackPlacements?: Placement[]
    effect?: 'dark' | 'light'
    trigger?:
      | 'hover'
      | 'click'
      | 'focus'
      | 'contextmenu'
      | ('hover' | 'click' | 'focus' | 'contextmenu')[]
    disabled?: boolean
    offset?: number
    transition?: string
    popperOptions?: Record<string, any>
    arrowOffset?: number
    showAfter?: number
    showArrow?: boolean
    hideAfter?: number
    autoClose?: number
    popperStyle?: string | Record<string, any>
    enterable?: boolean
    teleported?: boolean
    virtualTriggering?: boolean
    virtualRef?: HTMLElement
    triggerKeys?: string[]
    persistent?: boolean
    ariaLabel?: string
    focusOnTarget?: boolean
    appendTo?: string | HTMLElement
  }

  defineOptions({ name: 'PortalToolTip' })

  const visibleModel = defineModel<boolean>('visible')

  withDefaults(defineProps<Props>(), {
    content: '',
    rawContent: false,
    placement: 'top',
    effect: 'dark',
    trigger: 'hover',
    disabled: false,
    offset: 12,
    arrowOffset: 5,
    showAfter: 0,
    showArrow: true,
    hideAfter: 200,
    autoClose: 0,
    popperStyle: '',
    enterable: true,
    teleported: true,
    virtualTriggering: false,
    triggerKeys: () => ['Enter', 'Space'],
    focusOnTarget: false,
  })

  const emit = defineEmits<{
    beforeShow: []
    show: []
    beforeHide: []
    hide: []
  }>()

  const tooltipRef = ref()

  /**
   * Handle before-show event
   * @author Vicky Zhu
   */
  const beforeShow = () => {
    emit('beforeShow')
  }

  /**
   * Handle show event
   * @author Vicky Zhu
   */
  const show = () => {
    emit('show')
  }

  /**
   * Handle before-hide event
   * @author Vicky Zhu
   */
  const beforeHide = () => {
    emit('beforeHide')
  }

  /**
   * Handle hide event
   * @author Vicky Zhu
   */
  const hide = () => {
    emit('hide')
  }

  defineExpose({
    tooltipRef,
    updatePopper: () => tooltipRef.value?.updatePopper(),
    onOpen: () => tooltipRef.value?.onOpen(),
    onClose: () => tooltipRef.value?.onClose(),
    hide: () => tooltipRef.value?.hide(),
    isFocusInsideContent: () => tooltipRef.value?.isFocusInsideContent(),
  })
</script>

<style lang="scss">
  .portal-tool-tip-container {
    .portal-tool-tip-popper {
      &.is-dark {
        background-color: var(--color-text-default) !important;
        color: var(--color-white) !important;
        border-color: var(--color-text-default) !important;
        max-width: 200px;

        .el-popper__arrow::before {
          background-color: var(--color-text-default) !important;
          border-color: var(--color-text-default) !important;
        }
      }

      &.is-light {
        background-color: var(--color-white) !important;
        border: none !important;
        box-shadow: var(--shadow-light) !important;
        max-width: 200px;

        .el-popper__arrow::before {
          background-color: var(--color-white) !important;
          border-color: transparent !important;
        }
      }
    }
  }
</style>
