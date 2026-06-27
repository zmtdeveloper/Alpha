-- Run after `npm run supabase:reset` with:
-- psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/tests/rls_smoke.sql

begin;

create extension if not exists pgtap with schema extensions;

select plan(62);

insert into auth.users (id, email)
values
  ('00000000-0000-0000-0000-000000000001', 'owner-a@example.com'),
  ('00000000-0000-0000-0000-000000000002', 'member-a@example.com'),
  ('00000000-0000-0000-0000-000000000003', 'owner-b@example.com'),
  ('00000000-0000-0000-0000-000000000004', 'outsider@example.com'),
  ('00000000-0000-0000-0000-000000000005', 'new-owner@example.com'),
  ('00000000-0000-0000-0000-000000000006', 'new-member@example.com'),
  ('00000000-0000-0000-0000-000000000007', 'admin-a@example.com'),
  ('00000000-0000-0000-0000-000000000008', 'free-owner@example.com'),
  ('00000000-0000-0000-0000-000000000009', 'free-invitee@example.com'),
  ('00000000-0000-0000-0000-000000000010', 'lite-owner@example.com'),
  ('00000000-0000-0000-0000-000000000011', 'lite-member-one@example.com'),
  ('00000000-0000-0000-0000-000000000012', 'lite-member-two@example.com'),
  ('00000000-0000-0000-0000-000000000013', 'lite-member-three@example.com'),
  ('00000000-0000-0000-0000-000000000014', 'pro-owner@example.com'),
  ('00000000-0000-0000-0000-000000000015', 'pro-member@example.com'),
  ('00000000-0000-0000-0000-000000000016', 'past-due-owner@example.com');

insert into public.profiles (id, full_name)
values
  ('00000000-0000-0000-0000-000000000001', 'Owner A'),
  ('00000000-0000-0000-0000-000000000002', 'Member A'),
  ('00000000-0000-0000-0000-000000000003', 'Owner B'),
  ('00000000-0000-0000-0000-000000000004', 'Outsider'),
  ('00000000-0000-0000-0000-000000000007', 'Admin A'),
  ('00000000-0000-0000-0000-000000000008', 'Free Owner'),
  ('00000000-0000-0000-0000-000000000009', 'Free Invitee'),
  ('00000000-0000-0000-0000-000000000010', 'Lite Owner'),
  ('00000000-0000-0000-0000-000000000011', 'Lite Member One'),
  ('00000000-0000-0000-0000-000000000012', 'Lite Member Two'),
  ('00000000-0000-0000-0000-000000000013', 'Lite Member Three'),
  ('00000000-0000-0000-0000-000000000014', 'Pro Owner'),
  ('00000000-0000-0000-0000-000000000015', 'Pro Member'),
  ('00000000-0000-0000-0000-000000000016', 'Past Due Owner');

insert into public.workspaces (id, name, slug, owner_id)
overriding system value
values
  (100, 'Workspace A', 'workspace-a', '00000000-0000-0000-0000-000000000001'),
  (200, 'Workspace B', 'workspace-b', '00000000-0000-0000-0000-000000000003'),
  (300, 'Free Limits', 'free-limits', '00000000-0000-0000-0000-000000000008'),
  (301, 'Free Accept Limits', 'free-accept-limits', '00000000-0000-0000-0000-000000000008'),
  (400, 'Lite Limits', 'lite-limits', '00000000-0000-0000-0000-000000000010'),
  (401, 'Lite Pending Limits', 'lite-pending-limits', '00000000-0000-0000-0000-000000000010'),
  (500, 'Pro Limits', 'pro-limits', '00000000-0000-0000-0000-000000000014'),
  (600, 'Past Due Limits', 'past-due-limits', '00000000-0000-0000-0000-000000000016');

insert into public.workspace_billing (workspace_id, plan, status)
values
  (100, 'pro', 'active'),
  (200, 'free', 'inactive'),
  (300, 'free', 'inactive'),
  (301, 'lite', 'active'),
  (400, 'lite', 'active'),
  (401, 'lite', 'active'),
  (500, 'pro', 'active'),
  (600, 'pro', 'active')
