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
import PortalHeader from '../components/PortalHeader.vue'
</script>
<!--  -->
<style scoped>
.portal-shell {
  --portal-header-height: var(--layout-header-height);
  --portal-header-padding-x: var(--layout-header-padding-x);
  --portal-header-gap: var(--layout-header-gap);
  --portal-header-border-color: var(--layout-header-border-color);
  --portal-header-bg: var(--layout-header-bg);
  --portal-header-fg: var(--layout-header-fg);
  --portal-brand-font-size: var(--layout-brand-font-size);
  --portal-link-font-size: var(--font-size-extra-small);
  --portal-user-min-width: var(--layout-user-min-width);
  --portal-lang-padding-y: var(--layout-lang-padding-y);
  --portal-lang-padding-x: var(--layout-lang-padding-x);
  --portal-lang-radius: var(--fk-border-radius-full);
  --portal-lang-bg: var(--color-primary);
  --portal-lang-bg-hover: var(--layout-lang-bg-hover);
  --portal-lang-icon-size: var(--layout-lang-icon-width);
  --portal-main-padding: var(--spacing-md);

  font-family: var(--font-family-regular);
  height: 100%;
}

.portal-header-container {
  height: var(--portal-header-height);
  padding: 0 var(--portal-header-padding-x);
  background-color: var(--portal-header-bg);
  border-bottom: 1px solid var(--portal-header-border-color);
}

.portal-main {
  background-color: var(--color-background-base);
  padding: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.portal-main :deep(section){
    display: flex;
    flex-direction: column;
    height: 100%;
}

@media (max-width: 768px) {
  .portal-shell {
    --portal-header-padding-x: var(--layout-header-padding-x-mobile);
    --portal-brand-font-size: var(--layout-brand-font-size-mobile);
    --portal-header-gap: var(--layout-header-gap-mobile);
    --portal-user-min-width: var(--layout-user-min-width-mobile);
  }
}
</style>
