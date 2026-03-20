<!--
  @file RegisterPage.vue - User registration page with profile form
  @author Cooper Wang
  @date 2026-03-13
  @description Registration page with username, password, date of birth, country selection, and newsletter opt-in
-->
<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-card__header">
        <span class="auth-card__title">{{ $t('register.title') }}</span>
        <div class="auth-card__actions">
          <button class="auth-card__action-btn" @click="emit('minimize')">
            <el-icon><Minus /></el-icon>
          </button>
          <button class="auth-card__action-btn" @click="router.push('/login')">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </div>

      <div class="auth-card__body">
        <div>
          <label class="auth-card__label">{{ $t('register.username') }}</label>
          <PortalInput v-model="form.username" :placeholder="$t('register.username_placeholder')" />
        </div>
        <div>
          <label class="auth-card__label">{{ $t('register.password') }}</label>
          <PortalInput v-model="form.password" type="password" />
        </div>
        <div>
          <label class="auth-card__label">{{ $t('register.re_password') }}</label>
          <PortalInput v-model="form.rePassword" type="password" />
        </div>

        <!-- Date of birth -->
        <div>
          <label class="auth-card__label">{{ $t('register.date_of_birth') }}</label>
          <div class="register__dob">
            <PortalSelect v-model="form.birthMonth" :options="monthOptions" :placeholder="$t('register.month')" />
            <PortalSelect v-model="form.birthDay" :options="dayOptions" :placeholder="$t('register.day')" />
            <PortalSelect v-model="form.birthYear" :options="yearOptions" :placeholder="$t('register.year')" />
          </div>
        </div>

        <!-- Country -->
        <div>
          <label class="auth-card__label">{{ $t('register.country') }}</label>
          <PortalSelect v-model="form.country" :options="countryOptions" :placeholder="$t('register.select_country')" />
        </div>

        <label class="auth-card__checkbox">
          <input type="checkbox" v-model="form.newsletter" />
          <span>{{ $t('register.newsletter') }}</span>
        </label>

        <PortalButton type="form" color="default" @click="handleSend">{{ $t('common.send') }}</PortalButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Minus, Close } from '@element-plus/icons-vue'
import { PortalInput, PortalButton } from '../components'
import PortalSelect from '../components/PortalSelect.vue'
import '../styles/auth-card.css'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RegisterForm {
  username: string
  password: string
  rePassword: string
  birthMonth: string | number
  birthDay: string | number
  birthYear: string | number
  country: string | number
  newsletter: boolean
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const router = useRouter()

const form = reactive<RegisterForm>({
  username: '',
  password: '',
  rePassword: '',
  birthMonth: '',
  birthDay: '',
  birthYear: '',
  country: '',
  newsletter: false,
})

const emit = defineEmits<{
  register: [form: RegisterForm]
  minimize: []
}>()

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

/**
 * Generate sequential number options for dropdowns
 * @author Cooper Wang
 * @param {number} count - Number of items
 * @param {(i: number) => { label: string; value: number }} mapper - Index-to-option mapper
 * @returns {{ label: string; value: number }[]} - Dropdown options array
 */
function rangeOptions(count: number, mapper: (i: number) => { label: string; value: number }) {
  return Array.from({ length: count }, (_, i) => mapper(i))
}

const monthOptions = rangeOptions(12, i => ({ label: String(i + 1).padStart(2, '0'), value: i + 1 }))
const dayOptions = rangeOptions(31, i => ({ label: String(i + 1).padStart(2, '0'), value: i + 1 }))
const yearOptions = rangeOptions(100, i => {
  const y = new Date().getFullYear() - i
  return { label: String(y), value: y }
})

const countryOptions = [
  ['United States', 'US'], ['United Kingdom', 'UK'], ['Canada', 'CA'],
  ['Australia', 'AU'], ['Germany', 'DE'], ['France', 'FR'],
  ['Japan', 'JP'], ['South Korea', 'KR'], ['Singapore', 'SG'], ['Other', 'OTHER'],
].map(([label, value]) => ({ label, value }))

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/** @author Cooper Wang */
function handleSend() {
  emit('register', { ...form })
}
</script>

<style scoped>
.register__dob {
  display: flex;
  gap: var(--spacing-sm);
}

.register__dob > * {
  flex: 1;
}
</style>
