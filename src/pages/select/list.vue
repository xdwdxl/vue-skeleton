<template>
    <PortalPage>
        <!-- Row 1: Basic controls (3-column) -->
        <el-row :gutter="20">
            <el-col :span="8">
                <div class="com-title">{{ t('demo.progress_bars') }}</div>
                <PortalProgressBars class="progress-item" type="slider" :percentage="30" />
                <PortalProgressBars class="progress-item" type="bar" :percentage="75" />
                <PortalProgressBars class="progress-item" type="steps" :steps="[1, 2, 3, 4]" :currentStep="2" />
                <PortalProgressBars class="progress-item" type="circle" :percentage="75"
                    color="var(--color-secondary)" />
                <div class="com-title">{{ t('demo.alerts') }}</div>
                <PortalAlerts class="alerts-item" type="warning" :title="t('demo.alert_warning')" />
                <PortalAlerts class="alerts-item" type="success" :title="t('demo.alert_success')" />
                <PortalAlerts class="alerts-item" type="error" :title="t('demo.alert_error')" />
                <div class="com-title">{{ t('demo.tooltip') }}</div>
                <div class="tool-tip-box">
                    <PortalToolTip :content="t('demo.tooltip_content')" placement="bottom-start">
                        <el-button type="primary">{{ t('demo.dark') }}</el-button>
                    </PortalToolTip>
                    <PortalToolTip effect="light" :content="t('demo.tooltip_content')" placement="bottom-start">
                        <el-button type="primary">{{ t('demo.light') }}</el-button>
                    </PortalToolTip>
                </div>
                <div class="com-title">{{ t('demo.tree') }}</div>
                <PortalTree :data="treeData" />
            </el-col>
            <el-col :span="8">
                <div class="com-title">{{ t('demo.input') }}</div>
                <PortalInput class="input-item" v-model="inputVal" clearable />
                <PortalInput class="input-item" v-model="numVal" type="number" :min="1" :max="10" />
                <PortalInput class="input-item" v-model="textareaVal" type="textarea" />
                <div class="com-title">{{ t('demo.search') }}</div>
                <PortalSearch class="search-item" variant="underline" />
                <PortalSearch class="search-item" variant="append" />
                <PortalSearch class="search-item" />
                <div class="com-title">{{ t('demo.select') }}</div>
                <PortalSelect class="input-item" v-model="selectVal" :options="selectOptions" />
                <PortalSelect class="input-item" v-model="multiSelectVal" :options="selectOptions" multiple
                    collapse-tags />
                <div class="com-title">Date Picker</div>
                <PortalDatePicker class="input-item" v-model="selectedDate" @change="(v: any) => log('date', v)" />
            </el-col>
            <el-col :span="8">
                <div class="com-title">{{ t('demo.checkbox_radio') }}</div>
                <PortalCheckbox class="checkbox-item" v-model="checkboxVal" :options="checkboxOptions" name="type" />
                <PortalRadio class="checkbox-item" v-model="radioVal" :options="radioOptions" />
                <div class="com-title">{{ t('demo.switch') }}</div>
                <PortalSwitch class="checkbox-item" v-model="switchVal" :left-label="t('demo.label_1')"
                    :right-label="t('demo.label_2')" />
                <div class="com-title">{{ t('demo.form') }}</div>
                <UseForm />
            </el-col>
        </el-row>

        <!-- Row 2: Buttons -->
        <el-row :gutter="20" class="section-row">
            <el-col :span="12">
                <div class="com-title">Form Buttons</div>
                <div class="btn-row">
                    <PortalButton type="form" color="default">Default</PortalButton>
                    <PortalButton type="form" color="dark">Dark</PortalButton>
                    <PortalButton type="form" color="white">White</PortalButton>
                    <PortalButton type="form" color="danger">Danger</PortalButton>
                    <PortalButton type="form" color="success">Success</PortalButton>
                    <PortalButton type="form" color="info">Info</PortalButton>
                    <PortalButton type="form" color="warning">Warning</PortalButton>
                </div>
            </el-col>
            <el-col :span="12">
                <div class="com-title">Square Icon Buttons</div>
                <div v-for="sz in squareSizes" :key="sz.size" class="size-group">
                    <span class="size-label">{{ sz.label }}</span>
                    <div class="icon-buttons">
                        <PortalButton v-for="btn in squareButtons" :key="btn.color" type="square" :size="sz.size"
                            :color="btn.color">
                            <ElIcon>
                                <component :is="btn.icon" />
                            </ElIcon>
                        </PortalButton>
                    </div>
                </div>
            </el-col>
        </el-row>

        <!-- Row 3: Cards -->
        <el-row :gutter="20" class="section-row">
            <el-col :span="8">
                <div class="com-title">Card with Actions</div>
                <PortalCard title="Card with Actions" :showView="true" :showAdd="true" :showEdit="true"
                    :showDelete="true" buttonType="actions">
                    <p>This is a card with action buttons.</p>
                </PortalCard>
            </el-col>
            <el-col :span="8">
                <div class="com-title">Card with Form</div>
                <PortalCard title="Card with Form" buttonType="form">
                    <p>This is a card with form buttons.</p>
                </PortalCard>
            </el-col>
            <el-col :span="8">
                <div class="com-title">Card with Download</div>
                <PortalCard title="Card with Download" buttonType="downLoad">
                    <p>This is a card with download button.</p>
                </PortalCard>
            </el-col>
        </el-row>

        <!-- Row 4: Paging -->
        <div class="com-title section-row">Paging</div>
        <PortalPaging :total="12345" :page="currentPage" :limit="pageSize" @update:page="currentPage = $event"
            @update:limit="pageSize = $event" />

        <!-- Row 5: Tabs -->
        <el-row :gutter="20" class="section-row">
            <el-col :span="12">
                <div class="com-title">Page Tab</div>
                <PortalTabs v-model="activePageTab" :tabs="pageTabs" tabType="page" :showContent="false" />
                <div class="com-title">Page Tab (Disabled)</div>
                <PortalTabs v-model="activePageTabDisabled" :tabs="pageTabsDisabled" tabType="page"
                    :showContent="false" />
            </el-col>
            <el-col :span="12">
                <div class="com-title">Section Tab</div>
                <PortalTabs v-model="activeSectionTab" :tabs="sectionTabs" tabType="section" :showContent="false" />
                <div class="com-title">Section Tab (Scrollable)</div>
                <div style="width: 400px;">
                    <PortalTabs v-model="activeScrollTab" :tabs="scrollableSectionTabs" tabType="section"
                        :showContent="false" />
                </div>
            </el-col>
        </el-row>

        <!-- Row 6: Step -->
        <div class="com-title section-row">Step</div>
        <PortalStep v-model="currentStep" :steps="stepItems" />

        <!-- Row 7: Time Setting -->
        <div class="com-title section-row">Time Setting</div>
        <div style="max-width: 600px;">
            <PortalTimeSetting v-model="timeSettingValue" />
        </div>

        <!-- Row 8: List -->
        <div class="com-title section-row">List</div>
        <PortalList
            title="Demo Title"
            :columns="listColumns"
            :data="listData"
            :total="listData.length"
            :showSelection="false"
            :showOperation="true"
            :showColumns="true"
            :showPagination="true"
            :operationWidth="80"
            searchPlaceholder="Search"
            @row-dblclick="startEdit"
        >
            <!-- Col1: select dropdown in edit mode -->
            <template #col1-cell="{ row }">
                <PortalSelect v-if="editingRowId === row.id" v-model="editDraft.col1" :options="col1Options" size="small" />
                <span v-else>{{ row.col1 }}</span>
            </template>

            <!-- Col2: input in edit mode -->
            <template #col2-cell="{ row }">
                <PortalInput v-if="editingRowId === row.id" v-model="editDraft.col2" size="small" />
                <span v-else>{{ row.col2 }}</span>
            </template>

            <!-- Col3: input in edit mode -->
            <template #col3-cell="{ row }">
                <PortalInput v-if="editingRowId === row.id" v-model="editDraft.col3" size="small" />
                <span v-else>{{ row.col3 }}</span>
            </template>

            <!-- Confirm / Cancel buttons -->
            <template #operation="{ row }">
                <template v-if="editingRowId === row.id">
                    <PortalButton type="square" size="md" color="success" @click="confirmEdit"><ElIcon><Check /></ElIcon></PortalButton>
                    <PortalButton type="square" size="md" color="danger" @click="cancelEdit"><ElIcon><Close /></ElIcon></PortalButton>
                </template>
            </template>

            <template #footer-actions>
                <PortalButton type="square" size="sm" color="success"><ElIcon><Plus /></ElIcon></PortalButton>
                <PortalButton type="square" size="sm" color="info"><ElIcon><Edit /></ElIcon></PortalButton>
                <PortalButton type="square" size="sm" color="danger"><ElIcon><Delete /></ElIcon></PortalButton>
            </template>
        </PortalList>

        <!-- Row 9: Dialogs -->
        <div class="com-title section-row">Dialog</div>
        <div class="btn-row">
            <ElButton type="primary" @click="showFormDialog = true">Form Dialog</ElButton>
            <ElButton type="primary" @click="showOptionDialog = true">Option Dialog</ElButton>
            <ElButton type="primary" @click="showLeaveDialog = true">Leave Check</ElButton>
            <ElButton type="primary" @click="showMessageDialog = true">Message Dialog</ElButton>
            <ElButton type="primary" @click="showListDialog = true">List Dialog</ElButton>
        </div>

        <BaseDialog v-model="showFormDialog" title="New User" width="520px">
            <div class="demo-form">
                <div class="demo-form__row"><label class="demo-form__label">Active</label><input type="checkbox"
                        class="demo-form__checkbox" /></div>
                <div class="demo-form__row"><label class="demo-form__label">Username</label><input type="text"
                        class="demo-form__input" /></div>
                <div class="demo-form__row"><label class="demo-form__label">Password</label><input type="password"
                        class="demo-form__input" /></div>
                <div class="demo-form__row"><label class="demo-form__label">First Name</label><input type="text"
                        class="demo-form__input" /></div>
                <div class="demo-form__row"><label class="demo-form__label">Last Name</label><input type="text"
                        class="demo-form__input" /></div>
                <div class="demo-form__row"><label class="demo-form__label">E-mail</label><input type="text"
                        class="demo-form__input" /></div>
            </div>
        </BaseDialog>

        <OptionDialog v-model="showOptionDialog" title="Option" message="Do you want to edit or open it?"
            :buttons="[{ label: 'Edit', action: 'edit' }, { label: 'Open', action: 'open' }]" />

        <OptionDialog v-model="showLeaveDialog" title="Leave Check"
            message="Do you want to leave this page without save?"
            :buttons="[{ label: 'Edit', action: 'edit' }, { label: 'Open', action: 'open' }]" />

        <MessageDialog v-model="showMessageDialog" title="This is Title"
            message="Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." />

        <ListDialog v-model="showListDialog" title="List Dialog" width="640px"
            :list-props="{ columns: dialogListColumns, data: dialogListData, total: dialogListData.length, showSelection: true, showSearch: true, showColumns: true, showPagination: true }" />
    </PortalPage>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from '@/i18n'
