<!--
  @file PortalCard.vue - Card container with configurable header and footer actions
  @author Cooper Wang
  @date 2026-03-13
  @description Wraps ElCard with CRUD action buttons in footer, supporting actions/form/download button modes
-->
<template>
  <div class="card-com">
    <el-card v-bind="$attrs">
      <template #header v-if="showHeader">
        <div class="card-header">
          <div>{{ title }}</div>
          <slot name="header-extra"></slot>
        </div>
      </template>
      <div class="card-content">
        <slot></slot>
      </div>
      <template #footer v-if="showFooter">
        <div class="card-footer">
          <slot name="footer" v-if="buttonType === 'actions'">
            <div class="form-button-group">
              <PortalButton v-if="showView" type="form" color="default" @click="handleClickView">{{ $t('common.view') }}</PortalButton>
              <PortalButton v-if="showAdd" type="form" color="success" @click="handleClickAdd">{{ $t('common.add') }}</PortalButton>
              <PortalButton v-if="showEdit" type="form" color="info" @click="handleClickEdit">{{ $t('common.edit') }}</PortalButton>
              <PortalButton v-if="showDelete" type="form" color="danger" @click="handleClickDelete">{{ $t('common.delete') }}</PortalButton>
            </div>
          </slot>
          <slot name="footer" v-if="buttonType === 'form'">
            <div class="form-button-group">
              <PortalButton v-if="showCancel" type="form" color="white" @click="handleClickCancel">{{ $t('common.cancel') }}</PortalButton>
              <PortalButton v-if="showSave" type="form" color="default" @click="handleClickSave">{{ $t('common.save') }}</PortalButton>
            </div>
          </slot>
          <slot name="footer" v-if="buttonType === 'downLoad'">
            <PortalButton
              type="square"
              color="primary"
              @click="handleClickDownload"
            >
              <ElIcon>
                <Download />
              </ElIcon>
            </PortalButton>
          </slot>
        </div>
      </template>
    </el-card>
  </div>
</template>

<script setup>
import PortalButton from "./PortalButton.vue";
import { ElIcon } from "element-plus";
import { Download } from "@element-plus/icons-vue";

defineOptions({ inheritAttrs: false })

const props = defineProps({
  title: {
    type: String,
    default: "Outline",
  },
  disabledDownLoad: {
    type: Boolean,
    default: false,
  },
  disabledCancel: {
    type: Boolean,
    default: false,
  },
  disabledSave: {
    type: Boolean,
    default: false,
  },
  disabledView: {
    type: Boolean,
    default: false,
  },
  disabledAdd: {
    type: Boolean,
    default: false,
  },
  disabledEdit: {
    type: Boolean,
    default: false,
  },
  disabledDelete: {
    type: Boolean,
    default: false,
  },
  showHeader: {
    type: Boolean,
    default: true,
  },
  showFooter: {
    type: Boolean,
    default: true,
  },
  showButtons: {
    type: Boolean,
    default: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  showView: {
    type: Boolean,
    default: false,
  },
  showAdd: {
    type: Boolean,
    default: false,
  },
  showEdit: {
    type: Boolean,
    default: false,
  },
  showDelete: {
    type: Boolean,
    default: false,
  },
  showCancel: {
    type: Boolean,
    default: true,
  },
  showSave: {
    type: Boolean,
    default: true,
  },
  buttonType: {
    type: String,
    default: "actions",
  },
});

const emit = defineEmits([
  "view",
  "add",
  "edit",
  "delete",
  "cancel",
  "save",
  "download",
]);

/** @author Cooper Wang */
const handleClickDownload = () => { emit("download"); };
/** @author Cooper Wang */
const handleClickView = () => { emit("view"); };
/** @author Cooper Wang */
const handleClickAdd = () => { emit("add"); };
/** @author Cooper Wang */
const handleClickEdit = () => { emit("edit"); };
/** @author Cooper Wang */
const handleClickDelete = () => { emit("delete"); };
/** @author Cooper Wang */
const handleClickCancel = () => { emit("cancel"); };
/** @author Cooper Wang */
const handleClickSave = () => { emit("save"); };
</script>

<style scoped>
.card-com {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    div {
      margin: 0;
      font-size: var(--font-size-mini);
      font-weight: var(--font-weight-primary);
      height: 40px;
      line-height: 40px;
    }
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    height: 40px;
  }

  .form-button-group {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--spacing-sm);
  }

  :deep(.el-card__body) {
    padding: var(--spacing-md) var(--spacing-lg) !important;
  }

  :deep(.el-card) {
    color: var(--color-text-title);
    height: calc(100vh - (164px)) !important;
  }
}
</style>
