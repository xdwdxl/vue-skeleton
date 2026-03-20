# Portal Integration Guide

This document explains how remote applications integrate with Portal's shared capabilities via Module Federation. It covers all exposed modules, their features, recommended usage patterns, and the frontend-backend correspondence.

---

## 1. Overview

Portal serves as a **unified capability platform** for a micro-frontend architecture. It packages reusable infrastructure (authentication, HTTP, message bus, notifications, i18n, storage, audit, error handling, theming) into Module Federation remotes that any consumer application can import on demand.

### Key Capabilities

- **Unified Theming** — CSS variables, Element Plus overrides, dark/light skin switching
- **Unified Runtime Configuration** — Pull `portal-runtime.json` from backend config center; changes take effect without redeployment
- **Unified Authentication** — Keycloak via BFF pattern; refresh token in HttpOnly cookie, access token in memory only; automatic 401 refresh and retry
- **Unified Message Bus** — Local pub/sub + cross-tab sync (BroadcastChannel) + backend SSE bridge
- **Unified Notification Center** — Inbox, unread count, SSE real-time push, action registry with pending replay
- **Unified Observability** — HTTP metrics, audit event queue, error reporting via `system.error` bus topic
- **Unified Hot Updates** — Config SSE (`/api/config/events`) triggers frontend hot refresh for theme, storage policy, and i18n

---

## 2. Exposed Remote Modules

All modules listed below are exposed via Module Federation. Import them as `portal/<module>`.

| Import Path | Implementation | Description |
|---|---|---|
| `portal/bootstrap` | `src/main.ts` | Full app bootstrap (when Portal is loaded as a remote) |
| `portal/runtime` | `src/runtime.ts` | Runtime initialization (styles, manifest, auth, SSE) |
| `portal/theme` | `src/theme/index.ts` | Theme manager (config-driven skin switching) |
| `portal/styles` | `src/styles/variables.css` | CSS variables for remote apps |
| `portal/http` | `src/http/api.ts` | Axios instance with full interceptor stack |
| `portal/api` | `src/api/index.ts` | Portal business API client |
| `portal/i18n` | `src/i18n/index.ts` | i18n manager, Vue plugin, and composables |
| `portal/storage` | `src/storage/index.ts` | Scoped storage with Vue reactivity |
| `portal/error` | `src/error/index.ts` | Unified error center |
| `portal/audit` | `src/audit/client.ts` | Audit event queue (batch flush) |
| `portal/regionalization` | `src/regionalization/index.ts` | Number/date/currency locale formatting |
| `portal/gantt` | `src/gantt/index.ts` | Gantt chart wrapper (dhtmlx-gantt) |
| `portal/dialog` | `src/dialog/index.ts` | Dialog component collection |
| `portal/BaseDialog` | `src/dialog/BaseDialog.vue` | Base dialog component |
| `portal/FormDialog` | `src/dialog/FormDialog.vue` | Form dialog component |
| `portal/PortalIcon` | `src/components/PortalIcon.vue` | Icon component (FontAwesome + SVG) |
| `portal/PortalTable` | `src/components/PortalTable.vue` | Table component |
| `portal/PortalTableColumn` | `src/components/PortalTableColumn.ts` | Table column definition |
| `portal/notify` | `src/notify/index.ts` | Notification center |
| `portal/dashboard-styles` | `src/styles/dashboard.css` | Dashboard-specific styles |

### Global Objects

Portal runtime mounts the following on `window`:

| Global | Purpose |
|---|---|
| `__PORTAL_RUNTIME__` | Runtime configuration object |
| `__CIDS_BUS__` | Message bus instance |
| `__PORTAL_AUTH__` | Auth bridge (`getToken` / `refreshToken`) for host and remotes |

---

## 3. Integration Patterns

### 3.1 Minimal Setup (Styles + Runtime Only)

```ts
import 'portal/styles'
import { initPortalRuntime } from 'portal/runtime'

await initPortalRuntime()
```

This loads Portal CSS variables and initializes runtime configuration. Sufficient for apps that only need theming and config.

### 3.2 Standard Setup (With Notification SSE)

```ts
import 'portal/styles'
import { initPortalRuntime } from 'portal/runtime'

await initPortalRuntime({ enableNotifySse: true })
```

Enables real-time notification push in addition to the minimal setup.

### 3.3 Using the Message Bus

