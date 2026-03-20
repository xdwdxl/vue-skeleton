<template>
  <section class="perm-group-admin">
    <div class="toolbar">
      <FormKit
        v-if="appOptions.length > 1"
        v-model="activeAppId"
        type="select"
        name="appId"
        :label="$t('perm.application')"
        :options="appOptions"
      />
      <el-button class="btn" native-type="button" @click="refreshAll">{{
        $t("perm.refresh")
      }}</el-button>
    </div>
    <div class="layout">
      <div class="pane">
        <h3>{{ $t("perm.groups_roles") }}</h3>
        <PortalTable
          :data="groups"
          :columns="groupColumns"
          :height="GROUP_TABLE_HEIGHT"
          :row-class-name="rowClassName"
          @row-click="handleRowClick"
        >
          <template #actions="{ row }">
            <el-button
              v-if="!isErpnext"
              native-type="button"
              @click.stop="removeGroup(String(row.group_path || ''))"
              >{{ $t("perm.delete") }}</el-button
            >
          </template>
        </PortalTable>
      </div>
      <div class="pane">
        <h3>{{ $t("perm.edit") }}</h3>
        <FormKit
          :key="formKey"
          v-model="formValue"
          type="form"
          :actions="false"
          @submit="submit"
        >
          <FormKit
            v-if="groupOptions.length"
            type="select"
            name="group"
            :label="$t('perm.role_group_name')"
            :options="groupOptions"
            validation="required|safeString"
          />
          <FormKit
            v-else
            type="text"
            name="group"
            :label="$t('perm.role_group_name')"
            validation="required|safeString"
          />
          <PermTreeSelector
            v-model="formValue.permissions"
            :items="filteredCatalog"
            :height="PERM_TREE_HEIGHT"
            :lazy="isErpnext"
            :load="isErpnext ? loadErpNext : undefined"
            :is-known="isErpnext ? checkErpNextKnown : undefined"
          />
          <div class="row">
            <el-button type="primary" native-type="submit">{{
              $t("perm.save")
            }}</el-button
            ><el-button
              class="btn"
              native-type="button"
              @click="loadSelected"
              >{{ $t("common.reload") }}</el-button
            >
          </div>
        </FormKit>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { ElNotification } from "element-plus";
import { API } from "../../api";
import PortalTable from "../../components/PortalTable.vue";
import PermTreeSelector from "../../components/PermTreeSelector.vue";
import { useI18n } from "../../i18n";
import { normalizeStringList } from "../../perm/utils";

type GroupRow = { group_path: string; perm_count: number };
type CatalogItem = {
  key: string;
  name: string;
  appId: string;
  path?: string[];
  action?: string;
  moduleLabel?: string;
  domainLabel?: string;
  actionLabel?: string;
};

const i18n = useI18n();

const GROUP_TABLE_HEIGHT = 520,
  PERM_TREE_HEIGHT = 420,
  SELECTED_ROW_CLASS = "perm-group-admin__row--selected";
const APP_IDS = { erpnext: "erpnext" } as const;
const groups = ref<GroupRow[]>([]),
  catalog = ref<CatalogItem[]>([]),
  selectedGroup = ref(""),
  kcGroups = ref<string[]>([]),
  activeAppId = ref(""),
  erpDoctypes = ref<string[]>([]);
const formValue = ref<{ group: string; permissions: string[] }>({
    group: "",
    permissions: [],
  }),
  formKey = ref(0),
  lastLoadedGroup = ref(""),
  lastLoadedPerms = ref<string[]>([]);
const groupColumns = [
  {
    prop: "group_path",
    label: "Group/Role",
    minWidth: 230,
    showOverflowTooltip: true,
  },
  { prop: "perm_count", label: "Perms", width: 90, align: "right" },
  { key: "actions", label: "Actions", width: 120, slot: "actions" },
] as const;
const erpActions = [
  "select",
  "read",
  "write",
  "create",
  "delete",
  "submit",
  "cancel",
  "amend",
  "print",
  "email",
  "report",
  "import",
  "export",
  "share",
];

const isErpnext = computed(
  () => String(activeAppId.value || "").trim() === APP_IDS.erpnext,
);

const appOptions = computed(() =>
  Array.from(
    new Set(
      catalog.value.map((it) => String(it?.appId ?? "").trim()).filter(Boolean),
    ),
  )
    .sort()
    .map((v) => ({ label: v, value: v })),
);

const erpDoctypeKeys = computed(() => {
  const s = new Set<string>();
  for (const d of erpDoctypes.value)
    s.add(d.toLowerCase().replace(/\s+/g, "_"));
  return s;
});

