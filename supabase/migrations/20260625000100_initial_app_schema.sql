create schema if not exists private;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create type public.app_role as enum ('owner', 'admin', 'member');
create type public.member_status as enum ('active', 'invited', 'removed');
create type public.project_status as enum ('planned', 'active', 'paused', 'completed', 'canceled');
create type public.task_priority as enum ('none', 'low', 'medium', 'high', 'urgent');
create type public.billing_plan as enum ('free', 'lite', 'pro');
create type public.billing_status as enum (
  'inactive',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_full_name_length check (
    full_name is null or char_length(full_name) between 1 and 120
  )
);

create table public.workspaces (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null,
  owner_id uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint workspaces_name_length check (char_length(name) between 1 and 120),
  constraint workspaces_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint workspaces_slug_unique unique (slug)
);

create table public.workspace_members (
  id bigint generated always as identity primary key,
  workspace_id bigint not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null default 'member',
  status public.member_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint workspace_members_unique_user unique (workspace_id, user_id)
);

create table public.invitations (
  id bigint generated always as identity primary key,
  workspace_id bigint not null references public.workspaces (id) on delete cascade,
  token_hash text not null,
  email text not null,
  role public.app_role not null default 'member',
  invited_by uuid not null references public.profiles (id) on delete restrict,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint invitations_email_normalized check (email = lower(email)),
  constraint invitations_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint invitations_token_hash_length check (char_length(token_hash) >= 32),
  constraint invitations_token_hash_unique unique (token_hash),
  constraint invitations_terminal_state check (
    accepted_at is null or revoked_at is null
  )
);

create table public.projects (
  id bigint generated always as identity primary key,
  workspace_id bigint not null references public.workspaces (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  status public.project_status not null default 'planned',
  lead_id uuid references public.profiles (id) on delete set null,
  created_by uuid not null references public.profiles (id) on delete restrict,
  sort_order numeric(20, 10) not null default 0,
  start_date date,
  target_date date,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint projects_name_length check (char_length(name) between 1 and 160),
  constraint projects_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint projects_workspace_slug_unique unique (workspace_id, slug),
  constraint projects_target_after_start check (
    start_date is null or target_date is null or target_date >= start_date
  ),
  constraint projects_completed_when_completed check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed')
  )
);