The bus is available globally after runtime initialization:

```ts
const bus = (window as any).__CIDS_BUS__

// Publish events
bus.publish('i18n.locale.sync', { locale: 'en-US' })

// Subscribe to events (supports * wildcard suffix)
bus.subscribe('config.*', (topic, payload) => {
  console.log(topic, payload)
})

// Request-reply pattern
const response = await bus.request('some.topic', { data: 'value' })
```

### 3.4 Using the HTTP Client

```ts
import { http } from 'portal/http'

// Automatic auth headers, request-id, retry, ETag caching
const data = await http.get('/api/some-endpoint')
```

### 3.5 Using Storage

```ts
import { storage } from 'portal/storage'

// Scoped to global / user / project
storage.set('my-key', value, { scope: 'user' })
const value = storage.get('my-key', { scope: 'user' })
```

### 3.6 Using Notifications

```ts
import { registerNotifyAction } from 'portal/notify'

// Register a business action handler for notification items
registerNotifyAction('my-action-type', async (notification) => {
  // Handle the notification action
})
```

---

## 4. Frontend-Backend Correspondence

| Capability | Frontend Entry | Backend Controller | Description |
|---|---|---|---|
| Config + ETag + SSE | `src/runtime.ts`, `src/bus/index.ts`, `src/api/index.ts` | `ConfigController` | Config reading with ETag 304 caching; SSE broadcasts `config.updated` / `i18n.updated` |
| Auth (Keycloak BFF) | `src/http/auth.ts`, `src/http/interceptors.ts` | `AuthController` | 401 auto-refresh; HttpOnly refresh cookie; token exchange support |
| Permissions | `src/api/index.ts`, `src/perm/utils.ts` | `PermController` | `perm/me` endpoint; permission directory; admin group/user management |
| Notifications + SSE | `src/notify/*`, `src/runtime.ts` | `NotifyController` | Inbox, unread count, read markers; SSE ticket mode; optional Redis cross-instance delivery |
| i18n Management | `src/i18n/*`, `src/bus/*` | `I18nController`, `ConfigController` | Language pack list/import/publish; Config SSE pushes `i18n.updated` for hot reload |
| Scoped Storage | `src/storage/*` | `ConfigController` | Policy driven by config center (`portal.storage.policy.json`); hot-reloads on update; cross-tab sync |
| HTTP Layer | `src/http/*`, `src/cache/*` | Business APIs, `AuditController` | Auto request-id, locale headers; 401/500 retry; ETag caching; bus reports `system.error` / `metrics.http` |
| Audit Queue | `src/audit/client.ts` | `AuditController` | Batch flush; queue persistence in storage; triggered via bus (`audit.event`, `audit.flush`) |
| User/Group Settings | `src/api/index.ts` | `UserSettingController`, `GroupSettingController` | Key-value settings; admin delegation; group settings with authorization |
| Dashboard Layouts | `src/api/index.ts` | `DashboardLayoutController` | User/group layout CRUD; only admins can modify group layouts |
| Relay (BFF Proxy) | `src/api/index.ts` | `RelayController` | Unified external call forwarding; supports file upload; returns `X-Relay: 1` header |
| YouTrack OAuth | `src/api/index.ts` | `YouTrackOAuthController` | Auth code → token exchange; refresh cookie avoids frontend token storage |

---

## 5. Module Details

### 5.1 Runtime (`portal/runtime`)

**Entry:** `src/runtime.ts`

Responsibilities:
1. Loads Portal global styles (`src/styles/index.css`)
2. Fetches and caches `portal-runtime.json` via `/api/config/{dataId}?group=...`; mounts to `window.__PORTAL_RUNTIME__`
3. Loads MF manifest (from runtime config or `mf-registry.json`); writes to `window.__MF_MANIFEST__`
4. Initializes `window.__PORTAL_AUTH__` with `getToken()` and `refreshToken()` methods
5. Optionally enables notification SSE (ticket via `/api/notify/sse-ticket`, stream from `/api/notify/events`)

### 5.2 Message Bus (`window.__CIDS_BUS__`)

**Entry:** `src/bus/core.ts` + `src/bus/index.ts`

API: `publish` / `subscribe` / `once` / `unsubscribe` / `request` / `reply`

