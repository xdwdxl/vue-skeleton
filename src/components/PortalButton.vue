<!--
  @file PortalButton.vue - Themed button component
  @author Cooper Wang
  @date 2026-03-13
  @description Wraps ElButton with portal design tokens, supporting form and square types with 8 color variants
-->
<template>
  <div class="portal-button-container">
    <ElButton
      ref="elRef"
      :class="buttonClasses"
      :disabled="disabled"
      :loading="loading"
      v-bind="$attrs"
    >
      <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
        <slot :name="name" v-bind="slotData ?? {}" />
      </template>
    </ElButton>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElButton } from "element-plus";
import "element-plus/es/components/button/style/css";

defineOptions({ inheritAttrs: false })

type ButtonType = "square" | "form";
type ButtonSize = "sm" | "md" | "lg";
type ButtonColor =
  | "primary"
  | "default"
  | "dark"
  | "white"
  | "success"
  | "info"
  | "danger"
  | "warning";

const props = withDefaults(
  defineProps<{
    type: ButtonType;
    disabled?: boolean;
    loading?: boolean;
    size?: ButtonSize;
    color?: ButtonColor;
  }>(),
  {
    disabled: false,
    loading: false,
    size: "md",
    color: "primary",
  },
);

const elRef = ref<InstanceType<typeof ElButton> | null>(null);

/* Single unified class list — replaces two separate ElButton blocks */
const buttonClasses = computed(() => [
  "portal-button",
  `portal-button--${props.type}`,
  `color-${props.color}`,
  props.type === "square" ? `size-${props.size}` : undefined,
]);

defineExpose({ elRef });
</script>

<style scoped>
.portal-button-container {
  display: flex;
  align-items: center;
}

/* ── Base (shared by both types) ── */
.portal-button {
  border-radius: var(--radius-base) !important;
  font-family: var(--font-family-regular);
  font-weight: 400;
  box-shadow: none !important;
  color: var(--color-white);
  background: var(--_bg);
  border-color: var(--_bg);
  border-bottom: 2px solid var(--_bg-active);
}

.portal-button:hover,
.portal-button:focus {
  background: var(--_bg-hover);
  border-color: var(--_bg-hover);
  border-bottom: 2px solid var(--_bg-active);
  color: var(--color-white);
}

.portal-button:active {
  background: var(--_bg-active);
  border-color: var(--_bg-active);
  border-bottom-color: var(--_bg-active);
  border-bottom-width: 1px;
  transform: translateY(1px);
}

/* ── Form type ── */
.portal-button--form {
  font-size: var(--font-size-tiny);
  padding: var(--spacing-xs) var(--spacing-sm-large);
  min-width: 90px;
  height: var(--size-3xl);
}

/* ── Square type ── */
.portal-button--square {
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.portal-button--square.size-sm {
  width: var(--size-xl);
  height: var(--size-xl);
  font-size: var(--font-size-micro);
}

.portal-button--square.size-md {
  width: 25px;
  height: 25px;
  font-size: var(--font-size-mini);
}

.portal-button--square.size-lg {
  width: 30px;
  height: 30px;
  font-size: var(--font-size-extra-small);
}

.portal-button--square:disabled {
  background-color: var(--color-text-disabled) !important;
  border-color: var(--color-text-disabled) !important;
  color: var(--color-white) !important;
}

/* ── Color variants (unified for both button types) ── */
.color-primary { --_bg: var(--btn-ok-bg);      --_bg-hover: var(--btn-ok-hover);     --_bg-active: var(--btn-ok-pressed); }
.color-default { --_bg: var(--default-primary); --_bg-hover: var(--hover-primary);    --_bg-active: var(--pressed-primary); }
.color-dark    { --_bg: var(--default-default); --_bg-hover: var(--hover-default);    --_bg-active: var(--pressed-default); }
.color-success { --_bg: var(--btn-add-bg);      --_bg-hover: var(--btn-add-hover);    --_bg-active: var(--btn-add-pressed); }
.color-info    { --_bg: var(--btn-edit-bg);     --_bg-hover: var(--btn-edit-hover);   --_bg-active: var(--btn-edit-pressed); }
.color-danger  { --_bg: var(--btn-delete-bg);   --_bg-hover: var(--btn-delete-hover); --_bg-active: var(--btn-delete-pressed); }
.color-warning { --_bg: var(--default-warning); --_bg-hover: var(--hover-warning);    --_bg-active: var(--pressed-warning); }

.color-white {
  --_bg: var(--select-color-base);
  --_bg-hover: var(--select-color-hover);
  --_bg-active: var(--select-color-pressed);
  color: var(--color-text-title) !important;
}
</style>
