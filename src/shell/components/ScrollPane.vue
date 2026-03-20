<template>
  <el-scrollbar
    ref="scrollContainer"
    :vertical="false"
    class="scroll-container"
    @wheel.prevent="handleScroll"
  >
    <slot />
  </el-scrollbar>
</template>

<script lang="ts" setup>
  import { ref, computed, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue'

  const emits = defineEmits<{
    (e: 'scroll'): void
  }>()

  const { proxy } = getCurrentInstance()!
  const tagAndTagSpacing = ref<number>(4)

  const scrollWrapper = computed<HTMLElement>(
    () => (proxy as any).$refs.scrollContainer.$refs.wrapRef,
  )

  function handleScroll(e: WheelEvent): void {
    const eventDelta = (e as any).wheelDelta || -e.deltaY * 40
    const $scrollWrapper = scrollWrapper.value
    $scrollWrapper.scrollLeft = $scrollWrapper.scrollLeft + eventDelta / 4
  }

  const emitScroll = (): void => {
    emits('scroll')
  }

  interface TagItem {
    path: string
    [key: string]: any
  }

  function moveToTarget(currentTag: TagItem): void {
    const $container = (proxy as any).$refs.scrollContainer.$el as HTMLElement
    const $containerWidth = $container.offsetWidth
    const $scrollWrapper = scrollWrapper.value
    const tagListDom = document.getElementsByClassName('tags-view-item')

    for (let i = 0; i < tagListDom.length; i++) {
      const el = tagListDom[i] as HTMLElement
      if (el.dataset.path === currentTag.path) {
        if (el.offsetLeft < $scrollWrapper.scrollLeft) {
          $scrollWrapper.scrollLeft = el.offsetLeft - tagAndTagSpacing.value
        } else if (el.offsetLeft + el.offsetWidth > $scrollWrapper.scrollLeft + $containerWidth) {
          $scrollWrapper.scrollLeft =
            el.offsetLeft + el.offsetWidth - $containerWidth + tagAndTagSpacing.value
        }
        break
      }
    }
  }

  defineExpose({
    moveToTarget,
  })

  onMounted(() => {
    scrollWrapper.value.addEventListener('scroll', emitScroll, true)
  })

  onBeforeUnmount(() => {
    scrollWrapper.value.removeEventListener('scroll', emitScroll)
  })
</script>

<style lang="scss" scoped>
  .scroll-container {
    white-space: nowrap;
    position: relative;
    overflow: hidden;
    width: 100%;
    :deep(.el-scrollbar__bar) {
      bottom: 0px;
    }
    :deep(.el-scrollbar__wrap) {
      height: 39px;
    }
  }
</style>