Features:
- Wildcard subscriptions with `*` suffix (e.g., `user.*`)
- Cross-tab broadcast via BroadcastChannel (falls back to localStorage)
- SSE bridge connects to `/api/config/events`, converts backend events to bus topics (`config.updated`, `i18n.updated`)

### 5.3 HTTP Client (`portal/http`)

**Entry:** `src/http/api.ts` + `src/http/interceptors.ts` + `src/cache/interceptors.ts`

Features:
- Auto-injects headers: `X-Request-Id`, `X-App-Id`, `Accept-Language`, `X-Timezone`, `X-Currency`
- In-memory access token; 401 triggers automatic refresh via `/api/auth/refresh` and retries once
- 500 responses trigger delayed retry (configurable)
- BFF response envelope (`{ success, code, message, data }`) auto-unpacked
- GET requests use ETag caching by default; 304 responses serve from memory cache (key includes locale, timezone, currency, user, params)
- Reports `metrics.http` and `system.error` via bus

### 5.4 Error Center (`portal/error`)

**Entry:** `src/error/index.ts` + `src/error/center.ts`

Subscribes to `system.error` on the bus. Applies deduplication and configurable display strategies:
- `toast` — brief notification
- `notification` — persistent notification
- `dialog` — modal error dialog
- `none` — silent (logging only)

Accepts errors from HTTP layer, business code, and `window.onerror`.

### 5.5 Storage (`portal/storage`)

**Entry:** `src/storage/manager.ts`

Features:
- Three scopes: `global`, `user`, `project`
- Default policy determines driver (memory or localStorage)
- TTL and serialization policies from config center (`portal.storage.policy.json` in `PORTAL_GROUP`)
- Listens to `config.updated`; hot-reloads policy when updated
- Publishes `storage.updated` on writes; cross-tab sync via `StorageSync`
- Vue composable: `useStorage()` for reactive bindings

### 5.6 i18n (`portal/i18n`)

**Entry:** `src/i18n/manager.ts` + `src/i18n/vue.ts`

Features:
- Locale persisted in user storage (default key: `i18n.locale`)
- Cross-app locale sync via bus topic `i18n.locale.sync`
- Hot-reload on `i18n.updated` from Config SSE
- Management API: list, export, import, publish language packs

### 5.7 Notification Center (`portal/notify`)

**Entry:** `src/notify/NotifyCenter.vue` + `src/notify/useNotifyCenter.ts`

Features:
- Badge with unread count + drawer inbox + detail dialog
- Action system: notification items carry `__actions`; remote apps register handlers via `registerNotifyAction(type, handler)`
- Supports pending action replay for late-registered handlers
- Unread count synced via bus topic `notify.unread.count.changed`

Backend endpoints:
- `GET /api/notify/inbox` — fetch inbox
- `POST /api/notify/read` / `POST /api/notify/read-all` — mark as read
- `POST /api/notify/sse-ticket` + `GET /api/notify/events` — SSE (ticket mode)
- `GET /api/notify/broadcast` / `POST /api/notify/admin/send` — broadcast and admin send

### 5.8 Audit (`portal/audit`)

**Entry:** `src/audit/client.ts`

Features:
- Frontend event queue with scheduled batch flush
- Flush on page hide/unload to avoid event loss
- Queue persisted in user storage (default key: `audit.queue`)
- Bus interaction: `audit.event` (enqueue), `audit.flush` (trigger flush), `audit.status` (query)

Backend endpoints:
- `POST /api/audit/events` — batch write
- `GET /api/audit/status` / `GET /api/audit/events` / `POST /api/audit/export`

---

## 6. Integration Guidelines

1. **Only import exposed modules** listed in section 2. Do not directly reference Portal internal pages, routes, or private files.
2. **Use `initPortalRuntime()` for SSE** — do not create SSE connections manually. Use `initPortalRuntime({ enableNotifySse: true })` for notification streams.
3. **Prefer bus events for cross-tab sync** — use bus topics (`i18n.locale.sync`, `notify.unread.count.changed`, `storage.updated`) instead of coupling directly to storage or DOM events.
4. **Shared dependencies** — Vue and Vue Router are configured as singletons in Module Federation. Remote apps must use compatible versions (`vue ^3.5`, `vue-router ^5`).
5. **Styles** — Remote apps typically only need `portal/styles` (CSS variables). The Portal host loads full styles (`src/styles/index.css`) itself.
