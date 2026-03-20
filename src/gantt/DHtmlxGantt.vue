<!--
  @file DHtmlxGantt.vue - Advanced Gantt chart wrapper (dhtmlx-gantt)
  @author Lorin Luo
  @date 2026-01-07
  @description Provides feature-rich gantt with grid, scales and interactions
-->
<template>
  <div class="gantt-wrap" :style="{ height: String(height) + 'px' }">
    <div ref="el" class="gantt-container"></div>
    <div v-if="failed" class="gantt-failed">
      <div class="gantt-failed__inner">
        <div>gantt init failed</div>
        <div v-if="initError" class="gantt-failed__detail">{{ initError }}</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue";
import type { GanttTask } from "./index";
import "dhtmlx-gantt/codebase/dhtmlxgantt.css";
import { gantt } from "dhtmlx-gantt";

const props = defineProps<{
  tasks: GanttTask[];
  height?: number;
  columns?: any[];
}>();

const el = ref<HTMLDivElement | null>(null);
const failed = ref(false);
const initError = ref<string>("");
const height = props.height ?? 360;
let initialized = false;
let ownsInstance = false;
let ganttApi: any = gantt;
const DEFAULT_COLUMNS = [
  { name: "text", label: "Task name", tree: true, width: "*" },
  { name: "start_date", label: "Start time", align: "center", width: 150 },
  { name: "duration", label: "Duration", align: "center", width: 100 },
] as const;

function resolveGanttApi() {
  if (typeof window === "undefined") return;
  const factory = (window as any).Gantt;
  if (factory && typeof factory.getGanttInstance === "function") {
    ganttApi = factory.getGanttInstance();
    ownsInstance = true;
    return;
  }
  ganttApi = gantt;
  ownsInstance = false;
}

function formatDate(input: string | number | Date) {
  const d = input instanceof Date ? input : new Date(input);
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, "0");
  const D = String(d.getDate()).padStart(2, "0");
  const H = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${Y}-${M}-${D} ${H}:${m}`;
}

function toDataset(tasks: GanttTask[]) {
  const data = (tasks || []).map((t) => ({
    id: t.id,
    text: t.name || t.id,
    start_date: formatDate(t.start),
    end_date: formatDate(t.end),
    color: t.color,
  }));
  return { data, links: [] };
}

function initGantt() {
  if (!el.value) return;
  if (initialized) return;
  try {
    failed.value = false;
    initError.value = "";
    ganttApi.config.readonly = true;
    ganttApi.config.columns = props.columns || [...DEFAULT_COLUMNS];
    ganttApi.config.autosize = "y";
    ganttApi.config.scale_unit = "day";
    ganttApi.config.step = 1;
    ganttApi.config.date_scale = "%d %M";
    ganttApi.config.subscales = [{ unit: "hour", step: 6, date: "%H:%i" }];
    ganttApi.config.date_format = "%Y-%m-%d %H:%i";
    ganttApi.init(el.value);
    initialized = true;
  } catch (e: any) {
    failed.value = true;
    initError.value =
      e && (e?.message || e?.stack) ? String(e.message || e.stack) : String(e);
  }
}

function updateData() {
  if (!initialized) return;
  try {
    const ds = toDataset(props.tasks);
    ganttApi.clearAll();
    ganttApi.parse(ds);
  } catch {}
}

onMounted(async () => {
  await nextTick();
  requestAnimationFrame(() => {
    resolveGanttApi();
    initGantt();
    updateData();
  });
});
onUnmounted(() => {
  try {
    if (ownsInstance && ganttApi) ganttApi.destructor();
  } catch {}
});
watch(
  () => props.tasks,
  () => updateData(),
  { deep: true },
);
</script>

<style scoped>
.gantt-wrap {
  border-top: 1px solid #dfe0e1;
  width: 100%;
  position: relative;
  --gantt-font-size: var(--font-size-base);
}
.gantt-container {
  width: 100%;
  height: 100%;
}
.gantt-wrap :deep(.gantt_grid_head_cell),
.gantt-wrap :deep(.gantt_scale_cell),
.gantt-wrap :deep(.gantt_cell),
.gantt-wrap :deep(.gantt_task_content),
.gantt-wrap :deep(.gantt_task_text),
.gantt-wrap :deep(.gantt_task_line),
.gantt-wrap :deep(.gantt_row),
.gantt-wrap :deep(.gantt_row_task),
.gantt-wrap :deep(.gantt_tree_content) {
  font-size: var(--gantt-font-size);
}

.gantt-wrap :deep(.gantt_task_content) {
  line-height: 1.2;
}

.gantt-failed {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-danger-strong);
  font-size: var(--font-size-micro);
  background: var(--color-overlay-light);
}
.gantt-failed__inner {
  max-width: 90%;
}
.gantt-failed__detail {
  margin-top: var(--spacing-xs-plus);
  color: var(--color-text-muted);
  white-space: pre-wrap;
}
</style>
