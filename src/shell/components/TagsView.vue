<template>
  <div
    id="tags-view-container"
    class="tags-view-container"
  >
    <ScrollPane
      ref="scrollPaneRef"
      class="tags-view-wrapper"
      @scroll="handleScroll"
    >
      <router-link
        v-for="tag in visitedViews"
        :key="tag.path"
        :data-path="tag.path"
        :class="{ active: isActive(tag), 'has-icon': tagsIcon }"
        :to="{ path: tag.path, query: tag.query }"
        class="tags-view-item"
        @click.middle="!isAffix(tag) ? closeSelectedTag(tag) : ''"
        @contextmenu.prevent="openMenu(tag, $event)"
      >
        <svg-icon
          v-if="tagsIcon && tag.meta && tag.meta.icon && tag.meta.icon !== '#'"
          :icon-class="tag.meta.icon"
        />
        {{ $t(tag.title) }}
        <span
          v-if="!isAffix(tag)"
          @click.prevent.stop="closeSelectedTag(tag)"
        >
          <close
            class="el-icon-close"
            style="width: 1em; height: 1em; vertical-align: middle"
          />
        </span>
      </router-link>
    </ScrollPane>
    <ul
      v-show="visible"
      :style="{ left: left + 'px', top: top + 'px' }"
      class="contextmenu"
    >
      <li @click="refreshSelectedTag(selectedTag)">
        <refresh-right style="width: 1em; height: 1em" />
        {{ $t('shell.tags.refresh') }}
      </li>
      <li
        v-if="!isAffix(selectedTag)"
        @click="closeSelectedTag(selectedTag)"
      >
        <close style="width: 1em; height: 1em" />
        {{ $t('shell.tags.close_current') }}
      </li>
      <li @click="closeOthersTags">
        <circle-close style="width: 1em; height: 1em" />
        {{ $t('shell.tags.close_others') }}
      </li>
      <li
        v-if="!isFirstView()"
        @click="closeLeftTags"
      >
        <back style="width: 1em; height: 1em" />
        {{ $t('shell.tags.close_left') }}
      </li>
      <li
        v-if="!isLastView()"
        @click="closeRightTags"
      >
        <right style="width: 1em; height: 1em" />
        {{ $t('shell.tags.close_right') }}
      </li>
      <li @click="closeAllTags(selectedTag)">
        <circle-close style="width: 1em; height: 1em" />
        {{ $t('shell.tags.close_all') }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
  import { ref, computed, watch, onMounted, nextTick, getCurrentInstance } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import type { RouteLocationNormalizedLoaded } from 'vue-router'
  import { Close, RefreshRight, CircleClose, Back, Right } from '@element-plus/icons-vue'
  import { ROUTES } from '../../router'
  import ScrollPane from './ScrollPane.vue'

  interface TagView {
    path: string
    fullPath: string
    name: string | symbol | undefined
    query: Record<string, any>
    meta: Record<string, any>
    title: string
  }

  const { proxy } = getCurrentInstance()!
  const route = useRoute()
  const router = useRouter()

  const visible = ref<boolean>(false)
  const top = ref<number>(0)
  const left = ref<number>(0)
  const selectedTag = ref<TagView>({} as TagView)
  const scrollPaneRef = ref<InstanceType<typeof ScrollPane> | null>(null)
  const tagsIcon = ref<boolean>(false)
  const visitedViews = ref<TagView[]>([])

  function createTag(r: Record<string, any>): TagView {
    return {
      path: r.path,
      fullPath: r.fullPath || r.path,
      name: r.name,
      query: r.query || {},
      meta: r.meta ? { ...r.meta } : {},
      title: r.meta?.title || String(r.name || r.path),
    }
  }

  function isActive(r: TagView): boolean {
    return r.path === route.path
  }

  function isAffix(tag: TagView): boolean {
    return tag.meta && tag.meta.affix
  }

  function isFirstView(): boolean {
    try {
      return selectedTag.value.fullPath === visitedViews.value[0]?.fullPath
    } catch {
      return false
    }
  }

  function isLastView(): boolean {
    try {
      return (
        selectedTag.value.fullPath === visitedViews.value[visitedViews.value.length - 1]?.fullPath
      )
    } catch {
      return false
    }
  }

  function addView(r: RouteLocationNormalizedLoaded): void {
    if (!r.name || !r.meta?.title || r.meta?.hidden) return
    const exists = visitedViews.value.some((v) => v.path === r.path)
    if (!exists) {
      visitedViews.value.push(createTag(r))
    }
  }

  function removeView(tag: TagView): void {
    const idx = visitedViews.value.findIndex((v) => v.path === tag.path)
    if (idx > -1) {
      visitedViews.value.splice(idx, 1)
    }
  }

  function initTags(): void {
    const dashboardRoute = router.getRoutes().find((r) => r.path === ROUTES.dashboard)
    if (dashboardRoute) {
      visitedViews.value.push(
        createTag({
          ...dashboardRoute,
          fullPath: dashboardRoute.path,
          query: {},
          meta: { ...dashboardRoute.meta, affix: true },
        }),
      )
    }
  }

  function moveToCurrentTag(): void {
    nextTick(() => {
      for (const r of visitedViews.value) {
        if (r.path === route.path) {
          scrollPaneRef.value?.moveToTarget(r)
        }
      }
    })
  }

  function toLastView(views: TagView[], view?: TagView): void {
    const latestView = views.slice(-1)[0]
    if (latestView) {
      router.push(latestView.fullPath)
    } else {
      router.push('/')
    }
  }

  function refreshSelectedTag(view: TagView): void {
    const { fullPath } = view
    nextTick(() => {
      router.replace({ path: fullPath })
    })
  }

  function closeSelectedTag(view: TagView): void {
    if (isAffix(view)) return
    removeView(view)
    if (isActive(view)) {
      toLastView(visitedViews.value, view)
    }
  }

  function closeRightTags(): void {
    const idx = visitedViews.value.findIndex((v) => v.path === selectedTag.value.path)
    visitedViews.value = visitedViews.value.filter((v, i) => i <= idx || isAffix(v))
    if (!visitedViews.value.find((v) => v.path === route.path)) {
      toLastView(visitedViews.value)
    }
  }

  function closeLeftTags(): void {
    const idx = visitedViews.value.findIndex((v) => v.path === selectedTag.value.path)
    visitedViews.value = visitedViews.value.filter((v, i) => i >= idx || isAffix(v))
    if (!visitedViews.value.find((v) => v.path === route.path)) {
      toLastView(visitedViews.value)
    }
  }

  function closeOthersTags(): void {
    router.push(selectedTag.value as any).catch(() => {})
    visitedViews.value = visitedViews.value.filter(
      (v) => isAffix(v) || v.path === selectedTag.value.path,
    )
    moveToCurrentTag()
  }

  function closeAllTags(view: TagView): void {
    visitedViews.value = visitedViews.value.filter((v) => isAffix(v))
    if (visitedViews.value.some((v) => v.path === route.path)) return
    toLastView(visitedViews.value, view)
  }

  function openMenu(tag: TagView, e: MouseEvent): void {
    const menuMinWidth = 105
    const offsetLeft = (proxy as any).$el.getBoundingClientRect().left
    const offsetWidth = (proxy as any).$el.offsetWidth
    const maxLeft = offsetWidth - menuMinWidth
    const l = e.clientX - offsetLeft + 15

    if (l > maxLeft) {
      left.value = maxLeft
    } else {
      left.value = l
    }

    top.value = e.clientY
    visible.value = true
    selectedTag.value = tag
  }

  function closeMenu(): void {
    visible.value = false
  }

  function handleScroll(): void {
    closeMenu()
  }

  watch(route, () => {
    addView(route)
    moveToCurrentTag()
  })

  watch(visible, (value: boolean) => {
    if (value) {
      document.body.addEventListener('click', closeMenu)
    } else {
      document.body.removeEventListener('click', closeMenu)
    }
  })

  onMounted(() => {
    initTags()
    addView(route)
  })
</script>

<style lang="scss" scoped>
  .tags-view-container {
    height: 30px;
    width: 100%;
    background: var(--color-background-base);
    border-bottom: 1px solid var(--color-border-base);
    box-shadow:
      0 1px 3px 0 rgba(0, 0, 0, 0.12),
      0 0 3px 0 rgba(0, 0, 0, 0.04);

    .tags-view-wrapper {
      .tags-view-item {
        display: inline-block;
        position: relative;
        cursor: pointer;
        height: 30px;
        line-height: 30px;
        border-right: 1px solid var(--color-border-base);
        color: var(--color-text-title);
        background: var(--color-background-base);
        padding: 0 10px;
        font-size: var(--font-size-micro);
        font-weight: bold;

        &:hover {
          background-color: var(--select-color-hover) !important;
          color: var(--color-text-title);
        }

        &:last-of-type {
          margin-right: 15px;
        }

        &.active {
          background-color: var(--color-primary) !important;
          color: var(--color-white);
          border-color: var(--color-primary) !important;
        }
      }
    }

    .tags-view-item.active.has-icon::before {
      content: none !important;
    }

    .contextmenu {
      margin: 0;
      background: var(--color-background-base);
      z-index: 3000;
      position: absolute;
      list-style-type: none;
      padding: 5px 0;
      border-radius: var(--radius-base);
      font-size: var(--font-size-micro);
      font-weight: 400;
      color: var(--color-text-title);
      box-shadow: 2px 2px 3px 0 rgba(0, 0, 0, 0.3);
      border: 1px solid var(--color-border-base);

      li {
        margin: 0;
        padding: 7px 16px;
        cursor: pointer;

        &:hover {
          background: var(--select-color-hover);
        }
      }
    }
  }
</style>

<style lang="scss">
  //reset element css of el-icon-close
  .tags-view-wrapper {
    .tags-view-item {
      .el-icon-close {
        width: 16px;
        height: 16px;
        vertical-align: 2px;
        border-radius: 50%;
        text-align: center;
        transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
        transform-origin: 100% 50%;

        &:before {
          transform: scale(0.6);
          display: inline-block;
          vertical-align: -3px;
        }

        &:hover {
          color: var(--color-danger);
          width: 12px !important;
          height: 12px !important;
        }
      }
    }
  }
</style>
