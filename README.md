# Portal Frontend

A Vue 3 micro-frontend host application that provides unified platform capabilities (authentication, HTTP, storage, notifications, i18n, error handling, audit, theming) to remote applications via Module Federation.

## Tech Stack

- **Framework:** Vue 3 + TypeScript
- **Build Tool:** Vite 8
- **UI Library:** Element Plus
- **State Management:** Pinia
- **HTTP Client:** Axios
- **Micro-Frontend:** Module Federation (`@module-federation/vite`)
- **Testing:** Vitest + Vue Test Utils + jsdom
- **Linting:** ESLint + Prettier

## Prerequisites

- Node.js >= 22
- npm >= 10

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (port 5000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 5000 |
| `npm run build` | Production build + generate federation type declarations |
| `npm run build:types` | Generate federation type declarations only |
| `npm run watch` | Build in watch mode |
| `npm run preview` | Preview production build on port 5000 |
| `npm run test` | Run tests with Vitest (watch mode) |
| `npm run test:coverage` | Run tests with V8 coverage report |
| `npm run lint` | Lint and auto-fix with ESLint |
| `npm run format` | Format source files with Prettier |
| `npm run format:check` | Check formatting without writing |
| `npm run typecheck` | Run TypeScript type checking |

## Project Structure

```
src/
├── api/                  # Portal API client (config, auth, permissions, notifications)
├── audit/                # Frontend audit event queue with batch flush
├── bus/                  # Pub/sub message bus (BroadcastChannel + SSE adapters)
├── cache/                # ETag-based HTTP caching interceptor
├── components/           # Reusable Vue components (Portal*)
├── composables/          # Vue composition functions
├── config/               # Feature flags and configuration
├── dialog/               # Dialog components (Base, Form, List, Message, Option)
├── error/                # Unified error center with deduplication
├── gantt/                # Gantt chart integration (dhtmlx-gantt)
├── http/                 # Axios instance with auth, metrics, and retry interceptors
├── i18n/                 # Internationalization with hot-update support
├── notify/               # Notification center (inbox, unread count, SSE push)
├── pages/                # Page components (Login, Register, Dashboard, etc.)
├── perm/                 # Permission utilities
├── regionalization/      # Number/date/currency locale formatting
├── router/               # Vue Router with auth guards
├── shell/                # Application shell (header, navbar, tags view)
├── storage/              # Scoped storage (global/user/project) with hot policy updates
├── styles/               # CSS variables, themes, Element Plus overrides
├── theme/                # Theme manager (config-driven skin switching)
├── types/                # TypeScript type definitions
├── App.vue               # Root component
├── main.ts               # Application bootstrap & Module Federation entry
└── runtime.ts            # Runtime initialization for remote consumers
```

## Module Federation

Portal exposes 20+ modules for remote applications to consume. Key exports:

| Module | Purpose |
|---|---|
| `portal/runtime` | Runtime initialization (styles, config, auth, SSE) |
| `portal/http` | Pre-configured Axios instance with interceptors |
| `portal/api` | Portal API client |
| `portal/i18n` | i18n manager and Vue plugin |
| `portal/storage` | Scoped storage with Vue reactivity |
| `portal/error` | Unified error reporting center |
| `portal/audit` | Audit event queue |
| `portal/notify` | Notification center |
| `portal/theme` | Theme manager |
| `portal/styles` | CSS variables for theming |
| `portal/dialog` | Dialog components |
| `portal/regionalization` | Locale-aware formatting |
| `portal/gantt` | Gantt chart wrapper |

Module Federation can be toggled via the `VITE_ENABLE_MF` environment variable or `src/config/config.js`.

## Testing

Tests are located in `__tests__/` directories alongside source modules. The test suite covers core modules including HTTP, storage, i18n, bus, error handling, audit, caching, and more.

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage
```

Coverage is configured for core modules: `theme`, `http`, `i18n`, `storage`, `error`, `audit`, `regionalization`, `cache`, `bus`, and `api`.

## Docker

```bash
# Build image
docker build -t portal-frontend .

# Run container
docker run -p 80:80 portal-frontend
```

The Dockerfile uses a multi-stage build (Node 22 build + Nginx 1.27 runtime). Runtime environment variables are injected via `env-config.sh`.

## Configuration

- **Vite:** [vite.config.js](vite.config.js) — build, dev server, Module Federation, proxy
- **Vitest:** [vitest.config.ts](vitest.config.ts) — test environment, coverage, mocks
- **TypeScript:** [tsconfig.json](tsconfig.json) — strict mode, path aliases (`@/` → `src/`)
- **ESLint:** [.eslintrc.cjs](.eslintrc.cjs) — Vue + TypeScript rules with Prettier integration
- **Prettier:** [.prettierrc.json](.prettierrc.json) — single quotes, no semicolons, trailing commas

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_ENABLE_MF` | Enable/disable Module Federation | `true` (via config flag) |
| `VITE_MCS_PROXY_TARGET` | Dev proxy target for `/mcs` | `https://mcs.zijieapi.com` |
