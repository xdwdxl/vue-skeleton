<template>
  <component
    :is="type"
    v-bind="linkProps()"
  >
    <slot />
  </component>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'
  import type { RouteLocationRaw } from 'vue-router'

  const EXTERNAL_LINK_PATTERN = /^(https?:|mailto:|tel:)/

  const props = defineProps<{
    to: string | RouteLocationRaw
  }>()

  const isExt = computed(() => {
    return isExternal(props.to as string)
  })

  const type = computed(() => {
    if (isExt.value) {
      return 'a'
    }
    return 'router-link'
  })

  function linkProps(): Record<string, unknown> {
    if (isExt.value) {
      return {
        href: props.to,
        target: '_blank',
        rel: 'noopener',
      }
    }
    return {
      to: props.to,
    }
  }

  function isExternal(path: string): boolean {
    return EXTERNAL_LINK_PATTERN.test(path)
  }
</script>
