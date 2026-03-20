<template>
  <section class="perm-user-admin">
    <div class="toolbar">
      <FormKit v-model="activeAppId" type="select" name="appId" :label="$t('perm.application')" :options="appOptions" />
      <FormKit v-model="searchText" type="text" name="search" :label="$t('perm.user_search')" />
      <el-button class="btn" native-type="button" @click="searchUsers">{{ $t('common.search') }}</el-button>
      <el-button class="btn" native-type="button" @click="refreshGroups">{{ $t('perm.refresh_groups') }}</el-button>
      <el-button class="btn" native-type="button" @click="toggleCreateUser">{{ $t('perm.create_user') }}</el-button>
    </div>

    <div v-if="showCreateUser" class="create-user">
      <FormKit v-model="createForm" type="form" :actions="false" @submit="handleCreateUser">
        <div class="row">
          <FormKit type="text" name="username" :label="$t('perm.username')" />
          <FormKit type="text" name="email" :label="$t('perm.email')" />
        </div>
        <div class="row">
          <FormKit type="text" name="firstName" :label="$t('perm.first_name')" />
          <FormKit type="text" name="lastName" :label="$t('perm.last_name')" />
          <el-button class="btn" type="primary" native-type="submit" :disabled="creatingUser">{{ creatingUser ? $t('common.saving') : $t('perm.create') }}</el-button>
          <el-button class="btn" native-type="button" :disabled="creatingUser" @click="cancelCreateUser">{{ $t('common.cancel') }}</el-button>
        </div>
      </FormKit>
    </div>

    <div class="layout">
      <div class="pane">
        <h3>{{ $t('perm.users') }}</h3>
        <PortalTable :data="users" :columns="userColumns" :height="USER_TABLE_HEIGHT" :row-class-name="rowClassName" @row-click="handleUserClick" />
      </div>
      <div class="pane">
        <h3>{{ $t('perm.groups_roles') }}</h3>
        <div v-if="selectedUserId">
          <div class="row">
            <FormKit v-if="groupOptions.length" v-model="pickedGroup" type="select" :label="$t('perm.add_group_role')" placeholder="Select" :options="groupOptions" />
            <el-button class="btn" native-type="button" :disabled="!pickedGroup" @click="addPickedGroup">{{ $t('perm.add') }}</el-button>
          </div>
          <FormKit :key="formKey" v-model="formValue" type="form" :actions="false" @submit="submit">
            <FormKit type="text" name="userLabel" :label="$t('perm.user')" :disabled="true" />
            <div class="chips" aria-label="Groups/Roles">
              <div v-if="selectedGroups.length" class="chips__wrap">
                <span v-for="g in selectedGroups" :key="g" class="chip">
                  <span class="chip__text">{{ g }}</span>
                  <el-button class="chip__remove" native-type="button" @click="removeGroup(g)">×</el-button>
                </span>
              </div>
              <div v-else class="muted">{{ $t('perm.no_groups_assigned') }}</div>
            </div>
            <div class="row"><el-button class="btn" type="primary" native-type="submit">{{ $t('perm.save') }}</el-button><el-button class="btn" native-type="button" @click="loadSelected">{{ $t('common.reload') }}</el-button></div>
          </FormKit>
        </div>
        <div v-else class="muted">{{ $t('perm.select_user_hint') }}</div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ElNotification } from 'element-plus'
import { API } from '../../api'
import PortalTable from '../../components/PortalTable.vue'
import { useI18n } from '../../i18n'
import { normalizeStringList } from '../../perm/utils'

type KcUserItem = { id: string; username?: string; email?: string; displayName?: string }

const USER_TABLE_HEIGHT = 520, SELECTED_ROW_CLASS = 'perm-user-admin__row--selected', DEFAULT_USER_MAX = 100

const APP_IDS = { keycloak: 'keycloak', erpnext: 'erpnext' } as const

const i18n = useI18n()