import { ElIcon, ElButton } from 'element-plus'
import { Close, Plus, Edit, Delete, Search, Check } from '@element-plus/icons-vue'
import PortalPage from '@/components/PortalPage.vue'
import PortalProgressBars from '@/components/PortalProgressBars.vue'
import PortalAlerts from '@/components/PortalAlerts.vue'
import PortalToolTip from '@/components/PortalToolTip.vue'
import PortalTree from '@/components/PortalTree.vue'
import PortalSearch from '@/components/PortalSearch.vue'
import PortalSelect from '@/components/PortalSelect.vue'
import PortalCheckbox from '@/components/PortalCheckbox.vue'
import PortalRadio from '@/components/PortalRadio.vue'
import PortalSwitch from '@/components/PortalSwitch.vue'
import UseForm from './components/UseForm.vue'
import {
    PortalInput,
    PortalButton,
    PortalCard,
    PortalPaging,
    PortalList,
    PortalStep,
    PortalTabs,
    PortalTimeSetting,
    PortalDatePicker,
} from '@/components'
import { BaseDialog, OptionDialog, MessageDialog, ListDialog } from '@/dialog'
import type { TimeSettingValue } from '@/components/PortalTimeSetting.vue'
import type { CheckboxOption, TreeNode, SelectOption, RadioOption } from '@/types/components'

