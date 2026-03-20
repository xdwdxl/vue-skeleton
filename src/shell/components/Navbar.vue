<template>
  <div
    class="navbar"
    :class="'nav'"
  >
    <Logo></Logo>
    <TopBar
      id="topbar-container"
      class="topbar-container"
    />

    <div class="right-menu">
      <DownList
        id="down-list"
        :buttonText="buttonText"
        :dropdownItems="dropdownItems"
      />

      <div class="row-df">
        <el-icon
          class="color-white avatar-icon"
          :size="18"
        >
          <Avatar />
        </el-icon>
        <div class="text-name">{{ $t('shell.username') }}</div>
      </div>

      <el-icon
        class="out-button color-white"
        :size="18"
        @click="logout"
      >
        <SwitchButton />
      </el-icon>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { Avatar, SwitchButton } from '@element-plus/icons-vue'
  import { ElMessageBox } from 'element-plus'
  import { useI18n } from '../../i18n'
  import { API } from '../../api'
  import Logo from './Logo.vue'
  import TopBar from './TopBar.vue'
  import DownList from './DownList.vue'

  const router = useRouter()

  const i18n = useI18n()

  const langLabels: Record<string, string> = {
    'en-US': 'English',
    'de-DE': 'Deutsch',
  }

  const dropdownItems = [
    {
      label: 'English',
      onClick: () => {
        i18n.setLocale('en-US')
      },
    },
    {
      label: 'Deutsch',
      onClick: () => {
        i18n.setLocale('de-DE')
      },
    },
  ]

  const buttonText = computed(() => langLabels[i18n.locale] || i18n.locale)

  function logout(): void {
    ElMessageBox.confirm(i18n.t('shell.logout_confirm'), undefined, {
      confirmButtonText: i18n.t('common.ok'),
      showCancelButton: false,
      showClose: false,
      confirmButtonType: 'primary',
    })
      .then(async () => {
        try {
          await API.AuthLogoutFlow()
        } catch {}
        router.push('/login')
      })
      .catch(() => {})
  }
</script>

<style lang="scss" scoped>
  .out-button {
    margin-left: 40px;
    font-weight: bold;
  }

  .color-white {
    color: var(--color-white) !important;
  }

  .navbar {
    height: 40px;
    overflow: hidden;
    position: relative;
    background: var(--color-black);
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    display: flex;
    align-items: center;
    padding: 0 20px;
    box-sizing: border-box;

    .avatar-icon {
      margin: 0 5px 0 10px;
    }

    .topbar-container {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      overflow: hidden;
      margin-left: 8px;
    }

    .right-menu {
      display: flex;
      align-items: center;

      .row-df {
        display: flex;
        align-items: center;
      }

      .text-name {
        font-size: var(--font-size-mini);
        color: var(--color-white);
        font-weight: bold;
      }

      &:focus {
        outline: none;
      }
    }
  }
</style>
