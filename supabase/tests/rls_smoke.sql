-- Run after `npm run supabase:reset` with:
-- psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/tests/rls_smoke.sql

begin;

create extension if not exists pgtap with schema extensions;

select plan(29);

insert into auth.users (id, email)
values
  ('00000000-0000-0000-0000-000000000001', 'owner-a@example.com'),
  ('00000000-0000-0000-0000-000000000002', 'member-a@example.com'),
  ('00000000-0000-0000-0000-000000000003', 'owner-b@example.com'),
  ('00000000-0000-0000-0000-000000000004', 'outsider@example.com'),
  ('00000000-0000-0000-0000-000000000005', 'new-owner@example.com'),
  ('00000000-0000-0000-0000-000000000006', 'new-member@example.com'),
  ('00000000-0000-0000-0000-000000000007', 'admin-a@example.com');

insert into public.profiles (id, full_name)
values
  ('00000000-0000-0000-0000-000000000001', 'Owner A'),
  ('00000000-0000-0000-0000-000000000002', 'Member A'),
  ('00000000-0000-0000-0000-000000000003', 'Owner B'),
  ('00000000-0000-0000-0000-000000000004', 'Outsider'),
  ('00000000-0000-0000-0000-000000000007', 'Admin A');

insert into public.workspaces (id, name, slug, owner_id)
overriding system value
values
  (100, 'Workspace A', 'workspace-a', '00000000-0000-0000-0000-000000000001'),
  (200, 'Workspace B', 'workspace-b', '00000000-0000-0000-0000-000000000003');

insert into public.workspace_members (workspace_id, user_id, role, status)
values
  (100, '00000000-0000-0000-0000-000000000001', 'owner', 'active'),
  (100, '00000000-0000-0000-0000-000000000002', 'member', 'active'),
  (100, '00000000-0000-0000-0000-000000000007', 'admin', 'active'),
  (200, '00000000-0000-0000-0000-000000000003', 'owner', 'active');

insert into public.projects (id, workspace_id, name, slug, status, lead_id, created_by, sort_order)
overriding system value
values
  (100, 100, 'Launch Alpha', 'launch-alpha', 'active', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1000),
  (200, 200, 'Scale Platform', 'scale-platform', 'active', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 1000);

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

select * from finish();

rollback;
