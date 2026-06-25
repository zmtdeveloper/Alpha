# Alpha

Alpha is a private Next.js 16 project management app for teams that need shared workspaces, kanban boards, task collaboration, member management, subscriptions, and later AI-assisted task workflows.

The MVP is intentionally app-first: a dense, authenticated workspace experience modeled around fast issue triage, tenant-safe data access, and reliable team workflows.

## Required Tools

- Node.js 20 or newer
- npm, using the committed `package-lock.json`
- Git
- Docker Desktop, starting in Milestone 3 when Supabase local development is added

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Most integration values are placeholders during Milestone 1. Supabase local Docker setup, migrations, and generated database types arrive in Milestone 3. Stripe, Resend, and AI provider configuration are added in later milestones.

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

## Environment Variables

Use `.env.example` as the source of truth for expected configuration. Only variables prefixed with `NEXT_PUBLIC_` may be read by browser code.

Server-only values must stay out of client components, public bundles, logs, and committed files.

## Roadmap

The implementation roadmap lives in `plan.md`, with product intent in `prd.md`. Work one milestone at a time and keep each milestone independently reviewable.
