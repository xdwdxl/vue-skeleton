/**
 * @file Builder.io Integration Entry Point
 * @description Exports Builder.io components and utilities for the Portal project.
 *
 * Setup:
 *   1. Set your API key in register-components.ts (BUILDER_API_KEY)
 *   2. Register at https://builder.io and create a space
 *   3. Add BuilderPage to your router or use it directly in templates
 *
 * Standard Workflow:
 *   1. Design components → registered in Storybook
 *   2. Register components with Builder.io (done in register-components.ts)
 *   3. Use Builder.io AI to generate UI layouts
 *   4. Create interactive mockups in Builder.io visual editor
 *   5. Export Vue code and integrate into project
 */
export { default as BuilderPage } from './BuilderPage.vue'
export { portalComponents, BUILDER_API_KEY } from './register-components'