create table public.boards (
  id bigint generated always as identity primary key,
  workspace_id bigint not null references public.workspaces (id) on delete cascade,
  project_id bigint not null references public.projects (id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  sort_order numeric(20, 10) not null default 0,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint boards_name_length check (char_length(name) between 1 and 120),
  constraint boards_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint boards_workspace_slug_unique unique (workspace_id, slug)
);

create table public.board_columns (
  id bigint generated always as identity primary key,
  workspace_id bigint not null references public.workspaces (id) on delete cascade,
  board_id bigint not null references public.boards (id) on delete cascade,
  name text not null,
  sort_order numeric(20, 10) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint board_columns_name_length check (char_length(name) between 1 and 80),
  constraint board_columns_board_order_unique unique (board_id, sort_order)
);

create table public.tasks (
  id bigint generated always as identity primary key,
  workspace_id bigint not null references public.workspaces (id) on delete cascade,
  project_id bigint not null references public.projects (id) on delete cascade,
  board_id bigint not null references public.boards (id) on delete cascade,
  column_id bigint not null references public.board_columns (id) on delete restrict,
  title text not null,
  description text,
  sort_order numeric(20, 10) not null default 0,
  priority public.task_priority not null default 'none',
  due_date date,
  created_by uuid not null references public.profiles (id) on delete restrict,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint tasks_title_length check (char_length(title) between 1 and 240),
  constraint tasks_column_order_unique unique (column_id, sort_order)
);

create table public.task_assignees (
  task_id bigint not null references public.tasks (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  assigned_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (task_id, profile_id)
);

create table public.labels (
  id bigint generated always as identity primary key,
  workspace_id bigint not null references public.workspaces (id) on delete cascade,
  name text not null,
  color text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint labels_name_length check (char_length(name) between 1 and 40),
  constraint labels_color_hex check (color ~ '^#[0-9a-fA-F]{6}$'),
  constraint labels_workspace_name_unique unique (workspace_id, name)
);

create table public.task_labels (
  task_id bigint not null references public.tasks (id) on delete cascade,
  label_id bigint not null references public.labels (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (task_id, label_id)
);

create table public.workspace_billing (
  workspace_id bigint primary key references public.workspaces (id) on delete cascade,
  plan public.billing_plan not null default 'free',
  status public.billing_status not null default 'inactive',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint workspace_billing_customer_unique unique (stripe_customer_id),
  constraint workspace_billing_subscription_unique unique (stripe_subscription_id)
);

create table public.stripe_webhook_events (
  id text primary key,
  type text not null,
  payload jsonb not null,
  processed_at timestamptz not null default timezone('utc', now())
);

create index profiles_updated_at_idx on public.profiles (updated_at);
create index workspaces_owner_id_idx on public.workspaces (owner_id);
create index workspace_members_user_id_idx on public.workspace_members (user_id);
create index workspace_members_workspace_id_idx on public.workspace_members (workspace_id);
create index workspace_members_active_lookup_idx
  on public.workspace_members (workspace_id, user_id, role)
  where status = 'active';
create index workspace_members_user_active_idx
  on public.workspace_members (user_id, workspace_id)
  where status = 'active';
create index invitations_workspace_id_idx on public.invitations (workspace_id);
create index invitations_invited_by_idx on public.invitations (invited_by);
create index invitations_pending_email_idx
  on public.invitations (email, workspace_id)
  where accepted_at is null and revoked_at is null;
create index projects_workspace_order_idx on public.projects (workspace_id, sort_order, id);
create index projects_workspace_status_idx on public.projects (workspace_id, status, id);
create index projects_lead_id_idx on public.projects (lead_id);
create index projects_created_by_idx on public.projects (created_by);
create index boards_workspace_order_idx on public.boards (workspace_id, sort_order, id);
create index boards_project_order_idx on public.boards (project_id, sort_order, id);
create index boards_created_by_idx on public.boards (created_by);
create index board_columns_workspace_id_idx on public.board_columns (workspace_id);
create index board_columns_board_order_idx on public.board_columns (board_id, sort_order, id);
create index tasks_workspace_id_idx on public.tasks (workspace_id);
create index tasks_project_id_idx on public.tasks (project_id);
create index tasks_board_id_idx on public.tasks (board_id);
create index tasks_column_order_idx on public.tasks (column_id, sort_order, id);
create index tasks_created_by_idx on public.tasks (created_by);
create index tasks_due_date_idx on public.tasks (workspace_id, due_date) where due_date is not null;
create index task_assignees_profile_id_idx on public.task_assignees (profile_id);
create index task_assignees_assigned_by_idx on public.task_assignees (assigned_by);
create index labels_workspace_id_idx on public.labels (workspace_id);
create index task_labels_label_id_idx on public.task_labels (label_id);
create index workspace_billing_status_idx on public.workspace_billing (status, plan);
create index stripe_webhook_events_type_processed_idx
  on public.stripe_webhook_events (type, processed_at);

create or replace function private.current_user_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select auth.uid();
$$;

create or replace function private.current_user_email()
returns text
language sql
stable
set search_path = ''
as $$
  select lower(coalesce(
    auth.jwt() ->> 'email',
    nullif(current_setting('request.jwt.claim.email', true), ''),
    ''
  ));
$$;

create or replace function private.is_workspace_member(target_workspace_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select private.current_user_id())
      and wm.status = 'active'
  );
$$;

create or replace function private.has_workspace_role(
  target_workspace_id bigint,
  allowed_roles public.app_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select private.current_user_id())
      and wm.status = 'active'
      and wm.role = any(allowed_roles)
  );
$$;

create or replace function private.are_workspace_colleagues(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members mine
    join public.workspace_members theirs
      on theirs.workspace_id = mine.workspace_id
    where mine.user_id = (select private.current_user_id())
      and mine.status = 'active'
      and theirs.user_id = target_profile_id
      and theirs.status = 'active'
  );
$$;

revoke all on function private.current_user_id() from public, anon, authenticated;
revoke all on function private.current_user_email() from public, anon, authenticated;
revoke all on function private.is_workspace_member(bigint) from public, anon, authenticated;
revoke all on function private.has_workspace_role(bigint, public.app_role[]) from public, anon, authenticated;
revoke all on function private.are_workspace_colleagues(uuid) from public, anon, authenticated;
grant execute on function private.current_user_id() to authenticated, service_role;
grant execute on function private.current_user_email() to authenticated, service_role;
grant execute on function private.is_workspace_member(bigint) to authenticated, service_role;
grant execute on function private.has_workspace_role(bigint, public.app_role[]) to authenticated, service_role;
grant execute on function private.are_workspace_colleagues(uuid) to authenticated, service_role;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger workspaces_set_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();
create trigger workspace_members_set_updated_at
  before update on public.workspace_members
  for each row execute function public.set_updated_at();
create trigger invitations_set_updated_at
  before update on public.invitations
  for each row execute function public.set_updated_at();
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();
create trigger boards_set_updated_at
  before update on public.boards
  for each row execute function public.set_updated_at();
create trigger board_columns_set_updated_at
  before update on public.board_columns
  for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();
create trigger labels_set_updated_at
  before update on public.labels
  for each row execute function public.set_updated_at();
create trigger workspace_billing_set_updated_at
  before update on public.workspace_billing
  for each row execute function public.set_updated_at();

create or replace function public.prevent_last_owner_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  remaining_owner_count integer;
begin
  if tg_op = 'DELETE' then
    if old.role = 'owner' and old.status = 'active' then
      select count(*)
      into remaining_owner_count
      from public.workspace_members wm
      where wm.workspace_id = old.workspace_id
        and wm.id <> old.id
        and wm.role = 'owner'
        and wm.status = 'active';

      if remaining_owner_count = 0 then
        raise exception 'Cannot remove the last active workspace owner';
      end if;
    end if;

    return old;
  end if;

  if old.role = 'owner'
    and old.status = 'active'
    and (new.role <> 'owner' or new.status <> 'active')
  then
    select count(*)
    into remaining_owner_count
    from public.workspace_members wm
    where wm.workspace_id = old.workspace_id
      and wm.id <> old.id
      and wm.role = 'owner'
      and wm.status = 'active';

    if remaining_owner_count = 0 then
      raise exception 'Cannot demote or deactivate the last active workspace owner';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_last_owner_change() from public, anon, authenticated;

create trigger workspace_members_prevent_last_owner_update
  before update on public.workspace_members
  for each row execute function public.prevent_last_owner_change();
create trigger workspace_members_prevent_last_owner_delete
  before delete on public.workspace_members
  for each row execute function public.prevent_last_owner_change();

create or replace function public.ensure_project_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.lead_id is not null and not exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = new.workspace_id
      and wm.user_id = new.lead_id
      and wm.status = 'active'
  ) then
    raise exception 'Project lead must be an active workspace member';
  end if;

  if not exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = new.workspace_id
      and wm.user_id = new.created_by
      and wm.status = 'active'
  ) then
    raise exception 'Project creator must be an active workspace member';
  end if;

  return new;
