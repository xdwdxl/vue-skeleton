<!--
  @file PortalIconSvg.vue - SVG icon component
  @author Vicky Zhu
  @date 2026-03-16
  @description Renders an SVG sprite icon by symbol id with size, color, rotation and interactive support
-->
<template>
  <div class="portal-svg-icon-container"></div>
  <svg
    v-once
    :class="svgClass"
    :style="svgStyle"
    aria-hidden="true"
    @click="onClick"
    @mouseenter="onMouseenter"
    @mouseleave="onMouseleave"
  >
    <use :xlink:href="iconName" />
  </svg>
</template>

<script setup lang="ts">
  /**
   * @component PortalIconSvg - SVG sprite icon component
   * @author Vicky Zhu
   * @date 2026-03-16
   * @props {string} iconClass - SVG symbol id without #icon- prefix
   * @props {string} [className=''] - Additional CSS class name
   * @props {string} [size=''] - Icon size (e.g. '16px', '1.5em')
   * @props {string} [color=''] - Icon fill color, overrides currentColor
   * @props {number} [rotate=0] - Rotation angle in degrees
   * @props {boolean} [spin=false] - Whether to apply spin animation
   * @emits {MouseEvent} click - Triggered when icon is clicked
   * @emits {MouseEvent} mouseenter - Triggered when mouse enters icon
   * @emits {MouseEvent} mouseleave - Triggered when mouse leaves icon
   */

  import { computed } from 'vue'

  interface Props {
    iconClass: string
    className?: string
    size?: string
    color?: string
    rotate?: number
    spin?: boolean
  }

  defineOptions({ name: 'PortalIconSvg' })

  const props = withDefaults(defineProps<Props>(), {
    className: '',
    size: '',
    color: '',
    rotate: 0,
    spin: false,
  })

  const emit = defineEmits<{
    click: [event: MouseEvent]
    mouseenter: [event: MouseEvent]
    mouseleave: [event: MouseEvent]
  }>()

  const iconName = computed(() => `#icon-${props.iconClass}`)

  const svgClass = computed(() => {
    const classes = ['svg-icon']
    if (props.className) classes.push(props.className)
    if (props.spin) classes.push('svg-icon--spin')
    return classes.join(' ')
  })

  const svgStyle = computed(() => ({
    ...(props.size && { width: props.size, height: props.size }),
    ...(props.color && { color: props.color }),
    ...(props.rotate && { transform: `rotate(${props.rotate}deg)` }),
  }))

  /**
   * Handle click event
   * @author Vicky Zhu
   * @param {MouseEvent} event - Mouse event object
   */
  const onClick = (event: MouseEvent) => {
    emit('click', event)
  }

  /**
   * Handle mouseenter event
   * @author Vicky Zhu
   * @param {MouseEvent} event - Mouse event object
   */
  const onMouseenter = (event: MouseEvent) => {
    emit('mouseenter', event)
  }

  /**
   * Handle mouseleave event
   * @author Vicky Zhu
   * @param {MouseEvent} event - Mouse event object
   */
  const onMouseleave = (event: MouseEvent) => {
    emit('mouseleave', event)
  }
</script>

<style scoped>
  .svg-icon {
    width: 1em;
    height: 1em;
    vertical-align: -0.15em;
    fill: currentColor;
    overflow: hidden;
    transition:
      color 0.2s,
      transform 0.2s;
  }

  .svg-icon--spin {
    animation: svg-icon-spin 1s linear infinite;
  }

  @keyframes svg-icon-spin {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }
</style>
