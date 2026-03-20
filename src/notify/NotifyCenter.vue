<template>
  <span class="notify-center">
    <ElBadge
      :value="badgeValue"
      :hidden="unreadCount <= 0"
      :max="BADGE_MAX"
      class="notify-badge"
    >
      <ElButton link @click="openNotifyDrawer" class="notify-bell">
        <PortalIcon prefix="fas" name="bell" />
      </ElButton>
    </ElBadge>

    <ElDrawer
      v-model="notifyDrawerOpen"
      :title="t('notify.center.drawerTitle')"
      size="var(--notify-drawer-width)"
    >
      <div class="notify-actions">
        <ElButton
          :loading="inboxLoading"
          @click="refreshInbox(true)"
        >
          {{ t("notify.center.refresh") }}
        </ElButton>
        <ElButton
          type="primary"
          :disabled="unreadCount <= 0 || inboxLoading"
          @click="markAllRead"
        >
          {{ t("notify.center.readAll") }}
        </ElButton>
      </div>

      <ElEmpty
        v-if="!inboxLoading && inboxItems.length <= 0"
        :description="t('notify.center.empty')"
      />
      <ElScrollbar v-else height="calc(100vh - 220px)">
        <div class="notify-list">
          <button
            v-for="item in inboxItems"
            :key="item.id"
            class="notify-item"
            :class="{ 'is-unread': !item.readAt }"
            native-type="button"
            @click="openItemDialog(item)"
          >
            <span v-if="!item.readAt" class="notify-item__unread-dot" />
            <div class="notify-item__row">
              <div class="notify-item__avatar">
                <img
                  v-if="pickAvatarUrl(item)"
                  :src="pickAvatarUrl(item)"
                  alt=""
                />
                <span v-else class="notify-item__avatar-text">{{
                  pickAvatarText(item)
                }}</span>
              </div>
              <div class="notify-item__content">
                <div class="notify-item__title">
                  <span class="notify-item__title-text">{{
                    resolveTitle(item)
                  }}</span>
                  <span class="notify-item__time">{{
                    formatTime(pickDisplayTime(item))
                  }}</span>
                </div>
                <div class="notify-item__body">{{ resolveBody(item) }}</div>
                <div class="notify-item__meta">
                  <span v-if="pickSourceName(item)" class="notify-item__chip">{{
                    pickSourceName(item)
                  }}</span>
                  <span
                    v-if="pickNotifyTypeText(item)"
                    class="notify-item__chip"
                    >{{ pickNotifyTypeText(item) }}</span
                  >
                  <span
                    v-if="pickObjectIdText(item)"
                    class="notify-item__chip"
                    >{{ pickObjectIdText(item) }}</span
                  >
                  <span v-if="pickGroupName(item)" class="notify-item__chip">{{
                    pickGroupName(item)
                  }}</span>
                </div>
                <div
                  v-if="pickDisplayLines(item).length > 0"
                  class="notify-item__extra"
                >
                  <div
                    v-for="(line, idx) in pickDisplayLines(item)"
                    :key="`${item.id}-x-${idx}`"
                    class="notify-item__extra-line"
                  >
                    {{ line }}
                  </div>
                </div>
                <div
                  v-if="pickActions(item).length > 0"
                  class="notify-item__btns"
                  @click.stop
                >
                  <ElButton
                    v-for="(a, idx) in pickActions(item)"
                    :key="`${item.id}-a-${idx}`"
                    size="small"
                    link
                    @click="handleItemActionClick(item, a.action)"
                  >
                    {{ a.label }}
                  </ElButton>
                </div>
              </div>
            </div>
          </button>
        </div>
      </ElScrollbar>

      <div class="notify-footer">
        <ElButton
          v-if="nextCursor"
          size="small"
          :loading="loadMoreLoading"
          :disabled="inboxLoading"
          @click="loadMore"
        >
          {{ t("notify.center.loadMore") }}
        </ElButton>
      </div>
    </ElDrawer>

    <ElDialog
      v-model="detailDialogOpen"
      width="680px"
      :title="t('notify.center.drawerTitle')"
    >
      <div v-if="selectedItem" class="notify-detail">
        <div class="notify-detail__title">{{ resolveTitle(selectedItem) }}</div>
        <div class="notify-detail__time">
          {{ formatTime(pickDisplayTime(selectedItem)) }}
        </div>
        <div class="notify-detail__body">{{ resolveBody(selectedItem) }}</div>
        <div class="notify-detail__meta">
          <span v-if="pickSourceName(selectedItem)" class="notify-item__chip">{{
            pickSourceName(selectedItem)
          }}</span>
          <span
            v-if="pickNotifyTypeText(selectedItem)"
            class="notify-item__chip"
            >{{ pickNotifyTypeText(selectedItem) }}</span
          >
          <span
            v-if="pickObjectIdText(selectedItem)"
            class="notify-item__chip"
            >{{ pickObjectIdText(selectedItem) }}</span
          >
          <span v-if="pickGroupName(selectedItem)" class="notify-item__chip">{{
            pickGroupName(selectedItem)
          }}</span>
        </div>
        <div
          v-if="pickDisplayLines(selectedItem).length > 0"
          class="notify-detail__extra"
        >
          <div
            v-for="(line, idx) in pickDisplayLines(selectedItem)"
            :key="`${selectedItem.id}-dx-${idx}`"
            class="notify-item__extra-line"
          >
            {{ line }}
          </div>
        </div>
        <div
          v-if="pickActions(selectedItem).length > 0"
          class="notify-detail__actions"
        >
          <ElButton
            v-for="(a, idx) in pickActions(selectedItem)"
            :key="`${selectedItem.id}-da-${idx}`"
            size="small"
            @click="handleItemActionClick(selectedItem, a.action)"
          >
            {{ a.label }}
          </ElButton>
        </div>
      </div>
    </ElDialog>
  </span>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  ElBadge,
  ElButton,
  ElDialog,
  ElDrawer,
  ElEmpty,
  ElScrollbar,
} from "element-plus";
import "element-plus/es/components/badge/style/css";
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/dialog/style/css";
import "element-plus/es/components/drawer/style/css";
import "element-plus/es/components/empty/style/css";
import "element-plus/es/components/scrollbar/style/css";
import "../styles/notify-center.css";
import PortalIcon from "../components/PortalIcon.vue";
import { useI18n } from "../i18n/vue";
import { I18nManager } from "../i18n/manager";
import { initPortalRuntime } from "../runtime";
import { useNotifyCenter } from "./useNotifyCenter";