const searchText = ref('')
const users = ref<KcUserItem[]>([])
const kcGroups = ref<string[]>([])
const erpRoles = ref<string[]>([])
const activeAppId = ref<'keycloak' | 'erpnext'>(APP_IDS.keycloak)
const selectedUserId = ref('')
const selectedUserLabel = ref('')
const selectedUserErpId = ref('')
const pickedGroup = ref('')
const formKey = ref(0)
const formValue = ref<{ userLabel: string }>({ userLabel: '' })
const lastLoadedGroups = ref<string[]>([])
const selectedGroups = ref<string[]>([])
const showCreateUser = ref(false)
const creatingUser = ref(false)
const createForm = ref<{ username?: string; email?: string; firstName?: string; lastName?: string }>({})

const userColumns = [
  { prop: 'displayName', label: 'Name', minWidth: 180, showOverflowTooltip: true },
  { prop: 'username', label: 'Username', minWidth: 160, showOverflowTooltip: true },
  { prop: 'email', label: 'Email', minWidth: 200, showOverflowTooltip: true },
  { prop: 'id', label: 'Id', minWidth: 200, showOverflowTooltip: true },
] as const

function pickUserLabel(u: KcUserItem): string {
  const name = String(u?.displayName ?? '').trim()
  const email = String(u?.email ?? '').trim()
  const username = String(u?.username ?? '').trim()
  const main = name || email || username || String(u?.id ?? '').trim()
  const tail = email && main !== email ? ` <${email}>` : ''
  return `${main}${tail}`.trim()
}

const isErpnext = computed(() => String(activeAppId.value || '').trim() === APP_IDS.erpnext)

const appOptions = computed(() => [
  { label: APP_IDS.keycloak, value: APP_IDS.keycloak },
  { label: APP_IDS.erpnext, value: APP_IDS.erpnext },
])

const groupOptions = computed(() => {
  const list = isErpnext.value ? erpRoles.value : kcGroups.value
  return normalizeStringList(list).map((v) => ({ label: v, value: v }))
})

function rowClassName(payload: { row: KcUserItem }): string {
  const id = String(payload?.row?.id || '').trim()
  if (!id) return ''
  return id === selectedUserId.value ? SELECTED_ROW_CLASS : ''
}

function handleUserClick(row: KcUserItem): void {
  const id = String(row?.id || '').trim()
  if (!id) return
  selectedUserId.value = id
  selectedUserLabel.value = pickUserLabel(row)
  selectedUserErpId.value = String(row?.email || row?.username || '').trim()
  pickedGroup.value = ''
  formKey.value += 1
  void loadSelected()
}

async function refreshGroups(): Promise<void> {
  try {
    if (isErpnext.value) {
      const res = await API.PermErpnextRoles()
      erpRoles.value = normalizeStringList(res?.data?.items ?? [])
    } else {
      const res = await API.PermProviderGroups()
      kcGroups.value = normalizeStringList(res?.data?.items ?? [])
    }
  } catch {
    erpRoles.value = []
    kcGroups.value = []
  }
}

async function searchUsers(): Promise<void> {
  try {
    const q = String(searchText.value || '').trim()
    const res = await API.PermUsers({ search: q, first: 0, max: DEFAULT_USER_MAX })
    const items = (res?.data?.items ?? []) as KcUserItem[]
    users.value = items
      .filter((x) => x && typeof x.id === 'string' && String(x.id).trim())
      .map((x) => ({
        id: String(x.id).trim(),
        username: String(x.username || '').trim() || undefined,
        email: String(x.email || '').trim() || undefined,
        displayName: String(x.displayName || '').trim() || undefined,
      }))
  } catch {
    users.value = []
  }
}

function toggleCreateUser(): void {
  showCreateUser.value = !showCreateUser.value
}

function cancelCreateUser(): void {
  showCreateUser.value = false
  createForm.value = {}
}

