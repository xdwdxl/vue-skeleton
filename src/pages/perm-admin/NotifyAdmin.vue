<template>
  <section class="notify-admin">
    <div class="toolbar">
      <el-button class="btn" native-type="button" :loading="loadingGroups" @click="refreshGroups">Reload groups</el-button>
    </div>

    <FormKit v-model="formValue" type="form" :actions="false" @submit="submit">
      <div class="row">
        <FormKit type="text" name="title" label="Title" />
      </div>
      <div class="row">
        <FormKit type="textarea" name="message" label="Message" />
      </div>
      <div class="row">
        <FormKit type="select" name="level" label="Level" :options="levelOptions" />
      </div>
      <div class="row">
        <FormKit
          type="checkbox"
          name="groups"
          label="Groups"
          :options="groupOptions"
          :disabled="loadingGroups || groupOptions.length === 0"
          validation="required"
        />
      </div>

      <div class="actions">
        <el-button class="btn" type="primary" native-type="submit" :loading="sending" :disabled="!canSubmit">
          {{ sending ? 'Sending...' : 'Send' }}
        </el-button>
        <span v-if="errorText" class="error">{{ errorText }}</span>
      </div>
    </FormKit>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElNotification } from 'element-plus'
import { API } from '../../api'

const loadingGroups = ref(false)
const sending = ref(false)
const errorText = ref('')
const groups = ref<string[]>([])

const levelOptions: Array<{ label: string; value: string }> = [
  { label: 'Info', value: 'info' },
  { label: 'Warn', value: 'warn' },
  { label: 'Error', value: 'error' },
  { label: 'Success', value: 'success' },
]

const formValue = ref<{ title: string; message: string; level: string; groups: string[] }>({
  title: '',
  message: '',
  level: 'info',
  groups: [],
})

const groupOptions = computed(() => groups.value.map((g) => ({ label: g, value: g })))

const canSubmit = computed(() => {
  const title = String(formValue.value.title || '').trim()
  const message = String(formValue.value.message || '').trim()
  const selected = Array.isArray(formValue.value.groups) ? formValue.value.groups : []
  return Boolean(title) && Boolean(message) && selected.length > 0 && !sending.value
})

async function refreshGroups(): Promise<void> {
  loadingGroups.value = true
  errorText.value = ''
  try {
    const res = await API.PermProviderGroups()
    const items = (res?.data?.items ?? []) as unknown[]
    groups.value = items.map((x) => String(x ?? '').trim()).filter((x) => x)
  } catch (e) {
    groups.value = []
    errorText.value = String((e as any)?.message || 'load_failed')
  } finally {
    loadingGroups.value = false
  }
}

async function submit(): Promise<void> {
  const title = String(formValue.value.title || '').trim()
  const message = String(formValue.value.message || '').trim()
  const selectedGroups = (Array.isArray(formValue.value.groups) ? formValue.value.groups : []).map((x) => String(x || '').trim()).filter((x) => x)
  const level = String(formValue.value.level || 'info').trim() || 'info'
  if (!title || !message || selectedGroups.length === 0) return

  sending.value = true
  errorText.value = ''
  try {
    await API.NotifyAdminSend({ title, message, groups: selectedGroups, level })
    ElNotification({ title: 'Sent', message: `Sent to ${selectedGroups.length} group(s).`, type: 'success' })
    formValue.value = { ...formValue.value, title: '', message: '' }
  } catch (e) {
    const msg = String((e as any)?.message || 'send_failed')
    errorText.value = msg
    ElNotification({ title: 'Send failed', message: msg, type: 'error' })
  } finally {
    sending.value = false
  }
}

onMounted(() => {
  void refreshGroups()
})
</script>

<style scoped>
.notify-admin{padding:0}.toolbar{margin:var(--spacing-md-minus) 0;display:flex;gap:var(--spacing-sm-plus);align-items:center}.row{margin-top:var(--spacing-md-minus)}.actions{margin-top:var(--spacing-md);display:flex;align-items:center;gap:var(--spacing-md-minus)}.btn{padding:var(--btn-padding-y) var(--btn-padding-x-md);border-radius:var(--radius-base)}.error{font-size:var(--font-size-tiny);color:var(--el-color-danger)}.notify-admin :deep(.formkit-options){max-height:var(--max-height-formkit-options);overflow-y:auto;border:1px solid var(--el-border-color);padding:var(--spacing-sm);border-radius:var(--radius-base)}
</style>
