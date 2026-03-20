import type { Meta, StoryObj } from '@storybook/vue3'
import { defineComponent, h } from 'vue'
import { Content } from '@builder.io/sdk-vue'
import { portalComponents, BUILDER_API_KEY } from '../register-components'

/**
 * Displays all Portal components registered with Builder.io.
 * Use this to verify which components Builder.io can access.
 */
const ComponentRegistry = defineComponent({
  name: 'ComponentRegistry',
  setup() {
    const components = portalComponents.map((c) => ({
      name: c.name,
      inputs: c.inputs ?? [],
    }))
    return { components, apiKey: BUILDER_API_KEY }
  },
  template: `
    <div style="padding: 24px; font-family: sans-serif;">
      <h2 style="margin-bottom: 8px;">Builder.io Registered Components</h2>
      <p style="color: #666; margin-bottom: 4px;">
        API Key: <code>{{ apiKey }}</code>
      </p>
      <p style="color: #666; margin-bottom: 24px;">
        Total: <strong>{{ components.length }}</strong> components
      </p>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #ddd;">#</th>
            <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #ddd;">Component Name</th>
            <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #ddd;">Inputs</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(comp, index) in components" :key="comp.name" style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px 12px; color: #999;">{{ index + 1 }}</td>
            <td style="padding: 8px 12px;">
              <code style="background: #e8f4fd; padding: 2px 6px; border-radius: 3px;">{{ comp.name }}</code>
            </td>
            <td style="padding: 8px 12px;">
              <span v-for="input in comp.inputs" :key="input.name"
                style="display: inline-block; background: #f0f0f0; padding: 1px 6px; border-radius: 3px; margin: 2px 4px 2px 0; font-size: 12px;">
                {{ input.name }}: {{ input.type }}
              </span>
              <span v-if="comp.inputs.length === 0" style="color: #999; font-size: 12px;">none</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
})

const meta: Meta<typeof ComponentRegistry> = {
  title: 'Builder/Component Registry',
  component: ComponentRegistry,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Shows all Portal components registered with Builder.io and their configurable inputs.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof ComponentRegistry>

export const AllComponents: Story = {}
