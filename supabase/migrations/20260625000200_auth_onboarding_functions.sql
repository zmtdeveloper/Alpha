create or replace function public.create_workspace_for_current_user(
  p_full_name text,
  p_workspace_name text,
  p_workspace_slug text
)
returns public.workspaces
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_profile_id uuid := private.current_user_id();
  normalized_full_name text := nullif(btrim(p_full_name), '');
  normalized_workspace_name text := btrim(p_workspace_name);
  normalized_workspace_slug text := btrim(lower(p_workspace_slug));
  base_workspace_slug text;
  slug_suffix integer := 1;
  created_workspace public.workspaces;
begin
  if current_profile_id is null then
    raise exception 'Authentication required';
  end if;

  if normalized_full_name is not null
    and char_length(normalized_full_name) > 120
  then
    raise exception 'Full name must be 120 characters or fewer';
  end if;

  if char_length(normalized_workspace_name) < 1
    or char_length(normalized_workspace_name) > 120
  then
    raise exception 'Workspace name must be between 1 and 120 characters';
  end if;

  if normalized_workspace_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Workspace slug is invalid';
  end if;

  base_workspace_slug := normalized_workspace_slug;

  while exists (
    select 1
    from public.workspaces w
    where w.slug = normalized_workspace_slug
  ) loop
    slug_suffix := slug_suffix + 1;
    normalized_workspace_slug := base_workspace_slug || '-' || slug_suffix::text;
  end loop;

  insert into public.profiles (id, full_name)
  values (current_profile_id, normalized_full_name)
  on conflict (id) do update
  set full_name = coalesce(excluded.full_name, public.profiles.full_name),
      updated_at = timezone('utc', now());

  insert into public.workspaces (name, slug, owner_id)
  values (
    normalized_workspace_name,
    normalized_workspace_slug,
    current_profile_id
  )
  returning * into created_workspace;

  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (created_workspace.id, current_profile_id, 'owner', 'active');

  insert into public.workspace_billing (workspace_id, plan, status)
  values (created_workspace.id, 'free', 'inactive')
  on conflict (workspace_id) do nothing;

  return created_workspace;
end;
$$;

revoke all on function public.create_workspace_for_current_user(text, text, text)
  from public, anon;
grant execute on function public.create_workspace_for_current_user(text, text, text)
  to authenticated, service_role;

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
  current_profile_id uuid := private.current_user_id();
  current_email text := private.current_user_email();
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