end;
$$;

revoke all on function public.ensure_project_scope() from public, anon, authenticated;

create trigger projects_scope_check
  before insert or update on public.projects
  for each row execute function public.ensure_project_scope();

create or replace function public.ensure_board_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actual_project_workspace_id bigint;
begin
  select p.workspace_id
  into actual_project_workspace_id
  from public.projects p
  where p.id = new.project_id;

  if actual_project_workspace_id is null
    or actual_project_workspace_id <> new.workspace_id
  then
    raise exception 'Board project workspace does not match board workspace';
  end if;

  return new;
end;
$$;

revoke all on function public.ensure_board_scope() from public, anon, authenticated;

create trigger boards_scope_check
  before insert or update on public.boards
  for each row execute function public.ensure_board_scope();

create or replace function public.ensure_board_column_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actual_workspace_id bigint;
begin
  select b.workspace_id
  into actual_workspace_id
  from public.boards b
  where b.id = new.board_id;

  if actual_workspace_id is null or actual_workspace_id <> new.workspace_id then
    raise exception 'Board column workspace does not match board workspace';
  end if;

  return new;
end;
$$;

revoke all on function public.ensure_board_column_scope() from public, anon, authenticated;

create trigger board_columns_scope_check
  before insert or update on public.board_columns
  for each row execute function public.ensure_board_column_scope();

create or replace function public.ensure_task_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actual_board_workspace_id bigint;
  actual_board_project_id bigint;
  actual_project_workspace_id bigint;
  actual_column_board_id bigint;
  actual_column_workspace_id bigint;
begin
  select b.workspace_id, b.project_id
  into actual_board_workspace_id, actual_board_project_id
  from public.boards b
  where b.id = new.board_id;

  select p.workspace_id
  into actual_project_workspace_id
  from public.projects p
  where p.id = new.project_id;

  select c.board_id, c.workspace_id
  into actual_column_board_id, actual_column_workspace_id
  from public.board_columns c
  where c.id = new.column_id;

  if actual_board_workspace_id is null
    or actual_board_workspace_id <> new.workspace_id
    or actual_project_workspace_id <> new.workspace_id
    or actual_board_project_id <> new.project_id
    or actual_column_workspace_id <> new.workspace_id
    or actual_column_board_id <> new.board_id
  then
    raise exception 'Task workspace, project, board, and column must match';
  end if;

  return new;
end;
$$;

revoke all on function public.ensure_task_scope() from public, anon, authenticated;