const { t } = useI18n()
const log = (tag: string, v: unknown) => console.log(`[${tag}]`, v)

// ── Basic controls ──
const inputVal = ref('')
const numVal = ref(1)
const textareaVal = ref('')
const selectVal = ref('')
const multiSelectVal = ref<string[]>([])

const checkboxVal = ref<string[]>([])
const radioVal = ref('')
const switchVal = ref(false)
const selectedDate = ref<string | null>(null)

const selectOptions: SelectOption[] = [
    { value: 'Option1', label: 'Option1' },
    { value: 'Option2', label: 'Option2' },
    { value: 'Option3', label: 'Option3' },
    { value: 'Option4', label: 'Option4' },
    { value: 'Option5', label: 'Option5' },
]

const radioOptions: RadioOption[] = [
    { label: t('demo.form_sponsorship'), value: 'sponsorship' },
    { label: t('demo.form_venue'), value: 'venue' },
]

const checkboxOptions: CheckboxOption[] = [
    { label: t('demo.form_online_activities'), value: 'online' },
    { label: t('demo.form_promotion_activities'), value: 'promotion' },
    { label: t('demo.form_offline_activities'), value: 'offline' },
]

const treeData: TreeNode[] = [
    { label: 'Level one 1', children: [{ label: 'Level two 1-1', children: [{ label: 'Level three 1-1-1' }] }] },
    { label: 'Level one 2', children: [{ label: 'Level two 2-1', children: [{ label: 'Level three 2-1-1' }] }, { label: 'Level two 2-2', children: [{ label: 'Level three 2-2-1' }] }] },
    { label: 'Level one 3', children: [{ label: 'Level two 3-1', children: [{ label: 'Level three 3-1-1' }] }, { label: 'Level two 3-2', children: [{ label: 'Level three 3-2-1' }] }] },
]

