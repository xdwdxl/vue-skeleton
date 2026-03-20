<template>
  <section class="perm-admin">
    <h2>{{ $t("perm.title") }}</h2>
    <div class="toolbar">
      <!-- <el-button
        class="btn"
        :class="{ 'btn--active': activePanel === PANELS.group }"
        @click="activePanel = PANELS.group"
        >{{ $t("perm.groups_roles") }}</el-button
      >
      <el-button
        class="btn"
        :class="{ 'btn--active': activePanel === PANELS.user }"
        @click="activePanel = PANELS.user"
        >{{ $t("perm.users") }}</el-button
      > -->
      <el-button
        class="btn"
        :class="{ 'btn--active': activePanel === PANELS.settings }"
        @click="activePanel = PANELS.settings"
        >{{ $t("shell.settings") }}</el-button
      >
      <el-button
        class="btn"
        :class="{ 'btn--active': activePanel === PANELS.notify }"
        @click="activePanel = PANELS.notify"
        >Notify</el-button
      >
      <el-button
        class="btn"
        :class="{ 'btn--active': activePanel === PANELS.layout }"
        @click="activePanel = PANELS.layout"
        >Dashboard Layout</el-button
      >
    </div>
    <PermGroupRoleAdmin v-if="activePanel === PANELS.group" />
    <DashboardLayoutSettings v-else-if="activePanel === PANELS.layout" />
    <PermUserGroupRoleAdmin v-else-if="activePanel === PANELS.user" />
    <Settings v-else-if="activePanel === PANELS.settings" />
    <NotifyAdmin v-else />
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import PermGroupRoleAdmin from "./perm-admin/PermGroupRoleAdmin.vue";
import PermUserGroupRoleAdmin from "./perm-admin/PermUserGroupRoleAdmin.vue";
import Settings from "./Settings.vue";
import DashboardLayoutSettings from "./DashboardLayoutSettings.vue";
import NotifyAdmin from "./perm-admin/NotifyAdmin.vue";

const PANELS = { group: "group", layout: "layout", user: "user", settings: "settings", notify: "notify" } as const;
const activePanel = ref<(typeof PANELS)[keyof typeof PANELS]>(PANELS.settings);
</script>

<style scoped>
.perm-admin {
  padding: var(--spacing-md);
}
.toolbar {
  margin: var(--spacing-md-minus) 0;
  display: flex;
  gap: var(--spacing-sm-plus);
  align-items: center;
}
.btn--active {
  background-color: var(--btn-selected-bg-color);
}
</style>
