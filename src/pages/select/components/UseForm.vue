<template>
    <PortalForm :model="ruleForm" :rules="rules" :error-fields="['name', 'region', 'type', 'desc']" @submit="onSubmit"
        @submit-error="onSubmitError" @reset="onReset">
        <template #default="{ errorClass }">
            <el-form-item :label="t('demo.form_activity_name')" prop="name" :class="errorClass('name')">
                <PortalInput class="input-box input-width" v-model="ruleForm.name" />
            </el-form-item>
            <el-form-item :label="t('demo.form_activity_zone')" prop="region" :class="errorClass('region')">
                <PortalSelect class="input-width" v-model="ruleForm.region" :placeholder="t('demo.form_activity_zone')"
                    :options="regionOptions" />
            </el-form-item>
            <el-form-item :label="t('demo.form_instant_delivery')" prop="delivery">
                <PortalSwitch v-model="ruleForm.delivery" />
            </el-form-item>
            <el-form-item :label="t('demo.form_activity_type')" prop="type" :class="errorClass('type')">
                <PortalCheckbox v-model="ruleForm.type" :options="typeOptions" name="type" />
            </el-form-item>
            <el-form-item :label="t('demo.form_resources')" prop="resource">
                <PortalRadio v-model="ruleForm.resource" :options="resourceOptions" />
            </el-form-item>
            <el-form-item :label="t('demo.form_activity_form')" prop="desc" :class="errorClass('desc')">
                <PortalInput class="input-width" v-model="ruleForm.desc" type="textarea" style="width: 300px;" />
            </el-form-item>
        </template>
        <template #footer="{ submit, reset }">
            <div class="row-flex">
                <PortalButton type="form" color="default" @click="submit">{{ t('common.submit') }}</PortalButton>
                <PortalButton type="form" color="dark" @click="reset">{{ t('common.reset') }}</PortalButton>
            </div>
        </template>
    </PortalForm>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from '@/i18n'
import PortalForm from '@/components/PortalForm.vue'
import PortalInput from '@/components/PortalInput.vue'
import PortalSelect from '@/components/PortalSelect.vue'
import PortalCheckbox from '@/components/PortalCheckbox.vue'
import PortalRadio from '@/components/PortalRadio.vue'
import PortalSwitch from '@/components/PortalSwitch.vue'
import {
    PortalButton,
} from '@/components'

const { t } = useI18n()

const ruleForm = reactive({
    name: '',
    region: '',
    delivery: false,
    type: [] as string[],
    resource: '',
    desc: '',
})

const typeOptions = [
    { label: t('demo.form_online_activities'), value: 'Online activities' },
    { label: t('demo.form_promotion_activities'), value: 'Promotion activities' },
]

const resourceOptions = [
    { label: t('demo.form_sponsorship'), value: 'Sponsorship' },
    { label: t('demo.form_venue'), value: 'Venue' },
]

const regionOptions = [
    { label: t('demo.form_zone_one'), value: 'shanghai' },
    { label: t('demo.form_zone_two'), value: 'beijing' },
]

const rules = reactive({
    name: [
        { required: true, message: t('demo.form_rule_name_required'), trigger: 'blur' },
        { min: 3, max: 5, message: t('demo.form_rule_name_length'), trigger: 'blur' },
    ],
    region: [
        {
            required: true,
            message: t('demo.form_rule_zone_required'),
            trigger: 'change',
        },
    ],
    type: [
        {
            type: 'array',
            required: true,
            message: t('demo.form_rule_type_required'),
            trigger: 'change',
        },
    ],
    resource: [
        {
            required: false,
            message: t('demo.form_rule_resource_required'),
            trigger: 'change',
        },
    ],
    desc: [
        { required: true, message: t('demo.form_rule_desc_required'), trigger: 'blur' },
    ],
})

const onSubmit = (model: Record<string, any>) => {
    console.log('submit!', model)
}

const onSubmitError = (fields?: Record<string, any>) => {
    console.log('error submit!', fields)
}

const onReset = () => {
    console.log('reset!')
}
</script>

<style lang="scss" scoped>
.input-width {
    width: 300px;
}

.row-flex {
    display: flex;
    gap: 20px
}
</style>
