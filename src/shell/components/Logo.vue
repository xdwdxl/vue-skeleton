<template>
  <div class="topbar-logo-container">
    <router-link
      key="expand"
      class="topbar-logo-link"
      to="/"
    >
      <img
        v-if="logo"
        :src="logo"
        class="topbar-logo"
      />
    </router-link>
  </div>
</template>

<script lang="ts" setup>
  import logo from '@/assets/logo/logo.png'
</script>

<style lang="scss" scoped>
  .topbar-logo-container {
    position: relative;
    height: 40px;
    line-height: 40px;
    text-align: center;
    overflow: hidden;

    & .topbar-logo-link {
      height: 100%;
      width: 100%;

      & .topbar-logo {
        height: 20px;
        vertical-align: middle;
        margin-right: 10px;
      }

      & .topbar-title {
        display: inline-block;
        margin: 0;
        color: var(--color-white);
        font-weight: 600;
        line-height: 50px;
        font-size: var(--font-size-mini);
        font-family: var(--font-family);
        vertical-align: middle;
      }
    }
  }
</style>