create trigger tasks_scope_check
  before insert or update on public.tasks
  for each row execute function public.ensure_task_scope();

create or replace function public.ensure_task_assignee_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  task_workspace_id bigint;
begin
  select t.workspace_id
  into task_workspace_id
  from public.tasks t
  where t.id = new.task_id;

  if not exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = task_workspace_id
      and wm.user_id = new.profile_id
      and wm.status = 'active'
  ) then
    raise exception 'Task assignee must be an active workspace member';
  end if;

  return new;
end;
$$;

revoke all on function public.ensure_task_assignee_scope() from public, anon, authenticated;

create trigger task_assignees_scope_check
  before insert or update on public.task_assignees
  for each row execute function public.ensure_task_assignee_scope();

create or replace function public.ensure_task_label_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  task_workspace_id bigint;
  label_workspace_id bigint;
begin
  select t.workspace_id
  into task_workspace_id
  from public.tasks t
  where t.id = new.task_id;

  select l.workspace_id
  into label_workspace_id
  from public.labels l
  where l.id = new.label_id;

  if task_workspace_id is null
    or label_workspace_id is null
    or task_workspace_id <> label_workspace_id
  then
    raise exception 'Task label must belong to the same workspace as the task';
  end if;

  return new;
end;
$$;

revoke all on function public.ensure_task_label_scope() from public, anon, authenticated;

create trigger task_labels_scope_check
  before insert or update on public.task_labels
  for each row execute function public.ensure_task_label_scope();

create or replace function public.move_task(
  p_task_id bigint,
  p_target_column_id bigint,
  p_new_sort_order numeric
)
returns public.tasks
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_task public.tasks;
  target_column public.board_columns;
  updated_task public.tasks;
begin
  select *
  into target_task
  from public.tasks
  where id = p_task_id
  for update;

  if target_task.id is null then
    raise exception 'Task not found';
  end if;

  select *
  into target_column
  from public.board_columns
  where id = p_target_column_id;

  if target_column.id is null then
    raise exception 'Target column not found';
  end if;

  if target_column.workspace_id <> target_task.workspace_id
    or target_column.board_id <> target_task.board_id
  then
    raise exception 'Target column does not belong to the task board';
  end if;

  if not (select private.is_workspace_member(target_task.workspace_id)) then
    raise exception 'Not authorized to move this task';
  end if;

  update public.tasks
  set column_id = target_column.id,
      sort_order = p_new_sort_order,
      updated_at = timezone('utc', now())
  where id = target_task.id
  returning * into updated_task;

  return updated_task;
end;
$$;

revoke all on function public.move_task(bigint, bigint, numeric) from public, anon;
grant execute on function public.move_task(bigint, bigint, numeric) to authenticated, service_role;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.invitations enable row level security;
alter table public.projects enable row level security;
alter table public.boards enable row level security;
alter table public.board_columns enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.labels enable row level security;
alter table public.task_labels enable row level security;
alter table public.workspace_billing enable row level security;
alter table public.stripe_webhook_events enable row level security;

alter table public.profiles force row level security;
alter table public.workspaces force row level security;
alter table public.workspace_members force row level security;
alter table public.invitations force row level security;
alter table public.projects force row level security;
alter table public.boards force row level security;
alter table public.board_columns force row level security;
alter table public.tasks force row level security;
alter table public.task_assignees force row level security;
alter table public.labels force row level security;
alter table public.task_labels force row level security;
alter table public.workspace_billing force row level security;
alter table public.stripe_webhook_events force row level security;

create policy profiles_select_visible on public.profiles
  for select to authenticated
  using (
    id = (select private.current_user_id())
    or (select private.are_workspace_colleagues(id))
  );

create policy profiles_insert_self on public.profiles
  for insert to authenticated
  with check (id = (select private.current_user_id()));

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = (select private.current_user_id()))
  with check (id = (select private.current_user_id()));

create policy workspaces_select_member on public.workspaces
  for select to authenticated
  using ((select private.is_workspace_member(id)));

create policy workspaces_insert_owner on public.workspaces
  for insert to authenticated
  with check (owner_id = (select private.current_user_id()));

create policy workspaces_update_admin on public.workspaces
  for update to authenticated
  using ((select private.has_workspace_role(id, array['owner', 'admin']::public.app_role[])))
  with check ((select private.has_workspace_role(id, array['owner', 'admin']::public.app_role[])));

create policy workspaces_delete_owner on public.workspaces
  for delete to authenticated
  using ((select private.has_workspace_role(id, array['owner']::public.app_role[])));

create policy workspace_members_select_member on public.workspace_members
  for select to authenticated
  using ((select private.is_workspace_member(workspace_id)));

