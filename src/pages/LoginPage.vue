<!--
  @file LoginPage.vue - User login page with credentials form
  @author Cooper Wang
  @date 2026-03-13
  @description Login page with username/password inputs, remember-me checkbox, and navigation links
-->
<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-card__header">
        <span class="auth-card__title">{{ $t('login.title') }}</span>
        <div class="auth-card__actions">
          <button
            class="auth-card__action-btn"
            @click="emit('minimize')"
          >
            <el-icon><Minus /></el-icon>
          </button>
          <button
            class="auth-card__action-btn"
            @click="emit('close')"
          >
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </div>

      <div class="auth-card__body">
        <PortalInput
          v-model="form.username"
          :placeholder="$t('login.username')"
        >
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
        </PortalInput>

        <PortalInput
          v-model="form.password"
          :placeholder="$t('login.password')"
        >
          <template #prefix>
            <el-icon><Lock /></el-icon>
          </template>
        </PortalInput>

        <label class="auth-card__checkbox">
          <input
            type="checkbox"
            v-model="form.remember"
          />
          <span>{{ $t('login.remember') }}</span>
        </label>

        <PortalButton
          type="form"
          color="default"
          @click="handleLogin"
        >
          {{ $t('login.login') }}
        </PortalButton>

        <div class="login__links">
          <a
            class="login__link"
            href="#"
            @click.prevent="emit('forget-password')"
          >
            {{ $t('login.forget_password') }}
          </a>
          <router-link
            class="login__link"
            to="/register"
          >
            {{ $t('login.create_account') }}
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { reactive } from 'vue'
  import { useRouter } from 'vue-router'
  import { User, Lock, Minus, Close } from '@element-plus/icons-vue'
  import { PortalInput, PortalButton } from '../components'
  import '../styles/auth-card.css'

  export interface LoginForm {
    username: string
    password: string
    remember: boolean
  }

  const form = reactive<LoginForm>({
    username: '',
    password: '',
    remember: false,
  })

  const router = useRouter()

  const emit = defineEmits<{
    login: [form: LoginForm]
    'forget-password': []
    minimize: []
    close: []
  }>()

  /** @author Cooper Wang */
  function handleLogin() {
    emit('login', { ...form })
    router.push('/dashboard')
  }
</script>

<style scoped>
  .login__links {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .login__link {
    font-family: var(--font-family-regular);
    font-size: var(--font-size-micro);
    color: var(--color-primary);
    text-decoration: none;
    cursor: pointer;
  }

  .login__link:hover {
    text-decoration: underline;
  }
</style>
