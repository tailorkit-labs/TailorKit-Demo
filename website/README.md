# Forma CRM

Next.js App Router, official Coss UI components with the neutral theme and Geist font, Better Auth anonymous sessions, and Drizzle with PostgreSQL. Coss source files in `components/ui` stay unmodified; application components compose their APIs. Charts use Recharts directly.

Refresh Coss components with `pnpm dlx shadcn@latest add @coss/ui @coss/colors-neutral --overwrite --yes` from `website`, then adapt application callers to upstream API changes. Notifications use Coss `ToastProvider` and `toastManager`; selects use Coss `Select` composition.

## Local development

Run from the repository root:

```sh
pnpm install
cp website/.env.example website/.env.local
pnpm --filter website db:up
pnpm --filter website db:push
pnpm dev
```

The Dockerfile builds a PostgreSQL 17 image; Compose binds it only to localhost and stores data in a named volume. `pnpm --filter website db:down` stops it without deleting data. Schema changes use `drizzle-kit push`, with no migration SQL files.

The env example is only for local use. Generate a real secret using `openssl rand -base64 32` before deploying. A generated local secret is kept in the ignored `.env.local` for the current checkout.

## Routes and behavior

- `/`: dashboard-01 KPI cards, interactive area chart, and a full-width opportunities table.
- `/contacts`: search, relationship filters, create and drill into contacts.
- `/contacts/[id]`: contact editing, related deals/tasks, notes and activity.
- `/pipeline`: drag deals between stages or sort cards within a stage (order is saved), edit details, create and delete.
- `/inbox`: sample email conversations, search, unread/archive filters, contact context, and demo replies saved per workspace in this browser. No email provider is connected.
- `/tasks`: redirects to Inbox.
- `/settings`: demo session information and per-collection usage.

Every query and mutation derives the workspace from the authenticated session. Record creation locks the tenant row before checking limits, so concurrent requests cannot exceed 50 contacts, deals, or tasks. User input is validated on the server. Activity history is capped at 50 entries.

## Anonymous setup

Better Auth stores the account/session in Postgres and uses its signed HttpOnly session cookie. The session lasts 30 days with refresh on active use. No signup or sign-in forms are exposed. Clearing cookies creates a fresh workspace on the next visit.

Setup completion is stored in `tenants.setup_version`, rather than trusting a client flag. `lib/provision.ts` owns `CURRENT_SETUP_VERSION`; `lib/workspace.ts` uses it to decide whether setup must resume. To add a setup step, increment this constant and add the step guarded by the previous version inside the locked transaction, advancing the version only after success. Initial seed data is small and provisioning is idempotent, including concurrent tabs. The setup overlay preserves the requested URL and reveals it after completing the steps.

## Verification

```sh
pnpm check
pnpm --filter website typecheck
pnpm --filter website test:db
pnpm build # pushes the configured database schema before building
```

The DB integration test covers real anonymous authentication, cookies, concurrent provisioning, validated CRUD, tenant isolation, and racing requests for the last available record slot. It removes all accounts it creates. Browser verification covers setup, navigation, forms, persistence, filters, and responsive layouts.

## Vercel and Neon

Set the Vercel project Root Directory to `website`, using the Next.js preset. Configure:

- `DATABASE_URL`: a Neon PostgreSQL connection URL (include `sslmode=require`; a pooled URL is suitable).
- `BETTER_AUTH_SECRET`: a generated secret with at least 32 characters.
- `BETTER_AUTH_URL`: the canonical deployment origin, including `https://`.

The build command is `pnpm run db:push && next build`. Every deployment pushes `lib/schema.ts` to its assigned database before building; a failed push stops the build. Drizzle uses `DATABASE_URL_UNPOOLED` when available for schema changes, while the app uses pooled `DATABASE_URL`.

In the Neon resource's **Projects → Update Project Connection** settings, enable **Create Database Branch For Deployment → Preview** and leave Production unchecked. Neon creates an isolated branch and injects its connection URLs before each preview build. Production builds push the main database. Database branches are not merged: production applies the schema from the code deployed to production.

Local development uses Docker Postgres and `.env.local`; it needs no Neon credentials. Run `pnpm --filter website db:push` after changing the schema. Local `pnpm build` also pushes the configured local database.

For changes that remove columns/tables, change types, or rename structures, inspect the SQL first with `pnpm --filter website db:plan` against the intended database. Drizzle 1.0 RC can apply destructive changes unattended in CI, even without `--force`. Production schema changes happen before the new deployment is ready, so keep them compatible with the running app; a later build failure does not roll back the database.

No generated migration files or custom branch-management scripts are required. Vercel's build environment receives the Neon secrets directly; local development does not need to download them.

This is a bounded demo workspace, not a full production account system. Per-workspace record limits do not provide a global storage budget: cookie resets can create additional anonymous accounts. Add expiry cleanup or a global account budget before exposing it to sustained public traffic.
