# Portal Frontend (Components & Integration Guide)

This README reflects the "current implementation". It organizes the capabilities exposed by the Portal frontend and maps them to the corresponding backend implementation (`e:\realcids\portal\backend`): what these modules can do, what the final results are, and what their features are.

---

## 1. What can be achieved

As a "Basic Capability Platform" for Host + Remote, Portal packages a set of reusable capabilities (styles, runtime configuration, authentication, HTTP, message bus, notifications, i18n, storage, audit, error handling, external relay, etc.) into remote modules. Remote applications (such as dashboards) can obtain them by importing on demand:

- **Unified UI Basic Capabilities**: CSS Variables / Theme (including Element Plus variable mapping), general dialogs, icons, cards, etc.
- **Unified Runtime Configuration**: Pull `portal-runtime.json` / `mf-registry.json`, etc. from the backend configuration center to achieve "configuration changes without release".
- **Unified Authentication & Session**: Keycloak via BFF (refresh token HttpOnly cookie), frontend only holds memory access token, automatic 401 refresh and retry.
- **Unified Message Channel**: Local/Cross-Tab (BroadcastChannel / localStorage) + Backend SSE "Bus" model, decoupling module interactions.
- **Unified Notification Center**: Inbox + Unread Count + SSE Real-time Push + Action Registry + Pending Action Replay.
- **Unified Observability**: HTTP metrics + audit event queue + unified error reporting strategy (`system.error`).
- **Unified Configuration/Resource Hot Update**: Config SSE (`/api/config/events`) triggers frontend module hot refresh (theme / storage policy / i18n, etc.).

---

## 2. Remote Modules Exposed (Aligned with `vite.config.js`)

The remote modules exposed by Portal via Module Federation (Import Path → Implementation File) are as follows (based on `e:\realcids\portal\frontend\portal\vite.config.js`):

| Import Path | Exposed Module | Implementation Entry |
|---|---|---|
| `portal/bootstrap` | Startup entry when Portal is used as a remote | `src/main.ts` |
| `portal/runtime` | Runtime initialization (styles/manifest/auth/SSE) | `src/runtime.ts` |
| `portal/theme` | Theme Manager (Configuration Driven) | `src/theme/index.ts` |
| `portal/styles` | CSS Variables (for remote apps) | `src/styles/variables.css` |
| `portal/http` | Axios instance + helpers | `src/http/api.ts` |
| `portal/api` | Portal API encapsulation (Business/Platform interfaces) | `src/api/index.ts` |
| `portal/i18n` | i18n (Manager/Plugin/composable) | `src/i18n/index.ts` |
| `portal/storage` | Scoped storage + Vue binding | `src/storage/index.ts` |
| `portal/error` | Unified Error Center Entry | `src/error/index.ts` |
| `portal/audit` | AuditClient (Queue and flush) | `src/audit/client.ts` |
| `portal/formkit` | FormKit Integration Encapsulation | `src/formkit/index.ts` |
| `portal/regionalization` | Number/Time/Currency Formatting | `src/regionalization/index.ts` |
| `portal/gantt` | Gantt related encapsulation | `src/gantt/index.ts` |
| `portal/dialog` | Dialog component export | `src/dialog/index.ts` |
| `portal/BaseDialog` | BaseDialog component | `src/dialog/BaseDialog.vue` |
| `portal/FormDialog` | FormDialog component | `src/dialog/FormDialog.vue` |
| `portal/CidsCard` | CidsCard component | `src/components/CidsCard.vue` |
| `portal/PortalIcon` | PortalIcon component | `src/components/PortalIcon.vue` |

Note:

- The global style entry for Portal is `src/styles/index.css`. Remote applications usually only need `portal/styles` (variables) + their own business styles; Portal Host will load the full styles itself.
- The runtime will mount on `window`: `__PORTAL_RUNTIME__` (configuration), `__CIDS_BUS__` (bus), `__PORTAL_AUTH__` (token access bridge provided for host/remote).

---

## 3. Recommended Integration Path (Remote Application)

### 3.1 Minimum Available (Only Styles + Runtime)

```ts
import 'portal/styles'
import { initPortalRuntime } from 'portal/runtime'

await initPortalRuntime()
```

### 3.2 Common Scenarios (Need Notification SSE)

```ts
import 'portal/styles'
import { initPortalRuntime } from 'portal/runtime'

await initPortalRuntime({ enableNotifySse: true })
```

