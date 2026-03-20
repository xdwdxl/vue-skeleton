<!--
  @file Landing.vue - Public landing page
  @author Lorin Luo
  @date 2026-01-16
  @description Shows a friendly message and login entry when unauthenticated
 -->
<template>
  <section class="landing">
    <CidsCard :title="$t('landing.title')" :subtitle="$t('landing.subtitle')">
      <div class="landing__content">
        <ElButton type="primary" @click="login">
          <div class="landing__button-content">
            {{ $t('shell.login') }}
          </div>
        </ElButton>
      </div>
    </CidsCard>
  </section>
</template>

<script setup lang="ts">
import { ElButton } from 'element-plus'
import 'element-plus/es/components/button/style/css'
import { API } from '../api'
import CidsCard from '../components/CidsCard.vue'

function login() {
  const redirectUri = `${window.location.origin}${window.location.pathname}`
  window.location.href = API.AuthLoginUrl({ redirectUri })
}
</script>

<style scoped>
.landing {
  padding: var(--spacing-lg);
}

.landing__content {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: var(--spacing-sm) 0;
}

.landing__button-content {
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--color-primary);
  color: var(--color-white);
}
</style>

