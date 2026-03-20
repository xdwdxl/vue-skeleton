<!--
  @file OptionDialog.vue - Multi-button option dialog
  @author Cooper Wang
  @date 2026-03-13
  @description Extends BaseDialog with configurable action buttons for presenting choices to the user
-->
<template>
  <BaseDialog
    v-model="visible"
    v-bind="$attrs"
    :show-footer="false"
    body-padding="0"
    dialog-class="option-dialog"
  >
    <div class="option-dialog__body">
      <p v-if="message" class="option-dialog__message">{{ message }}</p>
      <slot />
    </div>

    <template #footer>
      <div class="option-dialog__footer">
        <ElButton
          v-for="(btn, index) in buttons"
          :key="index"
          class="option-dialog__btn"
          @click="handleButtonClick(btn)"
        >
          {{ btn.label }}
        </ElButton>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElButton } from 'element-plus'
import BaseDialog from './BaseDialog.vue'

defineOptions({ inheritAttrs: false })

interface OptionButton {
  label: string
  action: string
}

const props = withDefaults(defineProps<{
  modelValue: boolean
  message?: string
  buttons?: OptionButton[]
  closeOnAction?: boolean
}>(), {
  message: '',
  buttons: () => [],
  closeOnAction: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  action: [action: string]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

/**
 * Handle option button click and emit action
 * @author Cooper Wang
 * @param {OptionButton} btn - Clicked button definition
 */
function handleButtonClick(btn: OptionButton) {
  emit('action', btn.action)
  if (props.closeOnAction) {
    visible.value = false
  }
}
</script>

<style scoped>
/* Body: 10px padding, centered text */
.option-dialog__body {
  text-align: center;
  padding: var(--spacing-sm-plus);
}

.option-dialog__message {
  font-size: var(--font-size-mini);
  font-family: var(--font-family-regular);
  color: var(--color-white);
  line-height: var(--line-height-base);
  margin: 0;
}

/* Footer: centered buttons, 10px padding */
.option-dialog__footer {
  display: flex;
  justify-content: center;
  gap: var(--spacing-sm-plus);
  padding: 0 var(--spacing-sm-plus) var(--spacing-sm-plus);
}
</style>

<style>
/* Unscoped: targets teleported (appendToBody) dialog */
/* Compound selector: .option-dialog is on the same element as .el-dialog */
.el-dialog.option-dialog {
  width: fit-content !important;
  min-width: 250px;
}

.option-dialog .el-dialog__body,
.option-dialog .el-dialog__footer {
  background-color: var(--default-default);
}

/* Buttons: PortalButton Form Button default style (blue #428bca) */
.option-dialog .option-dialog__btn {
  min-width: 90px;
  height: 28px;
  padding: 0 var(--spacing-sm-plus);
  border-radius: var(--radius-sm) !important;
  font-size: var(--font-size-tiny);
  font-family: var(--font-family-regular);
  font-weight: 400;
  background-color: var(--default-primary);
  border-color: var(--default-primary);
  color: var(--color-white);
  box-shadow: none !important;
}

.option-dialog .option-dialog__btn:hover,
.option-dialog .option-dialog__btn:focus {
  background-color: var(--hover-primary);
  border-color: var(--hover-primary);
  color: var(--color-white);
}

.option-dialog .option-dialog__btn:active {
  background-color: var(--pressed-primary);
  border-color: var(--pressed-primary);
}
</style>