async function handleCreateUser(): Promise<void> {
  const username = String(createForm.value.username || '').trim()
  const email = String(createForm.value.email || '').trim()
  const firstName = String(createForm.value.firstName || '').trim()
  const lastName = String(createForm.value.lastName || '').trim()
  if (!username && !email) {
    ElNotification({ title: i18n.t('common.save_failed'), message: i18n.t('perm.invalid_user') as string, type: 'error' })
    return
  }
  creatingUser.value = true
  try {
    await API.PermCreateUser({ username: username || email, email, firstName, lastName } as any)
    ElNotification({ title: i18n.t('common.saved'), message: i18n.t('perm.user_created') as string, type: 'success' })
    createForm.value = {}
    showCreateUser.value = false
    await searchUsers()
  } catch (e) {
    ElNotification({ title: i18n.t('common.save_failed'), message: String((e as any)?.message || 'error'), type: 'error' })
  } finally {
    creatingUser.value = false
  }
}

async function loadSelected(): Promise<void> {
  const uid = isErpnext.value ? String(selectedUserErpId.value || '').trim() : String(selectedUserId.value || '').trim()
  if (!uid) return
  try {
    const groups = isErpnext.value
      ? normalizeStringList((await API.PermErpnextGetUserRoles({ userId: uid }))?.data?.roles ?? [])
      : normalizeStringList((await API.PermGetUserGroups({ userId: uid }))?.data?.groups ?? [])
    formValue.value = { userLabel: selectedUserLabel.value }
    lastLoadedGroups.value = groups
    selectedGroups.value = groups
  } catch {}
}

function addPickedGroup(): void {
  const g = String(pickedGroup.value || '').trim()
  if (!g) return
  pickedGroup.value = ''
  const next = normalizeStringList([...selectedGroups.value, g])
  selectedGroups.value = next
}

function removeGroup(group: string): void {
  const g = String(group || '').trim()
  if (!g) return
  selectedGroups.value = selectedGroups.value.filter((x) => x !== g)
}

async function submit(): Promise<void> {
  const uid = isErpnext.value ? String(selectedUserErpId.value || '').trim() : String(selectedUserId.value || '').trim()
  if (!uid) return
  const groups = normalizeStringList(selectedGroups.value)
  try {
    const prevSet = new Set(lastLoadedGroups.value)
    const nextSet = new Set(groups)
    let added = 0
    let removed = 0
    for (const g of nextSet) if (!prevSet.has(g)) added += 1
    for (const g of prevSet) if (!nextSet.has(g)) removed += 1
    if (isErpnext.value) {
      await API.PermErpnextSetUserRoles({ userId: uid, roles: groups })
    } else {
      await API.PermSetUserGroups({ userId: uid, groups })
    }
    ElNotification({ title: i18n.t('common.saved'), message: `${selectedUserLabel.value} (+${added} -${removed})`, type: 'success' })
    await loadSelected()
  } catch (e) {
    ElNotification({ title: i18n.t('common.save_failed'), message: String((e as any)?.message || 'error'), type: 'error' })
  }
}

onMounted(() => {
  refreshGroups()
  searchUsers()
})

watch(activeAppId, () => {
  pickedGroup.value = ''
  selectedGroups.value = []
  lastLoadedGroups.value = []
  void refreshGroups()
  void loadSelected()
})
</script>

<style scoped>
.perm-user-admin{padding:0}.toolbar{margin:var(--spacing-md-minus) 0;display:flex;gap:var(--spacing-md-minus);align-items:flex-end}.layout{display:flex;gap:var(--spacing-md)}.pane{flex:1;min-width:0}.row{display:flex;gap:var(--spacing-sm-plus);margin-top:var(--spacing-md-minus);align-items:flex-end}.muted{opacity:.7}.chips{margin-top:var(--spacing-sm)}.chips__wrap{display:flex;flex-wrap:wrap;gap:var(--spacing-sm)}.chip{display:inline-flex;align-items:center;gap:var(--spacing-xs-plus);padding:var(--spacing-xs) var(--spacing-sm);border-radius:var(--fk-border-radius-full);background:var(--el-fill-color-light)}.chip__text{max-width:var(--max-width-perm-chip-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.chip__remove{border:0;background:transparent;cursor:pointer;line-height:1}.perm-user-admin :deep(.el-table__body tr){cursor:pointer}.perm-user-admin :deep(.el-table__body tr.perm-user-admin__row--selected td.el-table__cell){background-color:var(--btn-selected-bg-color)}
</style>
