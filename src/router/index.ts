/**
 * Router setup for Portal
 * @author Lorin Luo
 */
import { createRouter, createWebHistory } from 'vue-router'
import { API } from '../api'

const BuilderPage = () => import('../builder/BuilderPage.vue')
const RemoteLoading = () => import('../pages/dashboard/index.vue')
const Left = () => import('../pages/left/index.vue')
const Right = () => import('../pages/right/index.vue')
const SelectList = () => import('../pages/select/list.vue')
const LoginPage = () => import('../pages/LoginPage.vue')
const RegisterPage = () => import('../pages/RegisterPage.vue')
const ROUTES = {
  dashboard: '/dashboard',
  left: '/left',
  right: '/right',
  select: '/select',
  selectList: '/select/list',
  login: '/login',
  register: '/register',
} as const

const routes = [
  { path: '/', redirect: '/login' },
  {
    path: ROUTES.dashboard,
    name: 'dashboard',
    component: RemoteLoading,
    meta: { title: 'shell.menu.dashboard', icon: 'dashboard', order: 0 },
  },
  {
    path: ROUTES.left,
    name: 'left',
    component: Left,
    meta: { title: 'shell.menu.left', icon: 'form', order: 30 },
  },
  {
    path: ROUTES.right,
    name: 'right',
    component: Right,
    meta: { title: 'shell.menu.right', icon: 'form', order: 0, position: 'right' },
  },
  {
    path: ROUTES.select,
    name: 'select',
    redirect: ROUTES.selectList,
    meta: { title: 'shell.menu.select', icon: 'form', order: 40, alwaysShow: true },
  },
  {
    path: ROUTES.selectList,
    name: 'select-list',
    component: SelectList,
    meta: { title: 'shell.menu.select_list', icon: 'form', parentMenu: 'select' },
  },
  { path: ROUTES.login, name: 'login', component: LoginPage, meta: { hidden: true } },
  { path: ROUTES.register, name: 'register', component: RegisterPage, meta: { hidden: true } },
  {
    path: '/builder/:path(.*)',
    name: 'builder-preview',
    component: BuilderPage,
    meta: { hidden: true, title: 'Builder.io Preview' },
  },
]

/** Ensure user is authenticated, attempting silent init if needed */
async function ensureAuth(): Promise<boolean> {
  if (API.AuthSubject()) return true
  try {
    return await API.AuthInit()
  } catch {
    return false
  }
}

export function createPortalRouter(base?: string) {
  const router = createRouter({ history: createWebHistory(base), routes })

  router.beforeEach(async (to) => {
    // Login page: redirect authenticated users to dashboard
    if (to.path === '/login') {
      return (await ensureAuth()) ? ROUTES.dashboard : undefined
    }
  })

  return router
}

const router = createPortalRouter()

export { ROUTES }
export default router