// ── Buttons ──
const squareSizes: { size: 'sm' | 'md' | 'lg'; label: string }[] = [
    { size: 'lg', label: '30×30' },
    { size: 'md', label: '25×25' },
    { size: 'sm', label: '20×20' },
]
const squareButtons: { color: 'primary' | 'danger' | 'success' | 'info'; icon: typeof Close }[] = [
    { color: 'danger', icon: Close },
    { color: 'success', icon: Plus },
    { color: 'info', icon: Edit },
    { color: 'danger', icon: Delete },
    { color: 'primary', icon: Search },
]

// ── Paging ──
const currentPage = ref(0)
const pageSize = ref(25)

// ── Tabs ──
const activePageTab = ref('overview')
const pageTabs = ref([{ id: 'overview', label: 'Overview' }, { id: 'detail', label: 'Detail' }])
const activePageTabDisabled = ref('overview')
const pageTabsDisabled = ref([{ id: 'overview', label: 'Overview' }, { id: 'detail', label: 'Detail', disabled: true }])
const activeSectionTab = ref('more')
const sectionTabs = ref([
    { id: 'more', label: 'More Information' }, { id: 'statistics', label: 'Statistics' },
    { id: 'document', label: 'Document' }, { id: 'history', label: 'History Detail' }, { id: 'gdpr', label: 'GDPR' },
])
const activeScrollTab = ref('more')
const scrollableSectionTabs = ref([
    ...sectionTabs.value, { id: 'settings', label: 'Settings' }, { id: 'logs', label: 'Logs' },
])

// ── Step ──
const currentStep = ref(1)
const stepItems = ref([{ id: 1, label: 'step 1' }, { id: 2, label: 'step 2' }, { id: 3, label: 'step 3' }, { id: 4, label: 'step 4' }])

