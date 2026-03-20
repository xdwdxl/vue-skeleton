<template>
  <section class="settings-page">
    <CidsCard title="Settings">
      <div class="settings-empty">No settings available.</div>
    </CidsCard>
  </section>
</template>

<script setup lang="ts">
import CidsCard from '../components/CidsCard.vue'
</script>

<style scoped>
.settings-page {
  padding: 20px;
}
.settings-empty {
  color: var(--text-secondary);
  font-style: italic;
}
</style>
