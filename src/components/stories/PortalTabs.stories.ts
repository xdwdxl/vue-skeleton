import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import PortalTabs from '../PortalTabs.vue'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'details', label: 'Details' },
  { id: 'settings', label: 'Settings' },
  { id: 'history', label: 'History' },
]

const meta: Meta<typeof PortalTabs> = {
  title: 'Components/PortalTabs',
  component: PortalTabs,
  tags: ['autodocs'],
  argTypes: {
    tabType: { control: 'select', options: ['page', 'section'] },
    showContent: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof PortalTabs>

export const PageTabs: Story = {
  render: () => ({
    components: { PortalTabs },
    setup() { const active = ref('overview'); return { active, tabs } },
    template: `
      <PortalTabs v-model="active" :tabs="tabs" tab-type="page">
        <template #overview>Overview content</template>
        <template #details>Details content</template>
        <template #settings>Settings content</template>
        <template #history>History content</template>
      </PortalTabs>
    `,
  }),
}

export const SectionTabs: Story = {
  render: () => ({
    components: { PortalTabs },
    setup() { const active = ref('overview'); return { active, tabs } },
    template: `
      <PortalTabs v-model="active" :tabs="tabs" tab-type="section">
        <template #overview>Overview content</template>
        <template #details>Details content</template>
        <template #settings>Settings content</template>
        <template #history>History content</template>
      </PortalTabs>
    `,
  }),
}

export const NoContent: Story = {
  render: () => ({
    components: { PortalTabs },
    setup() { const active = ref('overview'); return { active, tabs } },
    template: '<PortalTabs v-model="active" :tabs="tabs" :show-content="false" />',
  }),
}

export const WithDisabledTab: Story = {
  render: () => ({
    components: { PortalTabs },
    setup() {
      const active = ref('overview')
      const tabsWithDisabled = [...tabs.slice(0, 2), { id: 'disabled', label: 'Disabled', disabled: true }, tabs[3]]
      return { active, tabsWithDisabled }
    },
    template: '<PortalTabs v-model="active" :tabs="tabsWithDisabled" />',
  }),
}
