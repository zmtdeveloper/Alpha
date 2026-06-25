drop policy if exists workspace_members_insert_admin on public.workspace_members;
drop policy if exists workspace_members_update_admin on public.workspace_members;
drop policy if exists workspace_members_delete_admin_or_self on public.workspace_members;
drop policy if exists invitations_insert_admin on public.invitations;
drop policy if exists invitations_update_admin_or_recipient on public.invitations;
drop policy if exists invitations_delete_admin on public.invitations;

create policy workspace_members_insert_manager on public.workspace_members
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
    or (select private.has_workspace_role(workspace_id, array['owner']::public.app_role[]))
    or (
      role <> 'owner'
      and (select private.has_workspace_role(workspace_id, array['admin']::public.app_role[]))
    )
  );

create policy workspace_members_update_manager on public.workspace_members
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

create policy workspace_members_delete_manager_or_self on public.workspace_members
  for delete to authenticated
  using (
    user_id = (select private.current_user_id())
    or (select private.has_workspace_role(workspace_id, array['owner']::public.app_role[]))
    or (
      role <> 'owner'
      and (select private.has_workspace_role(workspace_id, array['admin']::public.app_role[]))
    )
  );

create policy invitations_insert_manager on public.invitations
  for insert to authenticated
  with check (
    invited_by = (select private.current_user_id())
    and (
      (select private.has_workspace_role(workspace_id, array['owner']::public.app_role[]))
      or (
        role <> 'owner'
        and (select private.has_workspace_role(workspace_id, array['admin']::public.app_role[]))
      )
    )
  );

create policy invitations_update_manager_or_recipient on public.invitations
  for update to authenticated
  using (
    (select private.has_workspace_role(workspace_id, array['owner']::public.app_role[]))
    or email = (select private.current_user_email())
    or (
      role <> 'owner'
      and (select private.has_workspace_role(workspace_id, array['admin']::public.app_role[]))
    )
  )
  with check (
    (select private.has_workspace_role(workspace_id, array['owner']::public.app_role[]))
    or email = (select private.current_user_email())
    or (
      role <> 'owner'
      and (select private.has_workspace_role(workspace_id, array['admin']::public.app_role[]))
    )
  );

create policy invitations_delete_manager on public.invitations
  for delete to authenticated
  using (
    (select private.has_workspace_role(workspace_id, array['owner']::public.app_role[]))
    or (
      role <> 'owner'
      and (select private.has_workspace_role(workspace_id, array['admin']::public.app_role[]))
    )
  );
