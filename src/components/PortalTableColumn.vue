<template>
  <ElTableColumn v-bind="attrs" v-slots="slots" />
</template>

<script setup lang="ts">
import { useAttrs, useSlots } from 'vue'
import { ElTableColumn } from 'element-plus'
import 'element-plus/es/components/table/style/css'

defineOptions({ name: 'ElTableColumn' })

const attrs = useAttrs()
const slots = useSlots()
</script>
