alter type public.billing_status add value if not exists 'incomplete';
alter type public.billing_status add value if not exists 'incomplete_expired';
alter type public.billing_status add value if not exists 'paused';

alter table public.workspace_billing
  add column if not exists stripe_price_id text,
  add column if not exists last_stripe_event_id text,
  add column if not exists last_stripe_event_created timestamptz;

alter table public.stripe_webhook_events
  add column if not exists event_created timestamptz;

create index if not exists workspace_billing_price_idx
  on public.workspace_billing (stripe_price_id)
  where stripe_price_id is not null;

create index if not exists workspace_billing_last_event_idx
  on public.workspace_billing (last_stripe_event_created);

create index if not exists stripe_webhook_events_created_idx
  on public.stripe_webhook_events (event_created);

insert into public.workspace_billing (workspace_id, plan, status)
select w.id, 'free', 'inactive'
from public.workspaces w
on conflict (workspace_id) do nothing;

drop policy if exists workspace_billing_manage_owner on public.workspace_billing;

create or replace function private.effective_billing_plan(
  target_workspace_id bigint
)
returns public.billing_plan
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select case
        when wb.status in ('active', 'trialing') and wb.plan in ('lite', 'pro')
          then wb.plan
        else 'free'::public.billing_plan
      end
      from public.workspace_billing wb
      where wb.workspace_id = target_workspace_id
    ),
    'free'::public.billing_plan
  );
$$;

create or replace function private.workspace_member_limit(
  target_plan public.billing_plan
)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case target_plan
    when 'free' then 1
    when 'lite' then 3
    when 'pro' then null
  end;
$$;

create or replace function private.workspace_project_limit(
  target_plan public.billing_plan
)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case target_plan
    when 'free' then 1
    when 'lite' then 10
    when 'pro' then null
  end;
$$;

create or replace function private.lock_workspace_limits(
  target_workspace_id bigint
)
returns void
language plpgsql
volatile
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(target_workspace_id);
end;
$$;