on conflict (workspace_id) do update
set plan = excluded.plan,
    status = excluded.status;

insert into public.workspace_members (workspace_id, user_id, role, status)
values
  (100, '00000000-0000-0000-0000-000000000001', 'owner', 'active'),
  (100, '00000000-0000-0000-0000-000000000002', 'member', 'active'),
  (100, '00000000-0000-0000-0000-000000000007', 'admin', 'active'),
  (200, '00000000-0000-0000-0000-000000000003', 'owner', 'active'),
  (300, '00000000-0000-0000-0000-000000000008', 'owner', 'active'),
  (301, '00000000-0000-0000-0000-000000000008', 'owner', 'active'),
  (400, '00000000-0000-0000-0000-000000000010', 'owner', 'active'),
  (400, '00000000-0000-0000-0000-000000000011', 'member', 'active'),
  (400, '00000000-0000-0000-0000-000000000012', 'member', 'active'),
  (401, '00000000-0000-0000-0000-000000000010', 'owner', 'active'),
  (401, '00000000-0000-0000-0000-000000000011', 'member', 'active'),
  (500, '00000000-0000-0000-0000-000000000014', 'owner', 'active'),
  (600, '00000000-0000-0000-0000-000000000016', 'owner', 'active');

insert into public.projects (id, workspace_id, name, slug, status, lead_id, created_by, sort_order)
overriding system value
values
  (100, 100, 'Launch Alpha', 'launch-alpha', 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1000),
  (200, 200, 'Scale Platform', 'scale-platform', 'active', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 1000),
  (300, 300, 'Free Project', 'free-project', 'active', '00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000008', 1000),
  (6001, 600, 'Past Due One', 'past-due-one', 'active', '00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000016', 1000),
  (6002, 600, 'Past Due Two', 'past-due-two', 'active', '00000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000016', 2000);

insert into public.projects (id, workspace_id, name, slug, status, lead_id, created_by, sort_order)
overriding system value
select
  4000 + item_index,
  400,
  'Lite Project ' || item_index::text,
  'lite-project-' || item_index::text,
  'active',
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000010',
  item_index * 1000
from generate_series(1, 10) as series(item_index);

insert into public.invitations (workspace_id, token_hash, email, role, invited_by, expires_at)
values
  (301, repeat('e', 64), 'free-invitee@example.com', 'member', '00000000-0000-0000-0000-000000000008', now() + interval '7 days'),
  (401, repeat('f', 64), 'lite-pending@example.com', 'member', '00000000-0000-0000-0000-000000000010', now() + interval '7 days');

update public.workspace_billing
set plan = 'free',
    status = 'inactive'
where workspace_id = 301;

update public.workspace_billing
set status = 'past_due'
where workspace_id = 600;

insert into public.boards (id, workspace_id, project_id, name, slug, created_by)
overriding system value
values
  (1000, 100, 100, 'Product', 'product', '00000000-0000-0000-0000-000000000001'),
  (2000, 200, 200, 'Platform', 'platform', '00000000-0000-0000-0000-000000000003');

insert into public.board_columns (id, workspace_id, board_id, name, sort_order)
overriding system value
values
  (10000, 100, 1000, 'Todo', 1000),
  (10001, 100, 1000, 'Doing', 2000),
  (20000, 200, 2000, 'Todo', 1000);

insert into public.tasks (id, workspace_id, project_id, board_id, column_id, title, sort_order, created_by)
overriding system value
values
  (50000, 100, 100, 1000, 10000, 'Tenant A task', 1000, '00000000-0000-0000-0000-000000000001'),
  (60000, 200, 200, 2000, 20000, 'Tenant B task', 1000, '00000000-0000-0000-0000-000000000003');

set local role anon;

select throws_ok(
  $$select count(*) from public.workspaces$$,
  '42501',
  'permission denied for table workspaces',
  'anonymous users cannot read app tables'
);