const filteredCatalog = computed(() => {
  const appId = String(activeAppId.value || "").trim();
  const base = !appId
    ? catalog.value
    : appId === APP_IDS.erpnext
      ? []
      : catalog.value.filter((x) => String(x.appId || "").trim() === appId);
  const selected = new Set(formValue.value.permissions);
  const known = new Set(base.map((x) => x.key));
  const extra = catalog.value.filter(
    (x) => selected.has(x.key) && !known.has(x.key),
  );
  return [...base, ...extra];
});

function checkErpNextKnown(key: string): boolean {
  if (!key.startsWith("erpnext.")) return false;
  const parts = key.split(".");
  if (parts.length < 3) return false;
  const action = parts[parts.length - 1];
  if (!erpActions.includes(action)) return false;
  return erpDoctypeKeys.value.has(parts.slice(1, -1).join("."));
}

function loadErpNext(node: any, resolve: (data: any[]) => void): void {
  if (node.level === 0) {
    resolve([
      { id: "root:erpnext", label: "ERPNext", children: [], isLeaf: false },
    ]);
  } else if (node.data.id === "root:erpnext") {
    const children = erpDoctypes.value.map((d) => ({
      id: `doctype:${d}`,
      label: d,
      children: [],
      isLeaf: false,
    }));
    resolve(children);
  } else if (String(node.data.id).startsWith("doctype:")) {
    const d = String(node.data.id).substring(8);
    const base = `erpnext.${d.toLowerCase().replace(/\s+/g, "_")}`;
    const children = erpActions.map((a) => {
      const key = `${base}.${a}`;
      return { id: key, label: `${d} · ${a} (${key})`, isLeaf: true };
    });
    resolve(children);
  } else {
    resolve([]);
  }
}

const groupOptions = computed(() =>
  Array.from(
    new Set(
      [
        ...(isErpnext.value
          ? groups.value.map((x) => String(x.group_path || "").trim())
          : kcGroups.value),
        String(formValue.value.group || "").trim(),
      ]
        .map((v) => String(v || "").trim())
        .filter(Boolean),
    ),
  )
    .sort()
    .map((v) => ({ label: v, value: v })),
);

async function refreshAll(): Promise<void> {
  await loadCatalog();
  if (!activeAppId.value && appOptions.value.length > 0) {
    activeAppId.value = String(appOptions.value[0]?.value || "").trim();
  }
  await loadGroupsAndOptions();
  await loadSelected();
}

async function loadCatalog(): Promise<void> {
  try {
    const res = await API.PermCatalog();
    const items = (res?.data?.items ?? []) as CatalogItem[];
    const base = items
      .filter(
        (x) =>
          x &&
          typeof x.key === "string" &&
          typeof x.name === "string" &&
          typeof x.appId === "string",
      )
      .map((x) => ({
        ...x,
        key: String(x.key).trim(),
        name: String(x.name).trim(),
        appId: String(x.appId).trim(),
      }));
    catalog.value = base;
    try {
      const erpRes = await API.PermErpnextDoctypes();
      erpDoctypes.value = normalizeStringList(erpRes?.data?.items ?? []);
    } catch {
      erpDoctypes.value = [];
    }
  } catch {
    catalog.value = [];
  }
}

async function loadGroupsAndOptions(): Promise<void> {
  try {
    if (isErpnext.value) {
      const roles = normalizeStringList(
        (await API.PermErpnextRoles())?.data?.items ?? [],
      );
      groups.value = roles.map((r) => ({ group_path: r, perm_count: 0 }));
      kcGroups.value = [];
      return;
    }
    const [groupsRes, kcRes] = await Promise.all([
      API.PermGroups(),
      API.PermKeycloakGroups(),
    ]);
    const items = (groupsRes?.data?.items ?? []) as GroupRow[];
    groups.value = items
      .filter((x) => x && typeof x.group_path === "string")
      .map((x) => ({
        group_path: x.group_path,
        perm_count: Number(x.perm_count || 0) || 0,
      }));
    kcGroups.value = normalizeStringList(kcRes?.data?.items ?? []);
  } catch {
    kcGroups.value = [];
    groups.value = [];
  }
}

function handleRowClick(row: GroupRow): void {
  const g = String(row?.group_path || "").trim();
  if (!g) return;
  void openGroup(g);
}

function rowClassName(payload: { row: GroupRow }): string {
  const g = String(payload?.row?.group_path || "").trim();
  if (!g) return "";
  return g === selectedGroup.value ? SELECTED_ROW_CLASS : "";
}

async function openGroup(groupPath: string): Promise<void> {
  const g = String(groupPath || "").trim();
  selectedGroup.value = g;
  formValue.value = { group: g, permissions: [] };
  formKey.value += 1;
  await loadSelected();
}

