<template>
  <el-dropdown trigger="click">
    <span class="el-dropdown-link">
      {{ buttonText }}
      <el-icon class="el-icon--right"><arrow-down /></el-icon>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="(item, index) in dropdownItems"
          :key="index"
          :disabled="item.disabled"
          :divided="item.divided"
          @click="item.onClick"
        >
          {{ item.label }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script lang="ts" setup>
  import { ArrowDown } from '@element-plus/icons-vue'

  interface DropdownItem {
    label: string
    disabled?: boolean
    divided?: boolean
    onClick: () => void
  }

  const props = defineProps({
    buttonText: {
      type: String,
      default: 'Dropdown List',
    },
    dropdownItems: {
      type: Array as () => DropdownItem[],
      default: () => [
        { label: 'Action 1', onClick: () => {} },
        { label: 'Action 2', onClick: () => {} },
      ],
    },
  })
</script>

<style scoped>
  .el-dropdown-link {
    cursor: pointer;
    color: var(--color-white) !important;
    display: flex;
    align-items: center;
    font-size: var(--font-size-mini);
    margin: 0 20px;
    font-weight: bold;
  }
</style>

<style>
  .el-dropdown-menu__item:not(.is-disabled):hover {
    background-color: var(--select-color-hover) !important;
    color: var(--color-secondary) !important;
  }
</style>
