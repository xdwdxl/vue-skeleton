<!--
  @file FormDialog.vue - Dialog wrapper with native form submission
  @author Cooper Wang
  @date 2026-03-13
  @description Combines BaseDialog with native form, providing submit handling, scroll-to-error, and form reset on open
-->
<template>
  <BaseDialog
    v-model="visible"
    v-bind="{ ...mergedDialogProps, ...$attrs }"
    :disabled="disabled"
    :confirm-loading="isSubmitting"
    :close-after-confirm="false"
    :on-confirm="handleConfirm"
    @opened="emit('opened')"
    @closed="emit('closed')"
  >
    <template v-if="$slots.header" #header><slot name="header" /></template>
    <div ref="bodyRef" class="form-dialog__body">
      <form :id="effectiveFormId" @submit.prevent="handleSubmit(valueProxy)">
        <slot :value="valueProxy" />
      </form>
    </div>
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import BaseDialog from './BaseDialog.vue'

defineOptions({ inheritAttrs: false })

type AnyRecord = Record<string, unknown>
type SubmitHandler = (values: AnyRecord) => void | boolean | Promise<void | boolean>

const FORM_ID_PREFIX = 'portal_form_dialog_'
const DEFAULT_DIALOG_PROPS = {
  title: '',
  width: '640px',
  top: '8vh',
  appendToBody: true,
  destroyOnClose: true,
  closeOnClickModal: false,
  closeOnPressEscape: true,
  showClose: true,
  lockScroll: true,
  showFooter: true,
  showCancel: true,
  showConfirm: true,
  confirmText: undefined,
  cancelText: undefined,
} as const

const props = withDefaults(defineProps<{
  modelValue: boolean
  formValue?: AnyRecord
  formId?: string
  dialogProps?: Record<string, unknown>
  disabled?: boolean
  loading?: boolean
  closeAfterSubmit?: boolean
  resetOnOpen?: boolean
  scrollToError?: boolean
  onSubmit?: SubmitHandler
}>(), {
  disabled: false,
  closeAfterSubmit: true,
  resetOnOpen: false,
  scrollToError: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:formValue': [value: AnyRecord]
  submit: [value: AnyRecord]
  opened: []
  closed: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const valueProxy = computed<AnyRecord>({
  get: () => props.formValue ?? {},
  set: (v) => emit('update:formValue', v),
})

const mergedDialogProps = computed(() => ({ ...DEFAULT_DIALOG_PROPS, ...(props.dialogProps || {}) }))
const internalFormId = ref(`${FORM_ID_PREFIX}${Math.random().toString(36).slice(2)}`)
const effectiveFormId = computed(() => props.formId || internalFormId.value)
const bodyRef = ref<HTMLDivElement | null>(null)
const submitting = ref(false)
const isSubmitting = computed(() => props.loading ?? submitting.value)

/**
 * Scroll to the first validation error and focus its field
 * @author Cooper Wang
 */
function scrollToFirstError() {
  if (!props.scrollToError) return
  const el = bodyRef.value?.querySelector<HTMLElement>('[data-error], .is-error, .el-form-item.is-error')
  if (!el) return
  try { el.scrollIntoView({ block: 'center', inline: 'nearest' }) } catch {}
  try {
    el.querySelector<HTMLElement>('input, textarea, select, [tabindex]')?.focus?.()
  } catch {}
}

/**
 * Trigger native form submission via dialog confirm button
 * @author Cooper Wang
 */
async function handleConfirm() {
  const form = bodyRef.value?.querySelector<HTMLFormElement>('form')
  if (form) form.requestSubmit()
}

/**
 * Handle form submission with loading state management
 * @author Cooper Wang
 * @param {AnyRecord} values - Form field values
 */
async function handleSubmit(values: AnyRecord) {
  if (submitting.value) return
  emit('submit', values)
  if (!props.onSubmit) {
    if (props.closeAfterSubmit) visible.value = false
    return
  }
  submitting.value = true
  try {
    const res = await props.onSubmit(values)
    if (res === false) {
      await nextTick()
      scrollToFirstError()
      return
    }
    if (props.closeAfterSubmit) visible.value = false
  } finally {
    submitting.value = false
  }
}

watch(() => props.modelValue, async (open) => {
  if (!open || !props.resetOnOpen) return
  await nextTick()
  const form = bodyRef.value?.querySelector<HTMLFormElement>('form')
  form?.reset()
})
</script>

<style scoped>
.form-dialog__body { width: 100%; }
</style>
