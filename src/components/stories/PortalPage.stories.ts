import type { Meta, StoryObj } from '@storybook/vue3'
import PortalPage from '../PortalPage.vue'

const meta: Meta<typeof PortalPage> = {
  title: 'Components/PortalPage',
  component: PortalPage,
  tags: ['autodocs'],
  argTypes: {
    overflow: { control: 'select', options: ['auto', 'hidden', 'scroll', 'visible'] },
    bordered: { control: 'boolean' },
    shadow: { control: 'boolean' },
    loading: { control: 'boolean' },
    fullHeight: { control: 'boolean' },
    direction: { control: 'select', options: ['', 'row', 'column'] },
  },
}
export default meta

type Story = StoryObj<typeof PortalPage>

export const Default: Story = {
  render: () => ({
    components: { PortalPage },
    template: `
      <PortalPage :full-height="false" padding="20px" min-height="200px">
        <p>Page content goes here</p>
      </PortalPage>
    `,
  }),
}

export const WithHeaderFooter: Story = {
  render: () => ({
    components: { PortalPage },
    template: `
      <PortalPage :full-height="false" padding="20px" min-height="300px" :bordered="true">
        <template #header><h3 style="margin:0">Page Header</h3></template>
        <p>Main page content</p>
        <template #footer><div style="text-align:right">Footer actions</div></template>
      </PortalPage>
    `,
  }),
}

export const Loading: Story = {
  render: () => ({
    components: { PortalPage },
    template: `
      <PortalPage :full-height="false" min-height="200px" :loading="true" padding="20px">
        <p>Content is loading...</p>
      </PortalPage>
    `,
  }),
}

export const FlexLayout: Story = {
  render: () => ({
    components: { PortalPage },
    template: `
      <PortalPage :full-height="false" direction="row" gap="16px" padding="20px" min-height="200px" :bordered="true">
        <div style="flex:1; background:#f0f0f0; padding:16px;">Panel 1</div>
        <div style="flex:1; background:#e0e0e0; padding:16px;">Panel 2</div>
        <div style="flex:1; background:#d0d0d0; padding:16px;">Panel 3</div>
      </PortalPage>
    `,
  }),
}