create or replace function private.assert_active_member_capacity(
  target_workspace_id bigint,
  excluded_member_id bigint default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_count integer;
  member_limit integer;
begin
  perform private.lock_workspace_limits(target_workspace_id);

  member_limit := private.workspace_member_limit(
    private.effective_billing_plan(target_workspace_id)
  );

  if member_limit is null then
    return;
  end if;

  select count(*)::integer
  into active_count
  from public.workspace_members wm
  where wm.workspace_id = target_workspace_id
    and wm.status = 'active'
    and (excluded_member_id is null or wm.id <> excluded_member_id);

  if active_count >= member_limit then
    raise exception 'Workspace member limit reached for current plan'
      using errcode = 'P0001';
  end if;
end;
$$;

create or replace function private.assert_pending_invitation_capacity(
  target_workspace_id bigint,
  excluded_invitation_id bigint default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_count integer;
  member_limit integer;
  pending_invitation_count integer;
begin
  perform private.lock_workspace_limits(target_workspace_id);

  member_limit := private.workspace_member_limit(
    private.effective_billing_plan(target_workspace_id)
  );

  if member_limit is null then
    return;
  end if;

  select count(*)::integer
  into active_count
  from public.workspace_members wm
  where wm.workspace_id = target_workspace_id
    and wm.status = 'active';

  select count(*)::integer
  into pending_invitation_count
  from public.invitations i
  where i.workspace_id = target_workspace_id
    and i.accepted_at is null
    and i.revoked_at is null
    and i.expires_at > timezone('utc', now())
    and (
      excluded_invitation_id is null
      or i.id <> excluded_invitation_id
    );

  if active_count + pending_invitation_count + 1 > member_limit then
    raise exception 'Workspace member limit reached for current plan'
      using errcode = 'P0001';
  end if;
end;
$$;

create or replace function private.assert_project_capacity(
  target_workspace_id bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_count integer;
  project_limit integer;
begin
  perform private.lock_workspace_limits(target_workspace_id);

  project_limit := private.workspace_project_limit(
    private.effective_billing_plan(target_workspace_id)
  );

  if project_limit is null then
    return;
  end if;

  select count(*)::integer
  into project_count
  from public.projects p
  where p.workspace_id = target_workspace_id;

  if project_count >= project_limit then
    raise exception 'Workspace project limit reached for current plan'
      using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function private.effective_billing_plan(bigint)
  from public, anon, authenticated;
revoke all on function private.workspace_member_limit(public.billing_plan)
  from public, anon, authenticated;
revoke all on function private.workspace_project_limit(public.billing_plan)
  from public, anon, authenticated;
revoke all on function private.lock_workspace_limits(bigint)
  from public, anon, authenticated;
revoke all on function private.assert_active_member_capacity(bigint, bigint)
  from public, anon, authenticated;
revoke all on function private.assert_pending_invitation_capacity(bigint, bigint)
  from public, anon, authenticated;
revoke all on function private.assert_project_capacity(bigint)
  from public, anon, authenticated;

create or replace function public.enforce_project_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.assert_project_capacity(new.workspace_id);
  return new;
end;
$$;

create or replace function public.enforce_active_member_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'active'
    and (
      tg_op = 'INSERT'
      or old.status <> 'active'
      or old.workspace_id <> new.workspace_id
    )
  then
    perform private.assert_active_member_capacity(
      new.workspace_id,
      case when tg_op = 'UPDATE' then old.id else null end
    );
  end if;

  return new;
end;
$$;

create or replace function public.enforce_pending_invitation_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.accepted_at is null
    and new.revoked_at is null
    and new.expires_at > timezone('utc', now())
  then
    perform private.assert_pending_invitation_capacity(
      new.workspace_id,
      case when tg_op = 'UPDATE' then old.id else null end
    );
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_project_limit()
  from public, anon, authenticated;
revoke all on function public.enforce_active_member_limit()
  from public, anon, authenticated;
revoke all on function public.enforce_pending_invitation_limit()
  from public, anon, authenticated;

drop trigger if exists projects_plan_limit_check on public.projects;
create trigger projects_plan_limit_check
  before insert on public.projects
  for each row execute function public.enforce_project_limit();

drop trigger if exists workspace_members_plan_limit_check on public.workspace_members;
create trigger workspace_members_plan_limit_check
  before insert or update on public.workspace_members
  for each row execute function public.enforce_active_member_limit();

drop trigger if exists invitations_plan_limit_check on public.invitations;
create trigger invitations_plan_limit_check
  before insert or update on public.invitations
  for each row execute function public.enforce_pending_invitation_limit();

create or replace function public.accept_workspace_invitation(
  p_token_hash text
)
returns table (
  workspace_id bigint,
  workspace_slug text,
  workspace_name text,
  member_role public.app_role
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_email text := private.current_user_email();
  current_profile_id uuid := private.current_user_id();
  existing_member public.workspace_members;
  target_invitation public.invitations;
begin
  if current_profile_id is null then
    raise exception 'Authentication required';
  end if;

  if current_email = '' then
    raise exception 'Authenticated user email is required';
  end if;

  select *
  into target_invitation
  from public.invitations i
  where i.token_hash = p_token_hash
  for update;

  if target_invitation.id is null then
    raise exception 'Invitation not found';
  end if;

  if target_invitation.revoked_at is not null then
    raise exception 'Invitation has been revoked';
  end if;

  if target_invitation.accepted_at is not null then
    raise exception 'Invitation has already been accepted';
  end if;

  if target_invitation.expires_at <= timezone('utc', now()) then
    raise exception 'Invitation has expired';
  end if;

  if target_invitation.email <> current_email then
    raise exception 'Invitation belongs to a different email address';
  end if;

  select *
  into existing_member
  from public.workspace_members wm
  where wm.workspace_id = target_invitation.workspace_id
    and wm.user_id = current_profile_id
  for update;

  if existing_member.id is null or existing_member.status <> 'active' then
    perform private.assert_active_member_capacity(
      target_invitation.workspace_id,
      existing_member.id
    );
  end if;

  insert into public.profiles (id)
  values (current_profile_id)
  on conflict (id) do nothing;

  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (
    target_invitation.workspace_id,
    current_profile_id,
    target_invitation.role,
    'active'
  )
  on conflict on constraint workspace_members_unique_user do update
  set status = 'active',
      role = case
        when public.workspace_members.status = 'active'
          then public.workspace_members.role
        else excluded.role
      end,
      updated_at = timezone('utc', now());

  update public.invitations
  set accepted_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  where id = target_invitation.id;

  return query
  select w.id, w.slug, w.name, wm.role
  from public.workspaces w
  join public.workspace_members wm
    on wm.workspace_id = w.id
   and wm.user_id = current_profile_id
  where w.id = target_invitation.workspace_id;
end;
$$;

revoke all on function public.accept_workspace_invitation(text)
  from public, anon;
grant execute on function public.accept_workspace_invitation(text)
  to authenticated, service_role;
grant execute on function public.enforce_project_limit() to service_role;
grant execute on function public.enforce_active_member_limit() to service_role;
grant execute on function public.enforce_pending_invitation_limit() to service_role;
