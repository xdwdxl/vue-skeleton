import type { Meta, StoryObj } from '@storybook/vue3'
import PortalAlerts from '../PortalAlerts.vue'

const meta: Meta<typeof PortalAlerts> = {
  title: 'Components/PortalAlerts',
  component: PortalAlerts,
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['success', 'warning', 'info', 'error'] },
    effect: { control: 'select', options: ['light', 'dark'] },
    closable: { control: 'boolean' },
    showIcon: { control: 'boolean' },
    center: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof PortalAlerts>

export const Info: Story = {
  args: { title: 'Information', type: 'info', description: 'This is an informational alert.', showIcon: true },
}

export const Success: Story = {
  args: { title: 'Success', type: 'success', description: 'Operation completed successfully.', showIcon: true },
}

export const Warning: Story = {
  args: { title: 'Warning', type: 'warning', description: 'Please review this before proceeding.', showIcon: true },
}

export const Error: Story = {
  args: { title: 'Error', type: 'error', description: 'Something went wrong.', showIcon: true },
}

export const AllTypes: Story = {
  render: () => ({
    components: { PortalAlerts },
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <PortalAlerts title="Info" type="info" description="Informational alert" :show-icon="true" />
        <PortalAlerts title="Success" type="success" description="Success alert" :show-icon="true" />
        <PortalAlerts title="Warning" type="warning" description="Warning alert" :show-icon="true" />
        <PortalAlerts title="Error" type="error" description="Error alert" :show-icon="true" />
      </div>
    `,
  }),
}

export const NotClosable: Story = {
  args: { title: 'Permanent Alert', type: 'info', closable: false, description: 'This alert cannot be closed.' },
}
