# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Rin is a serverless blog on Cloudflare (Workers + D1 + R2/S3), a product monorepo: `client/` (React app), `server/` (Worker app), `packages/*` (shared libs), `cli/` (repo tooling). Read `AGENTS.md` for refactor guardrails, layering rules, and code style — this file covers commands and architecture it does not.

## Commands

```bash
bun install                # deps (Bun workspaces; packageManager: bun@1.3.13)
bun run dev                # Rin CLI: Vite (5173) + wrangler dev (11498) together
bun run dev:server         # wrangler only, serves BUILT assets from dist/client
bun run dev:cron           # wrangler with --test-scheduled for cron triggers
bun run check              # TypeScript check (turbo)
bun run build              # build client -> dist/client, dry-run bundle server -> dist/server
bun run test               # all tests (bun:test)
bun run test:client        # client only
bun run test:server        # server only
bun run db:migrate         # local D1 migrations (Rin CLI)
bun run db:generate        # generate Drizzle migrations
bun run i18n:extract       # extract i18n keys (client)
bun run format:write       # formatting
```

Run a single test file from the repo root:

```bash
bun test server/src/services/__tests__/config.test.ts
bun test client/src/components/__tests__/foo.test.ts   # DOM tests share the jsdom setup in client/src/test/
```

## Gotchas

- `bun run dev:server` (ports 11498/11499) serves `dist/client` — the **last build**, not live source. When inspecting frontend behavior, verify `dist/` is fresh or use `bun dev` (Vite). Stale-dist has caused phantom "bugs" before.
- Root `wrangler.toml` is the **local dev** config (placeholder values). `cli/src/tasks/deploy-cf.ts` **regenerates** it from env vars during deploy; `bun run clean` deletes it.
- Local secrets live in `.dev.vars` (gitignored): JWT_SECRET, ADMIN_USERNAME/PASSWORD, RIN_GITHUB_CLIENT_*, S3 keys.
- `applyViewportScaling()` (client/src/app/use-app-bootstrap.ts) sets root font-size to 125% when `screen.width >= 2560`. All rem-based sizes (spacers, `calc(100% - Nrem)` rules in base.css, Tailwind `w-80` etc.) scale up on such displays — factor this in when debugging layout.
- i18n: all UI strings come from `client/public/locales/{en,zh-CN,zh-TW,ja}/translation.json`; add keys to all four via `bun run i18n:extract`.

## Architecture

### Request flow (server)

`server/src/_worker.ts` exports fetch/queue/scheduled handlers → `server/src/runtime/*-handler.ts`. `fetch-handler` strips the `/api` prefix, then `core/hono-app.ts` wires: `register-middlewares` → `register-routes` → error handlers. Each feature in `server/src/services/*` is a function returning a Hono instance, mounted in `core/register-routes.ts` (e.g. `/config` → ConfigService). Admin gating via `adminOnly()` from `core/route-boundaries.ts`. Request context values (`db`, `cache`, `clientConfig`, `serverConfig`, `jwt`, `admin`, `env`) are lazily initialized per isolate in `core/hono-middleware.ts`.

### Config storage (CacheImpl)

`server/src/utils/cache.ts` provides `CacheImpl` — an in-memory Map backed by one of two providers:

- `database`: rows in the D1 `cache` table, namespaced by `type` (partial access, per-key writes, errors **throw**)
- `s3`: whole-map JSON blob at `S3_CACHE_FOLDER/<type>.json` (errors **silently swallowed** — load/save failures only log)

Three logical stores: `"cache"` (public content cache, mode from `CACHE_STORAGE_MODE` env, default s3), `"client.config"`, `"server.config"` (both pinned to `database` — config persistence must not depend on S3 being configured).

### Config flow (client ↔ server)

- Read: `index.html` loads `/api/config/client/bootstrap.js` → `globalThis.__RIN_CLIENT_CONFIG__` → `useAppBootstrap` → `ClientConfigContext` → `useSiteConfig()` hook (keys in `SITE_CONFIG_KEYS`). sessionStorage caches it as fallback.
- Write: settings page (`client/src/page/settings.tsx` + `settings-helpers.ts`) keeps a full draft of `{clientConfig, serverConfig}`, POSTs it to `/api/config`; server splits `ai_summary.*` keys into a separate AI-config path.
- Shared config model lives in `packages/config` (`@rin/config`): defaults, `ConfigWrapper`, client-safe env fallbacks. Client/server must not redeclare defaults locally.

### Shared packages

- `@rin/api` — shared request/response types and API path constants (`packages/api/src/types.ts`)
- `@rin/config` — config keys/defaults/`ConfigWrapper`
- `@rin/ui` — app-agnostic presentational primitives (Padding, Modal, Button, …). Components tied to client state/routing stay in `client/src/`.

### Frontend structure

`client/src/main.tsx` → `app/` (bootstrap, providers, `routes.tsx`). Routing is wouter; `AppRoute`/`TocRoute` in `app/routes.tsx` wrap pages with the header-layout shell (`components/site-header/layouts/*`, selected by `header.layout` config) and the `Padding` page-margin component. Feed-page width modes (`normal|wide|full`) are implemented as `wauto`/`wauto-wide`/`wauto-full` classes in `client/src/base.css` and must stay in sync with the `Padding` margins and the TOC column width.

### Deploy pipeline

Pushing a tag (`v*`) → `release.yml` builds and attaches a tarball → `deploy.yml` (also manual via `workflow_dispatch`) → `bun run deploy` → `cli/src/tasks/deploy-cf.ts`: regenerates `wrangler.toml` from GitHub vars/secrets, creates D1/queues, applies pending migrations from `server/sql/00NN.sql` (versioned, tracked in DB), deploys the Worker with `dist/client` as assets, syncs worker secrets. `CACHE_STORAGE_MODE` defaults to `database` there.
