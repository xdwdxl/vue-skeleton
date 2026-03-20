<!--
  @file PortalPage.vue - Page layout container component
  @author Vicky Zhu
  @date 2026-03-16
  @description Full-featured page container with header/footer slots, scroll events, loading state and flexible layout
-->
<template>
  <div
    ref="pageRef"
    class="portal-page-container"
    :class="pageClass"
    :style="customStyle"
    @scroll="onScroll"
  >
    <div
      v-if="$slots.header"
      class="portal-page__header"
    >
      <slot name="header" />
    </div>
    <div
      class="portal-page__body"
      :class="{ 'portal-page__body--flex': direction }"
      :style="bodyStyle"
    >
      <slot />
    </div>
    <div
      v-if="$slots.footer"
      class="portal-page__footer"
    >
      <slot name="footer" />
    </div>
    <div
      v-if="loading"
      class="portal-page__loading"
    >
      <slot name="loading">
        <el-icon class="is-loading"><Loading /></el-icon>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
  /**
   * @component PortalPage - Page layout container component
   * @author Vicky Zhu
   * @date 2026-03-16
   * @props {string} [background=''] - Custom background style
   * @props {string} [margin=''] - Custom margin
   * @props {string} [padding=''] - Custom padding
   * @props {string} [borderRadius=''] - Custom border radius
   * @props {number} [headerHeight=70] - App header height for calc page height
   * @props {string} [overflow='auto'] - Overflow behavior
   * @props {boolean} [bordered=false] - Whether to show border
   * @props {boolean} [shadow=false] - Whether to show box shadow
   * @props {boolean} [loading=false] - Whether to show loading overlay
   * @props {boolean} [fullHeight=true] - Whether to fill available viewport height
   * @props {string} [width=''] - Custom width
   * @props {string} [minHeight=''] - Custom min height
   * @props {string} [maxHeight=''] - Custom max height
   * @props {string} [direction=''] - Flex direction for body content
   * @props {string} [align=''] - Flex align-items for body content
   * @props {string} [justify=''] - Flex justify-content for body content
   * @props {string} [gap=''] - Flex gap for body content
   * @props {number} [scrollThreshold=100] - Distance from bottom to trigger scrollToBottom event
   * @emits {Event} scroll - Triggered when page scrolls
   * @emits scrollToBottom - Triggered when scroll reaches threshold from bottom
   * @slot default - Main page body content
   * @slot header - Page header content, rendered above the body
   * @slot footer - Page footer content, rendered below the body
   * @slot loading - Custom loading overlay content
   */

  import { computed, ref } from 'vue'
  import { Loading } from '@element-plus/icons-vue'

  type OverflowType = 'auto' | 'hidden' | 'scroll' | 'visible'
  type FlexDirection = '' | 'row' | 'row-reverse' | 'column' | 'column-reverse'

  interface Props {
    background?: string
    margin?: string
    padding?: string
    borderRadius?: string
    headerHeight?: number
    overflow?: OverflowType
    bordered?: boolean
    shadow?: boolean
    loading?: boolean
    fullHeight?: boolean
    width?: string
    minHeight?: string
    maxHeight?: string
    direction?: FlexDirection
    align?: string
    justify?: string
    gap?: string
    scrollThreshold?: number
  }

  defineOptions({ name: 'PortalPage' })

  const props = withDefaults(defineProps<Props>(), {
    background: '',
    margin: '',
    padding: '',
    borderRadius: '',
    headerHeight: 70,
    overflow: 'auto',
    bordered: false,
    shadow: false,
    loading: false,
    fullHeight: true,
    width: '',
    minHeight: '',
    maxHeight: '',
    direction: '',
    align: '',
    justify: '',
    gap: '',
    scrollThreshold: 100,
  })

  const emit = defineEmits<{
    scroll: [event: Event]
    scrollToBottom: []
  }>()

  const pageRef = ref<HTMLElement>()

  const pageClass = computed(() => ({
    'portal-page--bordered': props.bordered,
    'portal-page--shadow': props.shadow,
    'portal-page--loading': props.loading,
  }))

  const customStyle = computed(() => ({
    ...(props.background && { background: props.background }),
    ...(props.margin && { margin: props.margin }),
    ...(props.padding && { padding: props.padding }),
    ...(props.borderRadius && { borderRadius: props.borderRadius }),
    ...(props.width && { width: props.width }),
    ...(props.minHeight && { minHeight: props.minHeight }),
    ...(props.maxHeight && { maxHeight: props.maxHeight }),
    ...(props.fullHeight && {
      height: `calc(100vh - ${props.headerHeight}px - var(--spacing-lg-minus) * 2)`,
    }),
    overflowY: props.overflow,
  }))

  const bodyStyle = computed(() => {
    if (!props.direction) return {}
    return {
      flexDirection: props.direction,
      ...(props.align && { alignItems: props.align }),
      ...(props.justify && { justifyContent: props.justify }),
      ...(props.gap && { gap: props.gap }),
    }
  })

  /**
   * Handle page scroll event
   * @author Vicky Zhu
   * @param {Event} event - Scroll event object
   */
  const onScroll = (event: Event) => {
    emit('scroll', event)
    const el = event.target as HTMLElement
    if (el.scrollHeight - el.scrollTop - el.clientHeight <= props.scrollThreshold) {
      emit('scrollToBottom')
    }
  }

  /**
   * Scroll to specified position
   * @author Vicky Zhu
   * @param {ScrollToOptions} options - Scroll options
   */
  const scrollTo = (options: ScrollToOptions) => {
    pageRef.value?.scrollTo(options)
  }

  /**
   * Scroll to top of the page
   * @author Vicky Zhu
   */
  const scrollToTop = () => {
    pageRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  defineExpose({
    pageRef,
    scrollTo,
    scrollToTop,
  })
</script>

<style lang="scss" scoped>
  .portal-page-container {
    box-sizing: border-box;
    background: var(--color-background-base);
    margin: var(--spacing-lg-minus);
    padding: var(--spacing-lg-minus);
    border-radius: var(--radius-base);
    position: relative;

    &--bordered {
      border: 1px solid var(--color-border-base);
    }

    &--shadow {
      box-shadow: var(--shadow-light);
    }

    &--loading {
      pointer-events: none;
      opacity: 0.6;
    }

    &__body {
      &--flex {
        display: flex;
      }
    }

    &__loading {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(255, 255, 255, 0.5);
      border-radius: inherit;
      z-index: 1;
      pointer-events: all;

      .el-icon {
        font-size: 24px;
        color: var(--color-primary);
      }
    }
  }
</style>
