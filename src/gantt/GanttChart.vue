<!--
  @file GanttChart.vue - Gantt chart component for timeline tasks
  @author Lorin Luo
  @date 2026-01-07
  @description Displays tasks as horizontal range bars on a time axis
-->
<template>
  <Apexchart
    :options="chartOptions"
    :series="series"
    :height="height"
  />
</template>
<script setup lang="ts">
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import type { GanttTask, GanttOptions } from './index'

const Apexchart = VueApexCharts

const DEFAULTS = {
  barHeight: '60%',
  dateFormat: 'yyyy-MM-dd HH:mm',
  animations: false,
  dataLabels: true,
} as const

const props = defineProps<{
  tasks: GanttTask[]
  options?: Partial<GanttOptions>
  height?: number | string
}>()

const height = computed(() => props.height ?? 360)

const mergedOptions = computed<GanttOptions>(() => ({
  barHeight: props.options?.barHeight ?? DEFAULTS.barHeight,
  dateFormat: props.options?.dateFormat ?? DEFAULTS.dateFormat,
  animations: props.options?.animations ?? DEFAULTS.animations,
  dataLabels: props.options?.dataLabels ?? DEFAULTS.dataLabels,
  colors: props.options?.colors ?? undefined,
}))

const series = computed(() => {
  const data = (props.tasks ?? []).map((t) => {
    const start = new Date(t.start).getTime()
    const end = new Date(t.end).getTime()
    return {
      x: t.name || t.id,
      y: [start, end],
      fillColor: t.color,
    }
  })
  return [{ data }]
})

const chartOptions = computed<ApexOptions>(() => {
  return {
    chart: {
      type: 'rangeBar' as const,
      animations: { enabled: mergedOptions.value.animations },
      toolbar: { show: false },
    },
    colors: mergedOptions.value.colors,
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: mergedOptions.value.barHeight,
        rangeBarGroupRows: true,
      },
    },
    xaxis: {
      type: 'datetime',
    },
    dataLabels: {
      enabled: mergedOptions.value.dataLabels,
      formatter: (_: unknown, opts: any) => {
        try {
          const d = opts?.w?.config?.series?.[opts.seriesIndex]?.data?.[opts.dataPointIndex]
          return d?.x ?? ''
        } catch {
          return ''
        }
      },
    },
    tooltip: {
      x: { format: mergedOptions.value.dateFormat },
    },
  }
})
</script>
