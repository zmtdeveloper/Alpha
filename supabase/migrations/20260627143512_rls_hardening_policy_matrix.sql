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

revoke all privileges on all tables in schema public from anon;
revoke all privileges on all sequences in schema public from anon;

drop policy if exists workspace_billing_manage_owner on public.workspace_billing;

drop policy if exists invitations_update_manager_or_recipient
  on public.invitations;

create policy invitations_update_manager on public.invitations
  for update to authenticated
  using (
    (select private.has_workspace_role(workspace_id, array['owner']::public.app_role[]))
    or (
      role <> 'owner'
      and (select private.has_workspace_role(workspace_id, array['admin']::public.app_role[]))
    )
  )
  with check (
    (select private.has_workspace_role(workspace_id, array['owner']::public.app_role[]))
    or (
      role <> 'owner'
      and (select private.has_workspace_role(workspace_id, array['admin']::public.app_role[]))
    )
  );

create or replace function public.enforce_client_audit_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  current_profile_id uuid;
begin
  if current_user <> 'authenticated' then
    if tg_op = 'DELETE' then
      return old;
    end if;

    return new;
  end if;

  current_profile_id := private.current_user_id();

  if current_profile_id is null then
    raise exception 'Authentication required';
  end if;

  if tg_op = 'INSERT' then
    case tg_table_name
      when 'invitations' then
        if new.invited_by <> current_profile_id then
          raise exception 'Invitation inviter must match current user';
        end if;
      when 'projects' then
        if new.created_by <> current_profile_id then
          raise exception 'Project creator must match current user';
        end if;
      when 'boards' then
        if new.created_by <> current_profile_id then
          raise exception 'Board creator must match current user';
        end if;
      when 'tasks' then
        if new.created_by <> current_profile_id then
          raise exception 'Task creator must match current user';
        end if;
      when 'task_assignees' then
        if new.assigned_by <> current_profile_id then
          raise exception 'Task assignment actor must match current user';
        end if;
      else
        null;
    end case;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    case tg_table_name
      when 'workspaces' then
        if new.owner_id is distinct from old.owner_id then
          raise exception 'Workspace owner cannot be changed directly';
        end if;
      when 'invitations' then
        if new.invited_by is distinct from old.invited_by then
          raise exception 'Invitation inviter cannot be changed';
        end if;

        if new.accepted_at is distinct from old.accepted_at then
          raise exception 'Invitation acceptance must use the acceptance RPC';
        end if;
      when 'projects' then
        if new.created_by is distinct from old.created_by then
          raise exception 'Project creator cannot be changed';
        end if;
      when 'boards' then
        if new.created_by is distinct from old.created_by then
          raise exception 'Board creator cannot be changed';
        end if;
      when 'tasks' then
        if new.created_by is distinct from old.created_by then
          raise exception 'Task creator cannot be changed';
        end if;
      when 'task_assignees' then
        if new.assigned_by is distinct from old.assigned_by then
          raise exception 'Task assignment actor cannot be changed';
        end if;
      else
        null;
    end case;

    return new;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_client_audit_fields()
  from public, anon, authenticated;
grant execute on function public.enforce_client_audit_fields()
  to service_role;

drop trigger if exists workspaces_client_audit_fields
  on public.workspaces;
create trigger workspaces_client_audit_fields
  before update on public.workspaces
  for each row execute function public.enforce_client_audit_fields();

drop trigger if exists invitations_client_audit_fields
  on public.invitations;
create trigger invitations_client_audit_fields
  before insert or update on public.invitations
  for each row execute function public.enforce_client_audit_fields();

drop trigger if exists projects_client_audit_fields
  on public.projects;
create trigger projects_client_audit_fields
  before insert or update on public.projects
  for each row execute function public.enforce_client_audit_fields();

drop trigger if exists boards_client_audit_fields
  on public.boards;
create trigger boards_client_audit_fields
  before insert or update on public.boards
  for each row execute function public.enforce_client_audit_fields();

drop trigger if exists tasks_client_audit_fields
  on public.tasks;
create trigger tasks_client_audit_fields
  before insert or update on public.tasks
  for each row execute function public.enforce_client_audit_fields();

drop trigger if exists task_assignees_client_audit_fields
  on public.task_assignees;
create trigger task_assignees_client_audit_fields
  before insert or update on public.task_assignees
  for each row execute function public.enforce_client_audit_fields();