### 3.3 Get Message Bus (Shared by Host/Remote)

```ts
const bus = (window as any).__CIDS_BUS__
bus.publish('i18n.locale.sync', { locale: 'en-US' })
```

---

## 4. Frontend-Backend Correspondence (Key Capabilities Overview)

| Capability | Frontend Implementation (Entry) | Backend Implementation (Entry) | Main Effect/Feature |
|---|---|---|---|
| Config BFF + ETag + SSE | `src/runtime.ts` / `src/bus/index.ts` / `src/api/index.ts` | `com.cids.baseplate.controller.ConfigController` | Config read caching, ETag 304, SSE broadcast `config.updated` / `i18n.updated`; sensitive fields removed when returning runtime |
| Auth BFF (Keycloak) | `src/http/auth.ts` / `src/http/interceptors.ts` / `src/api/index.ts` | `com.cids.baseplate.auth.controller.AuthController` | 401 auto refresh, refresh token HttpOnly cookie, supports token exchange (app-token) |
| Permission (Perm) | `src/api/index.ts` + Portal internal pages/routes | `com.cids.baseplate.perm.controller.PermController` | `perm/me`, permission directory, admin group/user management, etc. |
| Notification Center (notify) + SSE | `src/notify/*` + `src/runtime.ts` | `com.cids.baseplate.controller.NotifyController` | Inbox/Unread count/Read marker, SSE ticket mode, optional Redis cross-instance delivery, Rabbit exchange |
| i18n Management & Hot Update | `src/i18n/*` + `src/bus/*` | `com.cids.baseplate.controller.I18nController` + `ConfigController` | Store language packs via config center, supports list/import/publish; Config SSE pushes `i18n.updated` |
| Scoped storage (including policy hot update) | `src/storage/*` | `ConfigController` (Read Policy JSON) | Storage policy driven by config center, auto hot load after update; Cross-Tab sync |
| HTTP Unified Layer (metrics/audit/error) | `src/http/*` + `src/cache/*` | `AuditController` (Audit Write) + Business Interface | Auto add request-id, language/timezone/currency header, 401/500 retry, ETag 304 reuse, bus reports `system.error` / `metrics.http` |
| Audit Queue (Frontend) | `src/audit/client.ts` | `com.cids.baseplate.audit.controller.AuditController` | Batch storage, queue persistence and scheduled flush, can be triggered via bus |
| User/Group Settings | `src/api/index.ts` | `UserSettingController` / `GroupSettingController` | General K/V settings; Admins can operate on behalf; Group settings with admin auth |
| Dashboard Layout Storage | `src/api/index.ts` | `DashboardLayoutController` | Supports user/group layout read and save, only admins can modify group layouts |
| Relay (BFF Forwarding) | `src/api/index.ts` | `RelayController` | Unified external call entry, controllable forwarding, supports upload; returns `X-Relay: 1` marker |
| YouTrack OAuth BFF | `src/api/index.ts` | `YouTrackOAuthController` | Auth code exchange for token + refresh cookie, avoids frontend storing refresh token |

---

## 5. Key Module Explanation (Implementation Details & Usage)

### 5.1 runtime (`portal/runtime`)

Implementation: `src/runtime.ts`

- Responsible for loading Portal global styles (`src/styles/index.css`).
- Pulls and caches `portal-runtime.json` (`/api/config/{dataId}?group=...`), and mounts it to `window.__PORTAL_RUNTIME__`.
- Loads MF manifest (default from runtime config or `mf-registry.json`) and writes to `window.__MF_MANIFEST__`.
- Initializes `window.__PORTAL_AUTH__` (`getToken` / `refreshToken`), for host/remote to unify token acquisition.
- Optionally enables notify SSE (gets ticket via `/api/notify/sse-ticket`, and connects to `/api/notify/events`).

Backend Correspondence:

- Runtime config read/push: `/api/config/*` → `ConfigController`
- Notify SSE: `/api/notify/*` → `NotifyController`

### 5.2 bus (`window.__CIDS_BUS__`)

Implementation: `src/bus/core.ts` + `src/bus/index.ts`

- publish/subscribe/once/unsubscribe/request/reply.
- Only supports `*` suffix wildcard (e.g., `user.*`).
- Broadcast: BroadcastChannel (degrades to localStorage if unavailable) for Cross-Tab/App sync.
- SSE bridge: `src/bus/index.ts` connects to `/api/config/events` by default, converts backend events to bus topics (e.g., `config.updated`, `i18n.updated`).