create policy workspace_members_insert_admin on public.workspace_members
  for insert to authenticated
  with check (
    (
      role = 'owner'
      and status = 'active'
      and user_id = (select private.current_user_id())
      and exists (
        select 1
        from public.workspaces w
        where w.id = workspace_id
          and w.owner_id = (select private.current_user_id())
      )
    )
    or (select private.has_workspace_role(workspace_id, array['owner', 'admin']::public.app_role[]))
  );

create policy workspace_members_update_admin on public.workspace_members
  for update to authenticated
  using ((select private.has_workspace_role(workspace_id, array['owner', 'admin']::public.app_role[])))
  with check ((select private.has_workspace_role(workspace_id, array['owner', 'admin']::public.app_role[])));

create policy workspace_members_delete_admin_or_self on public.workspace_members
  for delete to authenticated
  using (
    user_id = (select private.current_user_id())
    or (select private.has_workspace_role(workspace_id, array['owner', 'admin']::public.app_role[]))
  );

create policy invitations_select_admin_or_recipient on public.invitations
  for select to authenticated
  using (
    (select private.has_workspace_role(workspace_id, array['owner', 'admin']::public.app_role[]))
    or email = (select private.current_user_email())
  );

create policy invitations_insert_admin on public.invitations
  for insert to authenticated
  with check (
    invited_by = (select private.current_user_id())
    and (select private.has_workspace_role(workspace_id, array['owner', 'admin']::public.app_role[]))
  );

create policy invitations_update_admin_or_recipient on public.invitations
  for update to authenticated
  using (
    (select private.has_workspace_role(workspace_id, array['owner', 'admin']::public.app_role[]))
    or email = (select private.current_user_email())
  )
  with check (
    (select private.has_workspace_role(workspace_id, array['owner', 'admin']::public.app_role[]))
    or email = (select private.current_user_email())
  );

create policy invitations_delete_admin on public.invitations
  for delete to authenticated
  using ((select private.has_workspace_role(workspace_id, array['owner', 'admin']::public.app_role[])));

create policy projects_member_all on public.projects
  for all to authenticated
  using ((select private.is_workspace_member(workspace_id)))
  with check ((select private.is_workspace_member(workspace_id)));

create policy boards_member_all on public.boards
  for all to authenticated
  using ((select private.is_workspace_member(workspace_id)))
  with check ((select private.is_workspace_member(workspace_id)));

create policy board_columns_member_all on public.board_columns
  for all to authenticated
  using ((select private.is_workspace_member(workspace_id)))
  with check ((select private.is_workspace_member(workspace_id)));

create policy tasks_member_all on public.tasks
  for all to authenticated
  using ((select private.is_workspace_member(workspace_id)))
  with check ((select private.is_workspace_member(workspace_id)));

create policy task_assignees_member_all on public.task_assignees
  for all to authenticated
  using (
    exists (
      select 1
      from public.tasks t
      where t.id = task_id
        and (select private.is_workspace_member(t.workspace_id))
    )
  )
  with check (
    exists (
      select 1
      from public.tasks t
      where t.id = task_id
        and (select private.is_workspace_member(t.workspace_id))
    )
  );

create policy labels_member_all on public.labels
  for all to authenticated
  using ((select private.is_workspace_member(workspace_id)))
  with check ((select private.is_workspace_member(workspace_id)));

create policy task_labels_member_all on public.task_labels
  for all to authenticated
  using (
    exists (
      select 1
      from public.tasks t
      where t.id = task_id
        and (select private.is_workspace_member(t.workspace_id))
    )
  )
  with check (
    exists (
      select 1
      from public.tasks t
      where t.id = task_id
        and (select private.is_workspace_member(t.workspace_id))
    )
  );

create policy workspace_billing_select_member on public.workspace_billing
  for select to authenticated
  using ((select private.is_workspace_member(workspace_id)));

create policy workspace_billing_manage_owner on public.workspace_billing
  for all to authenticated
  using ((select private.has_workspace_role(workspace_id, array['owner']::public.app_role[])))
  with check ((select private.has_workspace_role(workspace_id, array['owner']::public.app_role[])));

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
grant execute on function public.set_updated_at() to service_role;
grant execute on function public.prevent_last_owner_change() to service_role;
grant execute on function public.ensure_project_scope() to service_role;
grant execute on function public.ensure_board_scope() to service_role;
grant execute on function public.ensure_board_column_scope() to service_role;
grant execute on function public.ensure_task_scope() to service_role;
grant execute on function public.ensure_task_assignee_scope() to service_role;
grant execute on function public.ensure_task_label_scope() to service_role;
