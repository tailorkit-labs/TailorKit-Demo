# Forma CRM demo

A pnpm workspace. The Next.js application and all its code live in `website/`; `apps/*` is reserved for future packages.

## Run locally

```sh
pnpm install
cp website/.env.example website/.env.local
pnpm --filter website db:up
pnpm --filter website db:push
pnpm dev
```

Open http://localhost:3000. First visit creates an anonymous Better Auth account and provisions a private workspace with 30 contacts, 18 deals, and 12 tasks. Returning visitors resume their existing workspace. Each collection permits at most 50 records; activity history keeps the latest 50 entries.

## Checks

```sh
pnpm check
pnpm --filter website test:db
pnpm build
```

Database tests require the local Postgres container and pushed schema. They create temporary accounts and remove them on completion. Next.js handles application builds; Vite+ provides Oxlint, Oxfmt, and type-aware checking.

See [website/README.md](website/README.md) for configuration, setup versioning, and Vercel/Neon notes.