select throws_ok(
  $$insert into public.profiles (id)
    values ('00000000-0000-0000-0000-000000000004')$$,
  '42501',
  'permission denied for table profiles',
  'anonymous users cannot write app tables'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000002';
set local "request.jwt.claim.email" = 'member-a@example.com';

select is(
  (select count(*)::int from public.workspaces),
  1,
  'member sees only their workspace'
);

select is(
  (select count(*)::int from public.projects),
  1,
  'member sees only projects in their workspace'
);

select is(
  (select count(*)::int from public.tasks),
  1,
  'member sees only tasks in their workspace'
);

select lives_ok(
  $$select public.move_task(50000, 10001, 1500)$$,
  'member can atomically move a task inside their workspace'
);

select throws_ok(
  $$select public.move_task(60000, 20000, 1500)$$,
  'P0001',
  'Not authorized to move this task',
  'member cannot move a task from another workspace'
);

select throws_ok(
  $$insert into public.tasks (workspace_id, project_id, board_id, column_id, title, created_by)
    values (200, 200, 2000, 20000, 'Cross tenant write', '00000000-0000-0000-0000-000000000002')$$,
  '42501',
  'new row violates row-level security policy for table "tasks"',
  'member cannot write into another workspace'
);

select throws_ok(
  $$insert into public.invitations (workspace_id, token_hash, email, role, invited_by, expires_at)
    values (100, repeat('b', 64), 'blocked-invite@example.com', 'member', '00000000-0000-0000-0000-000000000002', now() + interval '7 days')$$,
  '42501',
  'new row violates row-level security policy for table "invitations"',
  'member cannot create invitations'
);

select throws_ok(
  $$insert into public.boards (workspace_id, project_id, name, slug, created_by)
    values (100, 200, 'Cross project board', 'cross-project-board', '00000000-0000-0000-0000-000000000002')$$,
  'P0001',
  'Board project workspace does not match board workspace',
  'member cannot attach a board to another workspace project'
);

select throws_ok(
  $$insert into public.tasks (workspace_id, project_id, board_id, column_id, title, created_by)
    values (100, 200, 1000, 10000, 'Cross project task', '00000000-0000-0000-0000-000000000002')$$,
  'P0001',
  'Task workspace, project, board, and column must match',
  'member cannot attach a task to the wrong project'
);

select throws_ok(
  $$insert into public.projects (workspace_id, name, slug, status, created_by)
    values (100, 'Forged Project Actor', 'forged-project-actor', 'active', '00000000-0000-0000-0000-000000000001')$$,
  'P0001',
  'Project creator must match current user',
  'member cannot forge project created_by'
);

select throws_ok(
  $$insert into public.boards (workspace_id, project_id, name, slug, created_by)
    values (100, 100, 'Forged Board Actor', 'forged-board-actor', '00000000-0000-0000-0000-000000000001')$$,
  'P0001',
  'Board creator must match current user',
  'member cannot forge board created_by'
);

select throws_ok(
  $$insert into public.tasks (workspace_id, project_id, board_id, column_id, title, created_by)
    values (100, 100, 1000, 10000, 'Forged task actor', '00000000-0000-0000-0000-000000000001')$$,
  'P0001',
  'Task creator must match current user',
  'member cannot forge task created_by'
);

select throws_ok(
  $$insert into public.task_assignees (task_id, profile_id, assigned_by)
    values (50000, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001')$$,
  'P0001',
  'Task assignment actor must match current user',
  'member cannot forge task assignment actor'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000004';
set local "request.jwt.claim.email" = 'outsider@example.com';

select is(
  (select count(*)::int from public.workspaces),
  0,
  'non-member sees no workspaces'
);

select is(
  (select count(*)::int from public.boards),
  0,
  'non-member sees no boards'
);

select is(
  (select count(*)::int from public.projects),
  0,
  'non-member sees no projects'
);

select is(
  (select count(*)::int from public.tasks),
  0,
  'non-member sees no tasks'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000001';
set local "request.jwt.claim.email" = 'owner-a@example.com';

select throws_ok(
  $$delete from public.workspace_members
    where workspace_id = 100
      and user_id = '00000000-0000-0000-0000-000000000001'$$,
  'P0001',
  'Cannot remove the last active workspace owner',
  'last owner cannot be removed'
);

select lives_ok(
  $$insert into public.invitations (workspace_id, token_hash, email, role, invited_by, expires_at)
    values (100, repeat('a', 64), 'new-member@example.com', 'member', '00000000-0000-0000-0000-000000000001', now() + interval '7 days')$$,
  'owner can create invitations'
);

select is(
  (select count(*)::int from public.invitations),
  1,
  'owner sees workspace invitations'
);

select lives_ok(
  $$select * from public.move_task(50000, 10000, 1750)$$,
  'owner can move tasks in their workspace'
);

select lives_ok(
  $$update public.workspace_billing
    set plan = 'free'
    where workspace_id = 100$$,
  'owner direct billing update is filtered by RLS'
);

select is(
  (
    select plan::text
    from public.workspace_billing
    where workspace_id = 100
  ),
  'pro',
  'authenticated clients cannot write workspace billing state'
);

select throws_ok(
  $$insert into public.stripe_webhook_events (id, type, payload)
    values ('evt_auth_blocked', 'test.event', '{}'::jsonb)$$,
  '42501',
  'new row violates row-level security policy for table "stripe_webhook_events"',
  'authenticated clients cannot write Stripe webhook event state'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000007';
set local "request.jwt.claim.email" = 'admin-a@example.com';

select lives_ok(
  $$insert into public.invitations (workspace_id, token_hash, email, role, invited_by, expires_at)
    values (100, repeat('c', 64), 'new-admin@example.com', 'admin', '00000000-0000-0000-0000-000000000007', now() + interval '7 days')$$,
  'admin can invite admins'
);

select throws_ok(
  $$insert into public.invitations (workspace_id, token_hash, email, role, invited_by, expires_at)
    values (100, repeat('d', 64), 'new-owner-invite@example.com', 'owner', '00000000-0000-0000-0000-000000000007', now() + interval '7 days')$$,
  '42501',
  'new row violates row-level security policy for table "invitations"',
  'admin cannot invite owners'
);

select throws_ok(
  $$update public.workspace_members
    set role = 'owner'
    where workspace_id = 100
      and user_id = '00000000-0000-0000-0000-000000000002'$$,
  '42501',
  'new row violates row-level security policy for table "workspace_members"',
  'admin cannot promote members to owner'
);

select lives_ok(
  $$update public.workspace_members
    set role = 'member'
    where workspace_id = 100
      and user_id = '00000000-0000-0000-0000-000000000001'$$,
  'admin owner-row update attempt is filtered by RLS'
);

select is(
  (
    select role::text
    from public.workspace_members
    where workspace_id = 100
      and user_id = '00000000-0000-0000-0000-000000000001'
  ),
  'owner',
  'admin cannot change owner rows'
);

select lives_ok(
  $$update public.workspace_members
    set role = 'admin'
    where workspace_id = 100
      and user_id = '00000000-0000-0000-0000-000000000002'$$,
  'admin can promote members to admin'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000005';
set local "request.jwt.claim.email" = 'new-owner@example.com';

select lives_ok(
  $$select public.create_workspace_for_current_user('New Owner', 'Workspace A', 'workspace-a')$$,
  'new user can create first workspace through onboarding function'
);

select is(
  (
    select slug
    from public.workspaces
    where owner_id = '00000000-0000-0000-0000-000000000005'
  ),
  'workspace-a-2',
  'onboarding function resolves duplicate workspace slugs'
);

select is(
  (
    select role::text
    from public.workspace_members
    where user_id = '00000000-0000-0000-0000-000000000005'
  ),
  'owner',
  'onboarding function creates active owner membership'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000006';
set local "request.jwt.claim.email" = 'new-member@example.com';

select is(
  (select count(*)::int from public.workspaces),
  0,
  'invited user is not a workspace member before acceptance'
);

select is(
  (
    select workspace_slug
    from public.get_workspace_invitation_preview(repeat('a', 64))
  ),
  'workspace-a',
  'invited user can preview a valid invitation without workspace membership'
);

select lives_ok(
  $$update public.invitations
    set accepted_at = timezone('utc', now())
    where token_hash = repeat('a', 64)$$,
  'recipient direct invitation acceptance is filtered by RLS'
);

select is(
  (
    select count(*)::int
    from public.invitations
    where token_hash = repeat('a', 64)
      and accepted_at is not null
  ),
  0,
  'recipient cannot mark an invitation accepted directly'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000004';
set local "request.jwt.claim.email" = 'outsider@example.com';

select is(
  (
    select count(*)::int
    from public.get_workspace_invitation_preview(repeat('a', 64))
  ),
  0,
  'wrong email cannot preview invitation details'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000006';
set local "request.jwt.claim.email" = 'new-member@example.com';

select lives_ok(
  $$select * from public.accept_workspace_invitation(repeat('a', 64))$$,
  'invited user can accept a valid invitation'
);

select is(
  (
    select count(*)::int
    from public.workspace_members
    where workspace_id = 100
      and user_id = '00000000-0000-0000-0000-000000000006'
      and status = 'active'
  ),
  1,
  'invite acceptance creates active member record'
);

select is(
  (
    select count(*)::int
    from public.invitations
    where token_hash = repeat('a', 64)
      and accepted_at is not null
  ),
  1,
  'invite acceptance marks the invitation accepted'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000008';
set local "request.jwt.claim.email" = 'free-owner@example.com';

select throws_ok(
  $$insert into public.invitations (workspace_id, token_hash, email, role, invited_by, expires_at)
    values (300, repeat('g', 64), 'blocked-free@example.com', 'member', '00000000-0000-0000-0000-000000000008', now() + interval '7 days')$$,
  'P0001',
  'Workspace member limit reached for current plan',
  'free plan blocks invitations when the owner already fills the member limit'
);

select throws_ok(
  $$insert into public.projects (workspace_id, name, slug, status, created_by)
    values (300, 'Second Free Project', 'second-free-project', 'active', '00000000-0000-0000-0000-000000000008')$$,
  'P0001',
  'Workspace project limit reached for current plan',
  'free plan blocks a second project'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000009';
set local "request.jwt.claim.email" = 'free-invitee@example.com';

select throws_ok(
  $$select * from public.accept_workspace_invitation(repeat('e', 64))$$,
  'P0001',
  'Workspace member limit reached for current plan',
  'accepting an invite rechecks the free member limit after downgrade'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000010';
set local "request.jwt.claim.email" = 'lite-owner@example.com';

select is(
  (
    select count(*)::int
    from public.workspace_members
    where workspace_id = 400
      and status = 'active'
  ),
  3,
  'lite plan allows three active users total'
);

select is(
  (
    select count(*)::int
    from public.projects
    where workspace_id = 400
  ),
  10,
  'lite plan allows ten projects'
);

select throws_ok(
  $$insert into public.invitations (workspace_id, token_hash, email, role, invited_by, expires_at)
    values (400, repeat('h', 64), 'blocked-lite@example.com', 'member', '00000000-0000-0000-0000-000000000010', now() + interval '7 days')$$,
  'P0001',
  'Workspace member limit reached for current plan',
  'lite plan blocks the fourth user via invitation'
);

select throws_ok(
  $$insert into public.workspace_members (workspace_id, user_id, role, status)
    values (400, '00000000-0000-0000-0000-000000000013', 'member', 'active')$$,
  'P0001',
  'Workspace member limit reached for current plan',
  'lite plan blocks the fourth active member'
);

select throws_ok(
  $$insert into public.projects (workspace_id, name, slug, status, created_by)
    values (400, 'Lite Project 11', 'lite-project-11', 'active', '00000000-0000-0000-0000-000000000010')$$,
  'P0001',
  'Workspace project limit reached for current plan',
  'lite plan blocks the eleventh project'
);

select throws_ok(
  $$insert into public.invitations (workspace_id, token_hash, email, role, invited_by, expires_at)
    values (401, repeat('i', 64), 'blocked-lite-pending@example.com', 'member', '00000000-0000-0000-0000-000000000010', now() + interval '7 days')$$,
  'P0001',
  'Workspace member limit reached for current plan',
  'pending invitations reserve lite member capacity'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000014';
set local "request.jwt.claim.email" = 'pro-owner@example.com';

select lives_ok(
  $$insert into public.workspace_members (workspace_id, user_id, role, status)
    values (500, '00000000-0000-0000-0000-000000000015', 'member', 'active')$$,
  'pro plan allows additional active members'
);

select lives_ok(
  $$insert into public.projects (workspace_id, name, slug, status, created_by)
    values (500, 'Pro Project', 'pro-project', 'active', '00000000-0000-0000-0000-000000000014')$$,
  'pro plan allows additional projects'
);

reset role;
set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000016';
set local "request.jwt.claim.email" = 'past-due-owner@example.com';

select is(
  (
    select count(*)::int
    from public.projects
    where workspace_id = 600
  ),
  2,
  'past due workspaces keep existing projects'
);

select throws_ok(
  $$insert into public.projects (workspace_id, name, slug, status, created_by)
    values (600, 'Past Due New Project', 'past-due-new-project', 'active', '00000000-0000-0000-0000-000000000016')$$,
  'P0001',
  'Workspace project limit reached for current plan',
  'past due subscriptions use free project limits for new projects'
);

select throws_ok(
  $$insert into public.invitations (workspace_id, token_hash, email, role, invited_by, expires_at)
    values (600, repeat('j', 64), 'blocked-past-due@example.com', 'member', '00000000-0000-0000-0000-000000000016', now() + interval '7 days')$$,
  'P0001',
  'Workspace member limit reached for current plan',
  'past due subscriptions use free member limits for new invitations'
);

reset role;

select is(
  (
    select count(*)::int
    from pg_class c
    join pg_namespace n
      on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = any(array[
        'profiles',
        'workspaces',
        'workspace_members',
        'invitations',
        'projects',
        'boards',
        'board_columns',
        'tasks',
        'task_assignees',
        'labels',
        'task_labels',
        'workspace_billing',
        'stripe_webhook_events'
      ])
      and (not c.relrowsecurity or not c.relforcerowsecurity)
  ),
  0,
  'all app-owned public tables have RLS enabled and forced'
);

select is(
  (
    select count(*)::int
    from (
      select c.relname
      from pg_class c
      join pg_namespace n
        on n.oid = c.relnamespace
      left join pg_policy p
        on p.polrelid = c.oid
      where n.nspname = 'public'
        and c.relname = any(array[
          'profiles',
          'workspaces',
          'workspace_members',
          'invitations',
          'projects',
          'boards',
          'board_columns',
          'tasks',
          'task_assignees',
          'labels',
          'task_labels',
          'workspace_billing'
        ])
      group by c.relname
      having count(p.oid) = 0
    ) policyless_tables
  ),
  0,
  'all client-readable app tables have at least one RLS policy'
);

select is(
  (
    select count(*)::int
    from pg_class c
    join pg_namespace n
      on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = any(array[
        'profiles',
        'workspaces',
        'workspace_members',
        'invitations',
        'projects',
        'boards',
        'board_columns',
        'tasks',
        'task_assignees',
        'labels',
        'task_labels',
        'workspace_billing',
        'stripe_webhook_events'
      ])
      and (
        has_table_privilege('anon', c.oid, 'select')
        or has_table_privilege('anon', c.oid, 'insert')
        or has_table_privilege('anon', c.oid, 'update')
        or has_table_privilege('anon', c.oid, 'delete')
      )
  ),
  0,
  'anonymous role has no direct app table privileges'
);

select is(
  (
    select count(*)::int
    from pg_proc p
    join pg_namespace n
      on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and has_function_privilege('anon', p.oid, 'execute')
  ),
  0,
  'anonymous role cannot execute public SECURITY DEFINER functions'
);

select is(
  (
    select count(*)::int
    from pg_proc p
    join pg_namespace n
      on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and has_function_privilege('authenticated', p.oid, 'execute')
      and (p.proname, pg_get_function_identity_arguments(p.oid)) not in (
        ('accept_workspace_invitation', 'p_token_hash text'),
        ('create_workspace_for_current_user', 'p_full_name text, p_workspace_name text, p_workspace_slug text'),
        ('get_workspace_invitation_preview', 'p_token_hash text'),
        ('move_task', 'p_task_id bigint, p_target_column_id bigint, p_new_sort_order numeric')
      )
  ),
  0,
  'authenticated public SECURITY DEFINER RPCs stay inside the explicit allowlist'
);

select * from finish();

rollback;
