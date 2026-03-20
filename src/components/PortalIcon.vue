<template>
  <i v-bind="attrs" :class="iconClass" :aria-hidden="ariaHidden" />
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'

const props = withDefaults(defineProps<{
  name: string
  prefix?: string
  size?: string
  fixedWidth?: boolean
  spin?: boolean
  pulse?: boolean
}>(), {
  prefix: 'fas',
  fixedWidth: false,
  spin: false,
  pulse: false,
})

const attrs = useAttrs()

const sizeClass = computed(() => {
  const raw = String(props.size || '').trim()
  if (!raw) return ''
  if (raw === 'xs' || raw === 'sm' || raw === 'lg') return `fa-${raw}`
  if (/^\d+x$/.test(raw)) return `fa-${raw}`
  if (raw === '1x') return `fa-${raw}`
  return ''
})

const iconClass = computed(() => {
  const a = attrs as Record<string, unknown>
  const prefix = String(props.prefix ?? a.prefix ?? 'fas').trim() || 'fas'
  const name = String(props.name ?? a.name ?? '').trim()
  const out: Array<string> = []
  if (prefix) out.push(prefix)
  if (name) out.push(`fa-${name}`)
  if (props.fixedWidth) out.push('fa-fw')
  if (props.spin) out.push('fa-spin')
  if (props.pulse) out.push('fa-pulse')
  const sc = sizeClass.value
  if (sc) out.push(sc)
  return out
})

const ariaHidden = computed(() => {
  const a = attrs as Record<string, unknown>
  if ('aria-label' in a) return undefined
  if ('ariaLabel' in a) return undefined
  if ('title' in a) return undefined
  return 'true'
})
</script>
