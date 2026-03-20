<!--
  @file App.vue - Portal host root component
  @author Lorin Luo
  @date 2025-12-18
  @description Provides navigation and renders remote child routes
-->
<template>
  <template v-if="$route.meta.hidden">
    <router-view />
  </template>
  <PortalShell v-else />
</template>

<script setup lang="ts">
  import PortalShell from './shell/PortalShell.vue'
</script>
