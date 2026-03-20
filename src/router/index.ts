/**
 * Router setup for Portal
 * @author Lorin Luo
 */
import { createRouter, createWebHistory } from 'vue-router'
import { API } from '../api'
import { unwrapBffData } from '../http/api'
import { isAdminGroup } from '../perm/utils'

const RemoteLoading = () => import('../pages/RemoteLoading.vue')
const PermAdmin = () => import('../pages/PermAdmin.vue')
const Landing = () => import('../pages/Landing.vue')
const Settings = () => import('../pages/Settings.vue')

const ROUTES = {
  loadtest: '/loadtest',
  dashboard: '/dashboard',
  helpdesk: '/dashboard/helpdesk',
  invoices: '/dashboard/invoices',
  agiles: '/dashboard/agiles',
  permAdmin: '/admin/perm',
  settings: '/settings',
} as const

const routes = [
  { path: '/', name: 'landing', component: Landing },
  { path: ROUTES.loadtest, name: 'remote-loadtest', component: RemoteLoading },
  { path: ROUTES.dashboard, name: 'remote-dashboard', component: RemoteLoading },
  { path: ROUTES.helpdesk, name: 'remote-helpdesk', component: RemoteLoading },
  { path: ROUTES.invoices, name: 'remote-invoices', component: RemoteLoading },
  { path: ROUTES.agiles, name: 'remote-agiles', component: RemoteLoading },
  { path: ROUTES.permAdmin, name: 'perm-admin', component: PermAdmin },
  { path: ROUTES.settings, name: 'settings', component: Settings },
]

export function createPortalRouter(base?: string) {
  const router = createRouter({ history: createWebHistory(base), routes })

  router.beforeEach(async (to, from, next) => {
    if (to.path === '/') {
      if (API.AuthSubject()) {
        next(ROUTES.dashboard)
        return
      }
      try {
        const ok = await API.AuthInit()
        if (ok) {
          next(ROUTES.dashboard)
          return
        }
      } catch {}
      next()
      return
    }

    const isRemote = to.path === ROUTES.loadtest || to.path.startsWith(ROUTES.dashboard)
    const isPermAdmin = to.path === ROUTES.permAdmin
    const isSettings = to.path === ROUTES.settings
    const isAdminRoute = isPermAdmin || isSettings

    if (isRemote || isAdminRoute) {
      if (API.AuthSubject()) {
        if (!isAdminRoute) {
          next()
          return
        }
        try {
          const me = await API.PermMe()
          const groups = unwrapBffData<any>(me)?.groups
          if (isAdminGroup(groups)) {
            next()
          } else {
            next('/')
          }
        } catch {
          next('/')
        }
        return
      }
      const ok = await API.AuthInit()
      if (ok) {
        if (!isAdminRoute) {
          next()
          return
        }
        try {
          const me = await API.PermMe()
          const groups = unwrapBffData<any>(me)?.groups
          if (isAdminGroup(groups)) {
            next()
          } else {
            next('/')
          }
        } catch {
          next('/')
        }
      } else {
        next('/')
      }
    } else {
      next()
    }
  })

  return router
}

const router = createPortalRouter()

export { ROUTES }
export default router
