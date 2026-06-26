# Project Milestone Plan

This file is the canonical implementation roadmap for the Linear-style project management app described in `prd.md`. Use `prd.md` for product intent and this file for execution details. Future agents should work one milestone at a time, keep changes scoped to the active milestone, and update this plan only when product or architecture decisions materially change.

## Product Goal

Build a focused project management app for teams that need shared workspaces, kanban boards, task collaboration, member management, paid subscriptions, and later AI-assisted task workflows.

The MVP should feel like a dense, work-focused application, not a marketing-first site. It should prioritize reliable tenant isolation, fast task management, and a polished authenticated workspace experience.

## MVP Priorities

- Workspace creation, onboarding, and invitation-based joining.
- Authenticated app shell with workspace navigation.
- Board list, kanban board, columns, cards, task detail editing, labels, assignees, priorities, and due dates.
- Durable drag/drop ordering with rollback on failed persistence.
- Workspace member management with owner/admin/member roles.
- Strong Supabase RLS tenant isolation from the first database milestone.
- Stripe Billing for workspace-level Lite and Pro subscriptions.

## Non-Goals

- No enterprise SSO, audit logs, SCIM, or advanced organization hierarchy in the MVP.
- No multi-workspace global search until after core board flows are stable.
- No AI features before the workspace, task, team, billing, and email flows are working.
- No client-side-only authorization decisions for protected data.
- No custom payment UI unless Stripe Checkout and Customer Portal are insufficient.

## Milestone Workflow

- Read `prd.md`, this file, and `AGENTS.md` before starting feature work.
- Implement only one milestone at a time unless the user explicitly expands scope.
- Keep each milestone independently reviewable and shippable.
- For Next.js API, routing, caching, server action, or file-structure changes, read the relevant guide in `node_modules/next/dist/docs/` before editing.
- Run the milestone verification checks before considering the milestone complete.
- Prefer updating this roadmap over inventing undocumented architecture during implementation.
- Use available MCP tools for integration planning before implementing Stripe, Supabase, Resend, AI, or other third-party workflows. If no MCP tool is configured, document that and proceed from official docs or local package docs.

## Technical Defaults

- Framework: Next.js 16 App Router with TypeScript.
- Routing: use route groups for public auth pages and the authenticated app shell.
- Proxy: use `proxy.ts`, not `middleware.ts`, only for optimistic route/session redirects. Real authorization belongs in RLS, server actions, route handlers, and server-side data helpers.
- Styling: Tailwind CSS with shadcn/ui components and explicit theme tokens.
- Theme: dark mode by default with a light mode toggle.
- UI density: operational, scannable, and keyboard-accessible.
- Database/Auth: Supabase local-first with Docker, migrations, generated TypeScript database types, and RLS.
- Payments: Stripe Billing with Checkout Sessions and Customer Portal for workspace-level Lite and Pro subscriptions.
- Email: Resend from server-side flows only.
- AI: optional server-side workspace assistant features are post-MVP, server-authorized, logged, and gated by configuration plus subscription plan.
- Testing: start with `npm run lint` and `npm run build`; add Vitest, Playwright, SQL/RLS tests, and webhook tests in the hardening milestone or earlier if risk requires.
- Package manager: npm, matching `package-lock.json`.

## Planned Routes

- `/`: marketing entry for signed-out users or authenticated redirect to the user's current workspace.
- `/login`: public login page.
- `/signup`: public signup page.
- `/onboarding`: authenticated first-run setup for profile and first workspace.
- `/invite/[token]`: invitation acceptance page.
- `/(app)/[workspaceSlug]`: authenticated workspace home.
- `/(app)/[workspaceSlug]/projects`: project list.
- `/(app)/[workspaceSlug]/projects/[projectSlug]`: project overview.
- `/(app)/[workspaceSlug]/boards`: board list.
- `/(app)/[workspaceSlug]/boards/[boardSlug]`: kanban board.
- `/(app)/[workspaceSlug]/settings/members`: team management.
- `/(app)/[workspaceSlug]/settings/billing`: subscription and billing management.
- `/api/stripe/webhook`: Stripe webhook route handler with signed payload verification.
- Server-only route handlers for integrations where server actions are not appropriate.

## Planned Environment Variables

Public client-safe variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Server-only variables:

- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_RESTRICTED_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_LITE_PRICE_ID`
- `STRIPE_PRO_PRICE_ID`
- `RESEND_API_KEY`
- `EMAIL_FROM`

Deferred server-only AI variables:

- AI provider keys required by Milestone 9, if the assistant is enabled.
- Do not expose AI provider keys with `NEXT_PUBLIC_` prefixes.

## Planned Data Model

Use `bigint generated always as identity` for app-owned internal primary keys. Use Supabase Auth UUIDs only when referencing `auth.users`. Use stable slugs for workspace and board URLs. Add uniqueness constraints and indexes that support RLS membership checks and common lookup paths.

Core tables:

- `profiles`: one row per Supabase Auth user, keyed by user UUID.
- `workspaces`: workspace metadata, slug, owner reference, creation timestamps.
- `workspace_members`: workspace membership, user reference, role, status, timestamps.
- `invitations`: invite token hash, email, workspace, role, inviter, expiration, accepted timestamp.
- `projects`: workspace-owned initiatives with slug, status, lead, date range, and ordering metadata.
- `boards`: project-owned boards with workspace reference, slug, and ordering metadata.
- `board_columns`: board-owned columns with position/order.
- `tasks`: workspace, project, board, column, title, description, status/order, priority, due date, creator, timestamps.
- `task_assignees`: task-to-profile assignments.
- `labels`: workspace-owned labels with name and color.
- `task_labels`: task-to-label assignments.

Billing tables:

- `workspace_billing`: workspace subscription plan, Stripe customer ID, Stripe subscription ID, status, current period data, timestamps.
- `stripe_webhook_events`: Stripe event ID, type, processed timestamp, and payload metadata for idempotency and debugging.

Roles:

- `owner`: full workspace administration, billing, member management, and destructive settings.
- `admin`: member invitations, most workspace settings, and board/task administration.
- `member`: board and task collaboration inside the workspace.

RLS and database rules:

- Put helper functions in a private schema that is not exposed through the client API.
- Wrap `auth.uid()` in `select` inside RLS helper functions where appropriate for Supabase performance.
- Use indexed membership lookups for every workspace-scoped policy.
- Block cross-workspace reads and writes by default.
- Validate role transitions and prevent removing or demoting the last owner.
- Prefer atomic SQL functions/RPCs for task reorder and cross-column moves.

## Server-Only Integration Boundaries

- Supabase service role access is server-only and only used in narrow admin flows that cannot use the user session.
- Stripe SDK calls happen only in server actions or route handlers.
- Stripe webhook verification uses the raw request body and `STRIPE_WEBHOOK_SECRET`.
- Resend calls happen only in server actions, route handlers, or background-safe server helpers.
- AI calls happen only in server-authorized actions after workspace membership, configuration, and plan checks.
- Client components may call typed server actions or route handlers but must not hold provider secrets or make direct privileged integration calls.

## Cross-Cutting Rules

- Auth: every protected read/write must be authorized by RLS and by server-side checks when business rules exceed simple tenant access.
- Proxy: `proxy.ts` may improve navigation and redirects but is never the final authorization layer.
- Validation: validate all server action and route handler inputs with a shared schema library before writing data.
- Errors: return user-safe error messages, log enough server context for debugging, and avoid leaking workspace IDs, emails, or provider secrets.
- Billing: subscription state must come from Stripe webhooks, not only client redirects after Checkout.
- Email: email send failures should not block account creation or invite creation unless the core workflow depends on delivery.
- Accessibility: all interactive controls need visible focus states, keyboard navigation, labels or accessible names, and sufficient contrast in both themes.
- Performance: keep workspace-scoped queries indexed, avoid unbounded lists, stream or paginate where needed, and keep app shell navigation responsive.
- Security: keep secrets out of source, never expose service role keys, and review RLS whenever new tables or relationships are added.

## Milestone 1: Foundation And Documentation

Objective: remove starter-app assumptions and establish local setup expectations before feature work begins.

Implementation tasks:

- Replace starter metadata and homepage copy with project-specific messaging.
- Remove Create Next App references from user-facing docs and UI.
- Update `README.md` with local development setup, npm commands, and environment prerequisites.
- Add `.env.example` with all planned variables and comments that mark server-only values.
- Confirm `npm run dev`, `npm run build`, `npm run start`, and `npm run lint` scripts exist and are documented.
- Document the local development workflow, including the expectation that Supabase local Docker setup arrives in Milestone 3.

Acceptance criteria:

- No Create Next App references remain in user-facing docs or UI.
- New contributors can identify the project purpose, required tools, npm commands, and env variables.
- The product direction still matches `prd.md`.

Verification checks:

- Search for `Create Next App`, `create-next-app`, starter asset copy, and default template messaging.
- Read `README.md`, `.env.example`, `app/layout.tsx`, and `app/page.tsx`.
- Run `npm run lint` and `npm run build` if app code changed.

## Milestone 2: Design System And App Shell

Objective: establish the reusable UI foundation and authenticated workspace shell.

Implementation tasks:

- Install and configure shadcn/ui according to current Next.js 16 and Tailwind setup.
- Add theme tokens for dark default and light mode.
- Add a persisted theme toggle.
- Build the authenticated app shell under the app route group.
- Include sidebar navigation, top bar, workspace switcher, user menu, and responsive mobile navigation.
- Add loading, empty, and error states that match the dense operational UI direction.
- Use icons for common actions and keep button text concise.

Acceptance criteria:

- The shell is usable on desktop and mobile.
- Focus states and keyboard navigation are visible and accessible.
- The interface reads as a serious project management tool, not a marketing layout.
- Theme switching works without layout shift.

Verification checks:

- Run `npm run lint` and `npm run build`.
- Manually inspect desktop and mobile viewport behavior.
- Confirm no nested cards or oversized marketing hero patterns are used inside the authenticated app.

## Milestone 3: Supabase Local And Data Model

Objective: create the local database foundation with tenant isolation before app data flows are built.

Implementation tasks:

- Add Supabase local Docker configuration and setup documentation.
- Create migrations for all core and billing tables listed in this plan.
- Add constraints, foreign keys, unique indexes, and lookup indexes for workspace slugs, board slugs, task ordering, and membership policies.
- Add `owner`, `admin`, and `member` role handling.
- Add private-schema RLS helper functions for workspace membership and role checks.
- Enable RLS on all app-owned tables.
- Add policies that block cross-workspace reads and writes.
- Add generated TypeScript database types and document the generation command.
- Add an atomic SQL function or RPC for task moves/reorders across columns.

Acceptance criteria:

- Local database resets cleanly from migrations.
- RLS blocks cross-workspace access for reads and writes.
- Membership lookups used by policies are indexed.
- Task reorder persistence can be performed atomically.

Verification checks:

- Run Supabase local reset from migrations.
- Exercise SQL/RLS checks for member, admin, owner, non-member, and anonymous contexts.
- Confirm generated DB types match the migration schema.
- Review `EXPLAIN` output or indexes for membership policy lookup paths where practical.

## Milestone 4: Auth And Onboarding

Objective: let a new user sign up, create or join a workspace, and enter the authenticated shell.

Implementation tasks:

- Add Supabase browser and server auth clients using current Next.js 16 guidance.
- Implement `/login` and `/signup`.
- Implement session-aware redirects with `proxy.ts` for optimistic routing only.
- Implement `/onboarding` for profile completion and first workspace creation.
- Implement `/invite/[token]` for invitation validation and acceptance.
- Create server actions or route handlers for profile, workspace, and invite flows.
- Trigger welcome email through a server-only helper, with safe failure handling.
- Ensure user profile creation is idempotent.

Acceptance criteria:

- A new user can sign up, complete onboarding, create a workspace, and land inside the app shell.
- An invited user can accept an invitation and join the correct workspace.
- Protected routes do not expose workspace data to signed-out users or non-members.

Verification checks:

- Run `npm run lint` and `npm run build`.
- Manually test signup, login, logout, onboarding, and invite acceptance.
- Confirm RLS still blocks direct cross-workspace access.
- Confirm `proxy.ts` is not the only authorization mechanism.

## Milestone 5: Board And Task MVP

Objective: deliver the core project, board, and task collaboration workflow.

Implementation tasks:

- Build `/(app)/[workspaceSlug]/projects` project list.
- Build `/(app)/[workspaceSlug]/projects/[projectSlug]` project overview.
- Build `/(app)/[workspaceSlug]/boards` board list.
- Build `/(app)/[workspaceSlug]/boards/[boardSlug]` kanban board.
- Add project, board, column, and task CRUD.
- Add task cards and a task detail panel or route-backed modal.
- Support assignees, labels, priorities, due dates, descriptions, and task metadata.
- Add optimistic drag/drop for task reorder and column moves.
- Roll back optimistic UI when persistence fails.
- Use server actions or route handlers with shared validation and authorization.
- Keep all queries scoped by workspace and board slugs.
- Keep project, board, and task relationships scoped to one workspace.

Acceptance criteria:

- Workspace members can manage projects inside their workspace.
- Workspace members can manage boards, columns, and tasks inside their workspace.
- Task drag/drop persists ordering and recovers cleanly from failed writes.
- Users cannot view or mutate boards and tasks from other workspaces.

Verification checks:

- Run `npm run lint` and `npm run build`.
- Manually test board creation, task CRUD, label/assignee changes, due dates, and drag/drop.
- Test cross-workspace URL guessing and direct server action misuse.
- Add focused tests for reorder helpers if test infrastructure exists by this point.

## Milestone 6: Team Management

Objective: let owners and admins manage workspace access safely.

Implementation tasks:

- Build `/(app)/[workspaceSlug]/settings/members`.
- Show current members, roles, invitation state, and relevant actions.
- Add invitation creation, resend, revoke, and acceptance flows.
- Add role changes with owner/admin/member permission checks.
- Add member removal.
- Prevent removing or demoting the last owner.
- Keep role and membership mutations server-authorized and RLS-backed.

Acceptance criteria:

- Owners and admins can manage team access only inside their workspace.
- Members cannot invite users, change roles, remove members, or access other workspace membership data.
- The last owner cannot be removed or demoted.

Verification checks:

- Run `npm run lint` and `npm run build`.
- Manually test owner, admin, member, non-member, and invited-user scenarios.
- Verify RLS and server checks agree on allowed role operations.

## Milestone 7: Stripe Billing

Objective: add workspace-level Lite and Pro subscription management with webhook-backed state.

Implementation tasks:

- Use Stripe MCP planner if available before implementation.
- Configure Stripe Billing products and price IDs outside source.
- Add server action or route handler to create Checkout Sessions with `mode: "subscription"`.
- Do not pass `payment_method_types`.
- Use `STRIPE_RESTRICTED_KEY` server-side only.
- Attach workspace and user metadata needed for webhook reconciliation.
- Add Customer Portal session creation for workspace owners.
- Implement `/api/stripe/webhook` with raw body signature verification.
- Store processed Stripe event IDs in `stripe_webhook_events` for idempotency.
- Sync `workspace_billing` from subscription, customer, invoice, and checkout events as needed.
- Gate Lite/Pro features from webhook-backed subscription state.

Acceptance criteria:

- A workspace owner can start a subscription through Checkout.
- A workspace owner can manage billing through the Customer Portal.
- Lite and Pro gates reflect webhook-backed subscription status.
- Replayed webhook events do not duplicate or corrupt state.

Verification checks:

- Run `npm run lint` and `npm run build`.
- Use Stripe CLI or dashboard test events for checkout, subscription update, cancellation, and payment failure flows.
- Verify signature failure returns an error and does not process the event.
- Confirm no Stripe secret is exposed to the client bundle or committed files.

## Milestone 8: Email Notifications

Objective: add reliable server-side transactional email for onboarding and invitations.

Implementation tasks:

- Add Resend server-only client/helper.
- Add welcome email template.
- Add invitation email template with safe invite URLs.
- Add sender configuration through `EMAIL_FROM`.
- Log email failures with enough context to retry or diagnose.
- Make welcome and invite email failure non-blocking unless explicitly required by the flow.

Acceptance criteria:

- Welcome emails send after onboarding without blocking account creation.
- Invitation emails send after invite creation without exposing raw secrets or token hashes.
- Email failures produce user-safe feedback and server-side diagnostics.

Verification checks:

- Run `npm run lint` and `npm run build`.
- Test welcome and invite email sends in a local or sandbox Resend environment.
- Confirm Resend API keys are server-only and absent from client code.

## Milestone 9: AI Features

Objective: add an optional workspace-level AI assistant after core app and billing flows are stable.

Implementation tasks:

- Add a workspace overview Ask AI button and a right-side chat drawer.
- Use a server-only NVIDIA-compatible AI helper with environment-driven configuration.
- Gate AI access by authenticated workspace membership, config availability, and Pro plan status.
- Keep AI context at the workspace summary level for this milestone; do not expose board or task details from the drawer.
- Log AI requests and failures without storing provider secrets or unnecessary sensitive content.
- Provide non-blocking UI states so AI failure does not break normal workflows.

Acceptance criteria:

- AI features are optional and can be disabled by missing configuration or plan gates.
- AI actions cannot access data from other workspaces.
- AI responses are clearly suggestions and do not mutate workspace data.

Verification checks:

- Run `npm run lint` and `npm run build`.
- Test authorized, unauthorized, wrong-plan, missing-provider-key, and disabled-feature scenarios.
- Review prompts and logs for accidental sensitive data exposure.

## Milestone 10: Testing And Hardening

Objective: add durable verification around tenant isolation, core workflows, billing, and task ordering.

Implementation tasks:

- Add Vitest for unit and server helper coverage.
- Add Playwright smoke tests for signup/onboarding, workspace navigation, board/task flow, and billing entry points where practical.
- Add SQL/RLS tests for tenant isolation and role permissions.
- Add Stripe webhook tests for signature verification, idempotency, and subscription sync.
- Add board reorder tests for same-column and cross-column moves.
- Add package scripts for all configured tests.
- Review error boundaries, loading states, empty states, and not-found handling.
- Review performance of workspace-scoped queries and add missing indexes.

Acceptance criteria:

- `npm run lint`, `npm run build`, and configured tests pass.
- Tenant isolation has automated coverage.
- Stripe webhook handling has automated coverage.
- Board reorder behavior has automated coverage.
- The app has clear error, loading, and empty states for primary workflows.

Verification checks:

- Run `npm run lint`.
- Run `npm run build`.
- Run all configured unit, integration, SQL/RLS, and Playwright tests.
- Review coverage gaps and document any intentionally deferred test areas.