Backend Correspondence:

- `GET /api/config/events` → `ConfigController.events()`

### 5.3 http (`portal/http`)

Implementation: `src/http/api.ts` + `src/http/interceptors.ts` + `src/cache/interceptors.ts`

Features (Externally perceptible behavior):

- Automatically injects `X-Request-Id`, `X-App-Id`, `Accept-Language`, `X-Timezone`, `X-Currency`.
- Access token exists only in memory, 401 automatically refreshes (BFF `/api/auth/refresh`) and retries once.
- 500 automatically delays and retries once (configurable).
- Business layer BFF envelope (`{ success, code, message, data }`) unified unpacking and error reporting.
- GET enables ETag caching by default: Reuses memory cache data on 304 (key includes language/timezone/currency/user/params).
- Unified reporting: HTTP metrics and errors are published via bus (`metrics.http` / `system.error`).

Backend Correspondence (Related to Auth):

- `POST /api/auth/refresh` / `POST /api/auth/token` / `POST /api/auth/logout` / `GET /api/auth/me` → `AuthController`

### 5.4 error (`portal/error`)

Implementation: `src/error/index.ts` + `src/error/center.ts`

- Subscribes to `system.error` on bus, performs unified deduplication and display strategy (toast/notification/dialog/none).
- Compatible with entering the same error center from HTTP layer, business layer, window error, etc.

### 5.5 storage (`portal/storage`)

Implementation: `src/storage/manager.ts`

- Scope: `global/user/project` (Default policy decides whether to use memory or localStorage).
- TTL and serialization policies are issued by the configuration center: `portal.storage.policy.json` (`PORTAL_GROUP`).
- Listens to `config.updated`, hot loads when the policy file is updated.
- Publishes `storage.updated` on every write, and synchronizes across Tabs (`StorageSync`).

Backend Correspondence:

- `GET /api/config/portal.storage.policy.json?group=PORTAL_GROUP` → `ConfigController`

### 5.6 i18n (`portal/i18n`)

Implementation: `src/i18n/manager.ts` + `src/i18n/vue.ts`

- Locale is persisted in user storage (default key: `i18n.locale`), and can be synchronized across apps via bus (`i18n.locale.sync`).
- Can trigger reload when `i18n.updated` is received via Config SSE (implementation depends on Manager internals).
- Management Interface: Supports list/export/import/publish (for operations/management side to maintain language packs).

Backend Correspondence:

- `GET/POST /admin/i18n/*` → `I18nController`
- `GET /api/config/events` pushes `i18n.updated` → `ConfigController`

### 5.7 notify (Notification Center)

Implementation: `src/notify/NotifyCenter.vue` + `src/notify/useNotifyCenter.ts`

What it can do:

- Unified Notification UI: Badge unread count + Drawer inbox + Detail dialog.
- "Action System": Notification items can carry `__actions`, remote applications register business actions via `registerNotifyAction(type, handler)` (supports pending replay).
- Unread count synchronized via bus topic `notify.unread.count.changed`.

Backend Correspondence (Interface and SSE):

- `GET /api/notify/inbox` → Pull inbox
- `POST /api/notify/read` / `POST /api/notify/read-all` → Read marker
- `POST /api/notify/sse-ticket` + `GET /api/notify/events` → Personal SSE (ticket mode)
- `GET /api/notify/broadcast` / `POST /api/notify/admin/send` → Broadcast and management sending

### 5.8 audit (`portal/audit`)

Implementation: `src/audit/client.ts`

- Frontend queue, scheduled flush, flush on hide/leave page.
- Queue persistence in user storage (default key: `audit.queue`), avoids losing events on refresh.
- Bus interaction: `audit.event` (write), `audit.flush` (request trigger), `audit.status` (query).

Backend Correspondence:

- `POST /api/audit/events` (Batch write, queue rate limiting)
- `GET /api/audit/status` / `GET /api/audit/events` / `POST /api/audit/export`

---

## 6. Common Questions (Implementation Constraints)

- Remote applications should only rely on exposed modules (Table in Section 2), and should not directly reference Portal internal pages/route files.
- If you need to access Notification SSE, it is recommended to initialize uniformly via `initPortalRuntime({ enableNotifySse: true })` instead of creating SSE yourself.
- When cross-Tab synchronization is needed, prioritize bus events (such as locale, unread count, storage.updated) to avoid direct coupling with storage.