// ── Time Setting ──
const timeSettingValue = ref<TimeSettingValue>({
    frequency: 'minutely', interval: 1,
    startEnabled: false, startTime: '00:00', endEnabled: false, endTime: '00:00',
})

// ── List ──
const listColumns = ref([
    { prop: 'col1', label: 'List Title1', visible: true, sortable: true, template: 'col1-cell' },
    { prop: 'col2', label: 'List Title2', visible: true, sortable: true, template: 'col2-cell' },
    { prop: 'col3', label: 'List Title3', visible: true, sortable: true, template: 'col3-cell' },
])
const listData = ref([
    { id: 1, col1: 'fdsafdsa', col2: '123124', col3: 'fdsafdsa' },
    { id: 2, col1: 'fdsafdsa', col2: '123124', col3: 'fdsafdsa' },
    { id: 3, col1: 'fdsafdsa', col2: '436346', col3: 'fdsafdsa' },
    { id: 4, col1: 'fdsafdsa', col2: '436346', col3: 'fdsafdsa' },
    { id: 5, col1: 'fdsafdsa', col2: '674964', col3: 'fdsafdsa' },
])
const col1Options: SelectOption[] = [
    { value: 'fdsafdsa', label: 'fdsafdsa' },
    { value: 'abcdefg', label: 'abcdefg' },
    { value: 'hijklmn', label: 'hijklmn' },
]

// ── Inline editing (page-layer business logic) ──
const editingRowId = ref<number | null>(null)
const editDraft = ref<Record<string, any>>({})

const startEdit = (row: any) => {
    editingRowId.value = row.id
    editDraft.value = { ...row }
}

const confirmEdit = () => {
    const idx = listData.value.findIndex(r => r.id === editingRowId.value)
    if (idx !== -1) Object.assign(listData.value[idx], editDraft.value)
    editingRowId.value = null
}

const cancelEdit = () => {
    editingRowId.value = null
}

// ── Dialogs ──
const showFormDialog = ref(false)
const showOptionDialog = ref(false)
const showLeaveDialog = ref(false)
const showMessageDialog = ref(false)
const showListDialog = ref(false)

const dialogListColumns = ref([
    { prop: 'col1', label: 'Title 1', visible: true },
    { prop: 'col2', label: 'Title 2', visible: true },
    { prop: 'col3', label: 'Title 3', visible: true },
])
const dialogListData = ref([
    { id: 1, col1: 'Content1', col2: 'Content1', col3: 'Content1' },
    { id: 2, col1: 'Content2', col2: 'Content2', col3: 'Content2' },
    { id: 3, col1: 'Content3', col2: 'Content3', col3: 'Content3' },
    { id: 4, col1: 'Content4', col2: 'Content4', col3: 'Content4' },
])
</script>

<style lang="scss" scoped>
.tool-tip-box {
    display: flex;
    gap: 40px;
}

.progress-item,
.alerts-item {
    width: 500px;
    margin-top: 40px;
}

.search-item,
.input-item {
    margin-top: 40px;
    width: 300px;
}

.com-title {
    margin: 40px 0 var(--spacing-lg-minus) 0;
}

.checkbox-item {
    margin-top: 20px;
}

.section-row {
    margin-top: 60px;
}

.btn-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.size-group {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
}

.size-label {
    width: 80px;
    font-size: var(--font-size-tiny);
    color: var(--color-text-title);
}

.icon-buttons {
    display: flex;
    gap: 10px;
}

.demo-form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg-plus);
}

.demo-form__row {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs-plus);
}

.demo-form__label {
    width: 80px;
    flex-shrink: 0;
    font-size: var(--font-size-mini);
    font-family: var(--font-family-regular);
    color: var(--color-text-title);
}

.demo-form__input {
    flex: 1;
    height: 28px;
    padding: 0 var(--spacing-sm);
    border: 1px solid var(--color-border-base);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-mini);
    font-family: var(--font-family-regular);
    color: var(--color-text-title);
    outline: none;
    background: var(--color-background-base);

    &:focus {
        border-color: var(--color-primary);
    }
}

.demo-form__checkbox {
    width: var(--size-sm);
    height: var(--size-sm);
    cursor: pointer;
}
</style>
