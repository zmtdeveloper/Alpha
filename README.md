# Alpha

Alpha is a private Next.js 16 project management app for teams that need shared workspaces, kanban boards, task collaboration, member management, subscriptions, and later AI-assisted task workflows.

The MVP is intentionally app-first: a dense, authenticated workspace experience modeled around fast issue triage, tenant-safe data access, and reliable team workflows.

## Required Tools

- Node.js 20 or newer
- npm, using the committed `package-lock.json`
- Git
- Docker Desktop for Supabase local services

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

For Supabase local development, start Docker Desktop and then run:

```bash
npm run supabase:start
```

`supabase start` prints the local project URL, anon key, and service role key. Copy those values into `.env.local` for the Supabase variables in `.env.example`.

If the Supabase CLI appears to hang before containers start, disable telemetry for that shell and retry:

```powershell
$env:SUPABASE_TELEMETRY_DISABLED='1'
npm run supabase:start
```

Stripe and AI provider configuration are added in later milestones. Resend is
used now for welcome and invitation emails.

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## npm Commands

- `npm run dev`: starts the local Next.js development server.
- `npm run build`: creates a production build and runs Next.js validation.
- `npm run start`: serves the production build after `npm run build`.
- `npm run lint`: runs ESLint with Next.js core web vitals and TypeScript rules.
- `npm run supabase:start`: starts the local Supabase Docker stack.
- `npm run supabase:stop`: stops the local Supabase Docker stack.
- `npm run supabase:migrate`: applies new migrations to the local database without deleting local data.
- `npm run supabase:backup`: saves a local SQL dump under `supabase/backups/`.
- `npm run supabase:reset`: rebuilds the local database from migrations and seed files. This deletes local Auth users and app data, and is blocked unless explicitly confirmed.
- `npm run supabase:types`: regenerates `lib/database.types.ts` from the local database.

## Database Workflow

Supabase configuration lives in `supabase/config.toml`. Migrations live in `supabase/migrations/`, and the current database type surface lives in `lib/database.types.ts`.

After changing migrations:

```bash
npm run supabase:migrate
npm run supabase:types
```

Do not use `npm run supabase:reset` for routine development. It drops and
recreates the local database, including Auth users, workspaces, projects,
boards, tasks, and invitations. Before any intentional reset, run:

```powershell
npm run supabase:backup
$env:ALLOW_SUPABASE_RESET="I_UNDERSTAND_LOCAL_DATA_WILL_BE_DELETED"
npm run supabase:reset
```

Optional RLS smoke checks can be run after a reset:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/tests/rls_smoke.sql
```

RLS helper functions are kept in the private schema and are not exposed through the client API. Membership lookups used by policies are indexed.

## Environment Variables

Use `.env.example` as the source of truth for expected configuration. Only variables prefixed with `NEXT_PUBLIC_` may be read by browser code.

Server-only values must stay out of client components, public bundles, logs, and committed files.

For email delivery, set:

- `RESEND_API_KEY`: a server-only Resend API key.
- `EMAIL_FROM`: the verified sender, for example `Alpha <hello@example.com>`.

If either email value is missing, welcome and invitation emails are skipped and
the core onboarding/invitation flow still completes.

## Roadmap

The implementation roadmap lives in `plan.md`, with product intent in `prd.md`. Work one milestone at a time and keep each milestone independently reviewable.