const DISPLAY_LINES_MAX = 3;

let i18n: any;
try {
  i18n = useI18n();
} catch {
  i18n = new I18nManager();
}
const t = (key: string, params?: Record<string, unknown>) =>
  i18n.t(key, params);

type InboxItem = {
  id: string;
  titleKey?: string;
  bodyKey?: string;
  params?: Record<string, unknown>;
  createdAt?: number;
  readAt?: number | null;
};

const {
  BADGE_MAX,
  badgeValue,
  formatTime,
  handleItemActionClick,
  inboxItems,
  inboxLoading,
  loadMore,
  loadMoreLoading,
  markAllRead,
  markItemRead,
  nextCursor,
  notifyDrawerOpen,
  openNotifyDrawer,
  pickActions,
  pickAvatarText,
  pickAvatarUrl,
  pickDisplayLinesFromParams,
  pickDisplayTime,
  pickGroupName,
  pickNotifyTypeText,
  pickObjectIdText,
  pickSourceName,
  refreshInbox,
  resolveBody,
  resolveTitle,
  unreadCount,
} = useNotifyCenter();

const detailDialogOpen = ref(false);
const selectedItem = ref<InboxItem | null>(null);

onMounted(() => {
  void initPortalRuntime({ enableAuthInit: true, enableNotifySse: true }).catch(
    () => {}
  );
});

function pickDisplayLines(item: {
  params?: Record<string, unknown>;
}): string[] {
  const lines = pickDisplayLinesFromParams(item?.params);
  return lines.length <= DISPLAY_LINES_MAX
    ? lines
    : lines.slice(0, DISPLAY_LINES_MAX);
}

async function openItemDialog(item: InboxItem): Promise<void> {
  if (!item?.id) return;
  if (!item.readAt) await markItemRead(item as any);
  const latest = inboxItems.value.find((x) => x.id === item.id) as any;
  selectedItem.value = (latest || item) as InboxItem;
  detailDialogOpen.value = true;
}
</script>

<style scoped>
.notify-item {
  position: relative;
}
.notify-item__unread-dot {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: var(--el-color-danger, #f56c6c);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8);
}
.notify-detail {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.notify-detail__title {
  font-size: var(--font-size-small);
  font-family: var(--font-family-semibold);
  color: var(--color-text-primary);
}
.notify-detail__time {
  font-size: var(--font-size-mini);
  color: var(--color-text-secondary);
}
.notify-detail__body {
  white-space: pre-wrap;
  line-height: 1.5;
  color: var(--color-text-primary);
}
.notify-detail__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.notify-detail__extra {
  margin-top: 4px;
}
.notify-detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}
:deep(.el-drawer__body .el-scrollbar){
      height: calc(100% - 100px);
}
.notify-bell .fas{
  color: #fff;
}
</style>
