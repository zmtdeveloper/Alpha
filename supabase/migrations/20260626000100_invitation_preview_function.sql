create or replace function public.get_workspace_invitation_preview(
  p_token_hash text
)
returns table (
  email text,
  role public.app_role,
  expires_at timestamptz,
  accepted_at timestamptz,
  revoked_at timestamptz,
  workspace_name text,
  workspace_slug text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    i.email,
    i.role,
    i.expires_at,
    i.accepted_at,
    i.revoked_at,
    w.name,
    w.slug
  from public.invitations i
  join public.workspaces w
    on w.id = i.workspace_id
  where i.token_hash = p_token_hash
    and i.email = private.current_user_email()
    and private.current_user_id() is not null
  limit 1;
$$;

revoke all on function public.get_workspace_invitation_preview(text)
  from public, anon;
grant execute on function public.get_workspace_invitation_preview(text)
  to authenticated, service_role;
