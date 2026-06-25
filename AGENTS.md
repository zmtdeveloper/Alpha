# Repository Guidelines

## Project Structure & Module Organization

This is a private Next.js 16 application using the App Router. Application code lives in `app/`: `layout.tsx` defines the root shell, `page.tsx` is the home route, and `globals.css` contains global Tailwind styles. Static assets belong in `public/` and are served from the site root, for example `/next.svg`. Root configuration includes `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, and `postcss.config.mjs`. Generated output such as `.next/` and dependencies in `node_modules/` should not be edited or committed.

## Build, Test, and Development Commands

Use npm, matching the committed `package-lock.json`.

- `npm run dev`: starts the local Next.js development server.
- `npm run build`: creates a production build and runs Next.js validation.
- `npm run start`: serves the production build after `npm run build`.
- `npm run lint`: runs ESLint with Next.js core web vitals and TypeScript rules.

## Coding Style & Naming Conventions

Write TypeScript and React function components. Keep route files lowercase where Next.js requires them, such as `page.tsx` and `layout.tsx`; use PascalCase for reusable components if new component files are added. Prefer the `@/*` path alias from `tsconfig.json` for cross-folder imports. Follow the existing two-space indentation, double quotes in JavaScript/TypeScript config files, and Tailwind utility classes for styling. Run `npm run lint` before submitting changes.

## Testing Guidelines

No test framework is currently configured. For now, rely on `npm run lint` and `npm run build` as required checks. When adding tests, colocate them near the code they cover or use a top-level `tests/` directory, and name files with a clear pattern such as `*.test.ts` or `*.test.tsx`. Add the test command to `package.json` in the same change.

## Commit & Pull Request Guidelines

The current Git history uses short, title-case summaries such as `Initial Structure`. Keep commit messages concise and imperative. Pull requests should include a short description, validation steps run, linked issues when relevant, and screenshots or screen recordings for visible UI changes.

## Agent-Specific Instructions

This repository uses a newer Next.js version with breaking changes. Before changing Next.js APIs, routing conventions, or file structure, read the relevant guide in `node_modules/next/dist/docs/` and follow any deprecation notes.

## Project Roadmap Workflow

- Read `prd.md` and `plan.md` before starting feature work.
- Work on one milestone at a time and keep changes scoped to that milestone.
- For Next.js changes, read the relevant guide in `node_modules/next/dist/docs/` before editing framework APIs, routing conventions, or file structure.
- Use `proxy.ts`, not `middleware.ts`, and do not rely on proxy as the only authorization layer.
- For Supabase, enforce tenant access with RLS and indexed membership policies.
- For Stripe, use Billing and Checkout Sessions, verify webhooks, keep secrets out of source, and do not pass `payment_method_types`.
- For integrations, use available MCP tools before implementation.
