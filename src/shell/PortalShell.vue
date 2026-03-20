<template>
  <div class="portal-shell">
    <div class="portal-header-container">
      <PortalHeader />
    </div>
    <main class="portal-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
  import PortalHeader from './components/PortalHeader.vue'
</script>
<style scoped>
  .portal-main {
    background-color: var(--color-background-page);
    padding: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
</style>
