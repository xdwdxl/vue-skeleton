<template>
  <div v-if="!item.hidden">
    <template
      v-if="
        hasOneShowingChild(item.children, item) &&
        (!onlyOneChild.children || onlyOneChild.noShowingChildren) &&
        !item.alwaysShow &&
        !(item.meta && item.meta.alwaysShow)
      "
    >
      <AppLink
        v-if="onlyOneChild.meta"
        :to="resolvePath(onlyOneChild.path, onlyOneChild.query)"
      >
        <el-menu-item
          :index="resolvePath(onlyOneChild.path)"
          :class="{ 'submenu-title-noDropdown': !isNest }"
        >
          <svg-icon
            class="menu-title-color menu-icon"
            :icon-class="onlyOneChild.meta.icon || (item.meta && item.meta.icon)"
          />
          <template #title>
            <span
              class="menu-title menu-title-color"
              :title="hasTitle($t(onlyOneChild.meta.title ?? ''))"
            >
              {{ $t(onlyOneChild.meta.title ?? '') }}
            </span>
          </template>
        </el-menu-item>
      </AppLink>
    </template>
    <el-sub-menu
      v-else
      ref="subMenu"
      :index="resolvePath(item.path)"
      teleported
    >
      <template
        v-if="item.meta"
        #title
      >
        <svg-icon
          class="menu-title-color menu-icon"
          :icon-class="item.meta && item.meta.icon"
        />
        <span
          class="menu-title menu-title-color"
          :title="hasTitle($t(item.meta.title ?? ''))"
        >
          {{ $t(item.meta.title ?? '') }}
        </span>
      </template>
      <TopBarItem
        style="width: 100%"
        v-for="(child, index) in item.children"
        :key="child.path + index"
        :is-nest="true"
        :item="child"
        :base-path="resolvePath(child.path)"
        class="nest-menu"
      />
    </el-sub-menu>
  </div>
</template>

<script lang="ts" setup>
  import AppLink from './Link.vue'
  import { ref } from 'vue'
  import type { RouteMeta } from 'vue-router'

  interface MenuItem {
    path: string
    name?: string | symbol
    meta?: RouteMeta & { icon?: string; title?: string }
    children?: MenuItem[]
    hidden?: boolean
    alwaysShow?: boolean
    noShowingChildren?: boolean
    query?: string
    [key: string]: any
  }

  const EXTERNAL_LINK_PATTERN = /^(https?:|mailto:|tel:)/

  const props = defineProps<{
    item: MenuItem
    isNest?: boolean
    basePath?: string
  }>()

  const onlyOneChild = ref<MenuItem>({} as MenuItem)

  function hasOneShowingChild(children: MenuItem[] = [], parent: MenuItem): boolean {
    if (!children) {
      children = []
    }
    const showingChildren = children.filter((item: MenuItem) => {
      if (item.hidden) {
        return false
      }
      onlyOneChild.value = item
      return true
    })

    // When there is only one child router, the child router is displayed by default
    if (showingChildren.length === 1) {
      return true
    }

    // Show parent if there are no child router to display
    if (showingChildren.length === 0) {
      onlyOneChild.value = { ...parent, path: '', noShowingChildren: true }
      return true
    }

    return false
  }

  function resolvePath(routePath?: string, routeQuery?: string): any {
    const path = routePath ?? ''
    const base = props.basePath ?? ''
    if (isExternal(path)) {
      return path
    }
    if (isExternal(base)) {
      return base
    }
    // Absolute paths don't need basePath prefix
    if (path && path.startsWith('/')) {
      return routeQuery ? { path, query: JSON.parse(routeQuery) } : path
    }
    if (routeQuery) {
      const query = JSON.parse(routeQuery)
      return { path: getNormalPath(base + '/' + path), query }
    }
    return getNormalPath(base + '/' + path)
  }

  function hasTitle(title?: string): string {
    if (title && title.length > 5) {
      return title
    } else {
      return ''
    }
  }

  function isExternal(path?: string): boolean {
    return EXTERNAL_LINK_PATTERN.test(path ?? '')
  }

  function getNormalPath(p: string): string {
    if (p.length === 0 || !p || p == 'undefined') {
      return p
    }
    let res = p.replace('//', '/')
    if (res[res.length - 1] === '/') {
      return res.slice(0, res.length - 1)
    }
    return res
  }
</script>
<style lang="scss" scoped>
  .menu-title-color {
    color: var(--color-white);
    font-weight: bold;
  }

  .menu-icon {
    margin-right: 5px;
  }

  .nest-menu {
    .menu-title-color {
      color: var(--color-text-title);
    }

    .el-menu-item:not(.is-disabled):focus,
    .el-menu-item:not(.is-disabled):hover,
    .el-sub-menu__title:hover {
      background-color: var(--select-color-hover) !important;
    }
  }

  .el-menu-item:not(.is-disabled):hover,
  .el-sub-menu__title:hover {
    background-color: var(--el-sub-menu-hover) !important;
  }

  :deep(.el-sub-menu__title:hover) {
    background-color: var(--el-sub-menu-hover) !important;
  }

  :deep(.el-menu-item:not(.is-disabled):focus) {
    background-color: var(--color-primary) !important;
    color: var(--color-white) !important;
  }

  :deep(.el-menu-item:not(.is-disabled):focus .menu-title-color) {
    color: var(--color-white) !important;
  }
  :deep(.el-menu-item.is-active) {
    background-color: var(--color-primary) !important;
    color: var(--color-white) !important;
  }

  :deep(.el-menu-item.is-active .menu-title-color) {
    color: var(--color-white) !important;
  }
</style>

<style lang="scss">
  /* Global styles for teleported dropdown menus */
  .el-menu--horizontal .el-menu {
    background-color: var(--color-background-base) !important;
  }

  .el-menu--horizontal .el-menu .el-menu-item {
    background-color: var(--color-background-base) !important;
  }

  .el-menu--horizontal .el-menu .el-menu-item.is-active {
    background-color: var(--color-primary) !important;
    color: var(--color-white) !important;
  }

  .el-menu--horizontal .el-menu .el-menu-item:not(.is-disabled):not(.is-active):hover {
    background-color: var(--select-color-hover) !important;
    color: var(--color-white) !important;
  }

  .el-menu--horizontal .el-menu .el-menu-item.is-active:hover {
    background-color: var(--hover-primary) !important;
    color: var(--color-white) !important;
  }
</style>
