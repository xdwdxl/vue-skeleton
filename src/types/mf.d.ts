/**
 * Module Federation remote type declarations
 * @author Lorin Luo
 */

declare module 'dashboardApp/App' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

declare module 'dashboardApp/Dashboard' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

declare module 'dashboardApp/Helpdesk' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

declare module 'dashboardApp/routes' {
  export function registerRoutes(router: any, prefix?: string): void
  export function getRoutes(prefix?: string): any[]
  export default registerRoutes
}

declare module 'dashboardApp/bootstrap' {
  export function initDashboardRuntime(): Promise<void>
  export function mount(container: HTMLElement | string, options?: Record<string, unknown>): Promise<void>
  export function unmount(): Promise<void>
}
