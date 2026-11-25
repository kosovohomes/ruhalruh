-- RLS is the backstop. Application queries are also scoped to the member;
-- neither layer is treated as sufficient alone. FORCE RLS applies the policies
-- to the table owner too, so a shared connection string cannot silently bypass
-- them by owning the tables.

alter table public.users enable row level security;
alter table public.families enable row level security;
alter table public.sessions enable row level security;
alter table public.messages enable row level security;
alter table public.error_logs enable row level security;

alter table public.users force row level security;
alter table public.families force row level security;
alter table public.sessions force row level security;
alter table public.messages force row level security;
alter table public.error_logs force row level security;

-- Members: application identity comes from transaction-local settings.
-- Controlled server jobs run as rrah_admin and are handled by separate policies.

drop policy if exists users_app_select on public.users;
create policy users_app_select on public.users
  for select to rrah_app
  using (
    id = rrah.current_user_id()
    or rrah.current_app_role() = 'admin'
  );

drop policy if exists users_app_insert on public.users;
create policy users_app_insert on public.users
  for insert to rrah_app
  with check (id = rrah.current_user_id());

drop policy if exists users_app_update on public.users;
create policy users_app_update on public.users
  for update to rrah_app
  using (
    id = rrah.current_user_id()
    or rrah.current_app_role() = 'admin'
  )
  with check (
    id = rrah.current_user_id()
    or rrah.current_app_role() = 'admin'
  );

drop policy if exists families_app_select on public.families;
create policy families_app_select on public.families
  for select to rrah_app
  using (
    rrah.current_app_role() = 'admin'
    or exists (
      select 1 from public.users u
      where u.family_id = families.id and u.id = rrah.current_user_id()
    )
  );

drop policy if exists families_app_insert on public.families;
create policy families_app_insert on public.families
  for insert to rrah_app
  with check (created_by = rrah.current_user_id() or rrah.current_app_role() = 'admin');

drop policy if exists families_app_update on public.families;
create policy families_app_update on public.families
  for update to rrah_app
  using (
    rrah.current_app_role() = 'admin'
    or exists (
      select 1 from public.users u
      where u.family_id = families.id and u.id = rrah.current_user_id()
    )
  )
  with check (
    rrah.current_app_role() = 'admin'
    or exists (
      select 1 from public.users u
      where u.family_id = families.id and u.id = rrah.current_user_id()
    )
  );

drop policy if exists sessions_app_select on public.sessions;
create policy sessions_app_select on public.sessions
  for select to rrah_app
  using (user_id = rrah.current_user_id() or rrah.current_app_role() = 'admin');

drop policy if exists sessions_app_insert on public.sessions;
create policy sessions_app_insert on public.sessions
  for insert to rrah_app
  with check (user_id = rrah.current_user_id());

drop policy if exists sessions_app_update on public.sessions;
create policy sessions_app_update on public.sessions
  for update to rrah_app
  using (user_id = rrah.current_user_id() or rrah.current_app_role() = 'admin')
  with check (user_id = rrah.current_user_id() or rrah.current_app_role() = 'admin');

drop policy if exists sessions_app_delete on public.sessions;
create policy sessions_app_delete on public.sessions
  for delete to rrah_app
  using (user_id = rrah.current_user_id() or rrah.current_app_role() = 'admin');

drop policy if exists messages_app_select on public.messages;
create policy messages_app_select on public.messages
  for select to rrah_app
  using (
    rrah.current_app_role() = 'admin'
    or exists (
      select 1 from public.sessions s
      where s.id = messages.session_id and s.user_id = rrah.current_user_id()
    )
  );

drop policy if exists messages_app_insert on public.messages;
create policy messages_app_insert on public.messages
  for insert to rrah_app
  with check (
    exists (
      select 1 from public.sessions s
      where s.id = messages.session_id and s.user_id = rrah.current_user_id()
    )
  );

drop policy if exists messages_app_update on public.messages;
create policy messages_app_update on public.messages
  for update to rrah_app
  using (
    exists (
      select 1 from public.sessions s
      where s.id = messages.session_id and s.user_id = rrah.current_user_id()
    )
  )
  with check (
    exists (
      select 1 from public.sessions s
      where s.id = messages.session_id and s.user_id = rrah.current_user_id()
    )
  );

drop policy if exists messages_app_delete on public.messages;
create policy messages_app_delete on public.messages
  for delete to rrah_app
  using (
    exists (
      select 1 from public.sessions s
      where s.id = messages.session_id and s.user_id = rrah.current_user_id()
    )
  );

-- Controlled server-only role. No ordinary request ever runs as rrah_admin.
drop policy if exists users_admin_all on public.users;
create policy users_admin_all on public.users
  for all to rrah_admin using (true) with check (true);

drop policy if exists families_admin_all on public.families;
create policy families_admin_all on public.families
  for all to rrah_admin using (true) with check (true);

drop policy if exists sessions_admin_all on public.sessions;
create policy sessions_admin_all on public.sessions
  for all to rrah_admin using (true) with check (true);

drop policy if exists messages_admin_all on public.messages;
create policy messages_admin_all on public.messages
  for all to rrah_admin using (true) with check (true);

drop policy if exists error_logs_admin_all on public.error_logs;
create policy error_logs_admin_all on public.error_logs
  for all to rrah_admin using (true) with check (true);
