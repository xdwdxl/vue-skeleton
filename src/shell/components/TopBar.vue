<template>
  <el-menu
    class="el-menu-vertical-demo topbar-menu"
    :ellipsis="false"
    :default-active="activeMenu"
    mode="horizontal"
    :menu-trigger="'click'"
  >
    <TopBarItem
      :key="route.path + index"
      v-for="(route, index) in leftMenus"
      :item="route"
      :base-path="route.path"
    />
    <div class="menu-spacer" />
    <TopBarItem
      :key="route.path + index"
      v-for="(route, index) in rightMenus"
      :item="route"
      :base-path="route.path"
    />
  </el-menu>
</template>

<script lang="ts" setup>
  import TopBarItem from './TopBarItem.vue'
  import { useRoute, useRouter } from 'vue-router'
  import { computed } from 'vue'
  import type { RouteMeta } from 'vue-router'

  interface MenuItem {
    path: string
    name: string | symbol | undefined
    meta: RouteMeta
    children?: MenuItem[]
  }

  const route = useRoute()
  const router = useRouter()

  const activeMenu = computed<string>(() => {
    const { meta, path } = route
    if (meta.activeMenu) {
      return meta.activeMenu as string
    }
    return path
  })

  function getVisibleRoutes(): MenuItem[] {
    return router
      .getRoutes()
      .filter((r) => r.meta?.title && !r.meta?.hidden)
      .sort((a, b) => Number(a.meta?.order ?? 999) - Number(b.meta?.order ?? 999))
      .map((r) => ({
        path: r.path,
        name: r.name,
        meta: r.meta,
      }))
  }

  function buildMenuTree(routes: MenuItem[]): MenuItem[] {
    const topLevel = routes.filter((r) => !r.meta?.parentMenu)
    const children = routes.filter((r) => r.meta?.parentMenu)

    for (const child of children) {
      const parent = topLevel.find((p) => p.name === child.meta.parentMenu)
      if (parent) {
        if (!parent.children) parent.children = []
        parent.children.push(child)
      }
    }

    return topLevel
  }

  const allMenus = computed<MenuItem[]>(() => buildMenuTree(getVisibleRoutes()))

  const leftMenus = computed(() => allMenus.value.filter((r) => r.meta?.position !== 'right'))
  const rightMenus = computed(() => allMenus.value.filter((r) => r.meta?.position === 'right'))
</script>

<style lang="scss">
  .menu-spacer {
    flex: 1;
  }

  .topbar-menu {
    background-color: var(--pressed-default) !important;

    --el-menu-bg-color: var(--pressed-default);
    --el-menu-text-color: var(--color-white);
    --el-menu-active-color: var(--color-white);
  }
</style>