async function removeGroup(groupPath: string): Promise<void> {
  const g = String(groupPath || "").trim();
  if (!g) return;
  try {
    const ok = globalThis.confirm
      ? globalThis.confirm(i18n.t("perm.confirm_delete", { group: g }))
      : true;
    if (!ok) return;
    await API.PermSetGroup({ group: g, permissions: [] });
    ElNotification({
      title: i18n.t("common.deleted"),
      message: g,
      type: "success",
    });
    await loadGroupsAndOptions();
    if (selectedGroup.value === g) {
      selectedGroup.value = "";
      formValue.value = { group: "", permissions: [] };
      formKey.value += 1;
      lastLoadedGroup.value = "";
      lastLoadedPerms.value = [];
    }
  } catch (e) {
    ElNotification({
      title: i18n.t("common.delete_failed"),
      message: String((e as any)?.message || "error"),
      type: "error",
    });
  }
}

async function loadSelected(): Promise<void> {
  const g = String(formValue.value.group || selectedGroup.value || "").trim();
  if (!g) return;
  try {
    const perms = isErpnext.value
      ? normalizeStringList(
          (await API.PermErpnextRolePermKeys({ role: g }))?.data?.items ?? [],
        )
      : normalizeStringList(
          (await API.PermGetGroup({ group: g }))?.data?.permissions ?? [],
        );
    formValue.value = { group: g, permissions: perms };
    selectedGroup.value = g;
    lastLoadedGroup.value = g;
    lastLoadedPerms.value = perms;
    if (isErpnext.value) {
      const doctypes = erpDoctypes.value.length
        ? erpDoctypes.value
        : Array.from(
            new Set(
              perms
                .map(
                  (k) =>
                    String(k || "")
                      .trim()
                      .split(".")
                      .filter(Boolean)[1] || "",
                )
                .filter(Boolean),
            ),
          );
      // Update erpDoctypes if needed (fallback)
      if (!erpDoctypes.value.length && doctypes.length) {
        erpDoctypes.value = doctypes;
      }
    }
    ElNotification({
      title: i18n.t("common.loaded"),
      message: g,
      type: "success",
    });
  } catch (e) {
    ElNotification({
      title: i18n.t("common.load_failed"),
      message: String((e as any)?.message || "error"),
      type: "error",
    });
  }
}

async function submit(value: { group?: unknown }): Promise<void> {
  const g = String(value?.group ?? "").trim();
  const p = normalizeStringList(formValue.value.permissions);
  if (!g) return;
  try {
    const prev = g === lastLoadedGroup.value ? lastLoadedPerms.value : [];
    const prevSet = new Set(prev);
    const nextSet = new Set(p);
    let added = 0;
    let removed = 0;
    for (const k of nextSet) if (!prevSet.has(k)) added += 1;
    for (const k of prevSet) if (!nextSet.has(k)) removed += 1;

    if (isErpnext.value) {
      await API.PermErpnextSetRolePermKeys({ role: g, items: p });
    } else {
      await API.PermSetGroup({ group: g, permissions: p });
    }
    ElNotification({
      title: i18n.t("common.saved"),
      message: `${g} (+${added} -${removed})`,
      type: "success",
    });
    selectedGroup.value = g;
    await loadGroupsAndOptions();
    await loadSelected();
  } catch (e) {
    ElNotification({
      title: i18n.t("common.save_failed"),
      message: String((e as any)?.message || "error"),
      type: "error",
    });
  }
}

async function handleAppChanged(): Promise<void> {
  selectedGroup.value = "";
  formValue.value = { group: "", permissions: [] };
  formKey.value += 1;
  lastLoadedGroup.value = "";
  lastLoadedPerms.value = [];
  // erpItems.value = [] // Removed
  await loadGroupsAndOptions();
}

onMounted(() => {
  refreshAll();
});

watch(activeAppId, () => {
  void handleAppChanged();
});
</script>

<style scoped>
.perm-group-admin {
  padding: 0;
}
.toolbar {
  margin: var(--spacing-md-minus) 0;
  display: flex;
  gap: var(--spacing-md-minus);
  align-items: flex-end;
}
.layout {
  display: flex;
  gap: var(--spacing-md);
}
.pane {
  flex: 1;
  min-width: 0;
}
.row {
  display: flex;
  gap: var(--spacing-sm-plus);
  margin-top: var(--spacing-md-minus);
}
.perm-group-admin :deep(.el-table__body tr) {
  cursor: pointer;
}
.perm-group-admin
  :deep(.el-table__body tr.perm-group-admin__row--selected td.el-table__cell) {
  background-color: var(--btn-selected-bg-color);
}
</style>
