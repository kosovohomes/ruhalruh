-- Core schema for Neon/Postgres. Families is created before users so the
-- family_id foreign key resolves; the reverse relationship is added afterwards.

create extension if not exists pgcrypto;

-- Controlled database roles. The application connection is granted membership
-- in both roles and switches with SET LOCAL ROLE for each transaction.
do $$
begin
  if not exists (select from pg_roles where rolname = 'rrah_app') then
    create role rrah_app nologin;
  end if;
  if not exists (select from pg_roles where rolname = 'rrah_admin') then
    create role rrah_admin nologin;
  end if;
  execute 'grant rrah_app to current_user';
  execute 'grant rrah_admin to current_user';
end;
$$;

create schema if not exists rrah;

-- Transaction-local identity. set_config(..., true) values are written by the
-- application server, never supplied by a browser.
create or replace function rrah.current_user_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('rrah.user_id', true), '')::uuid;
$$;

create or replace function rrah.current_app_role()
returns text
language sql
stable
as $$
  select coalesce(current_setting('rrah.app_role', true), '');
$$;

grant usage on schema rrah to rrah_app, rrah_admin;
grant execute on function rrah.current_user_id() to rrah_app, rrah_admin;
grant execute on function rrah.current_app_role() to rrah_app, rrah_admin;

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text not null,
  role text not null default 'individual'
    check (role in ('individual', 'family_member', 'admin')),
  preferred_language text not null default 'en',
  cultural_context text,
  family_id uuid references public.families(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

alter table public.families
  add constraint families_created_by_fkey
  foreign key (created_by) references public.users(id) on delete cascade;

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  trace_id text not null,
  start_time timestamptz not null default now(),
  end_time timestamptz,
  session_type text not null check (session_type in ('voice', 'text')),
  language text not null default 'en',
  cultural_context text,
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  trace_id text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  timestamp timestamptz not null default now(),
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table public.error_logs (
  id uuid primary key default gen_random_uuid(),
  error_id text not null unique,
  trace_id text not null,
  timestamp timestamptz not null default now(),
  level text not null check (level in ('info', 'warn', 'error', 'critical')),
  message text not null,
  stack text,
  module text,
  function_name text,
  user_id uuid references public.users(id) on delete set null,
  session_id uuid references public.sessions(id) on delete set null,
  payload jsonb,
  environment text not null default 'development',
  created_at timestamptz not null default now()
);

create index idx_users_email on public.users(email);
create index idx_users_family_id on public.users(family_id);
create index idx_sessions_user_id on public.sessions(user_id);
create index idx_sessions_trace_id on public.sessions(trace_id);
create index idx_messages_session_id on public.messages(session_id);
create index idx_messages_trace_id on public.messages(trace_id);
create index idx_error_logs_error_id on public.error_logs(error_id);
create index idx_error_logs_trace_id on public.error_logs(trace_id);
create index idx_error_logs_timestamp on public.error_logs(timestamp desc);
create index idx_error_logs_level on public.error_logs(level);

create trigger update_users_updated_at
  before update on public.users
  for each row execute function public.update_updated_at_column();

create trigger update_families_updated_at
  before update on public.families
  for each row execute function public.update_updated_at_column();

-- Lightweight target for /api/health. It touches no member data.
create or replace function public.health_check()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select true;
$$;

revoke all on function public.health_check() from public;
grant execute on function public.health_check() to rrah_app, rrah_admin;

grant usage on schema public to rrah_app, rrah_admin;
grant select, insert, update, delete on table public.families to rrah_app;
grant select, insert, update, delete on table public.users to rrah_app;
grant select, insert, update, delete on table public.sessions to rrah_app;
grant select, insert, update, delete on table public.messages to rrah_app;
grant select on table public.error_logs to rrah_app;
grant all on table public.families, public.users, public.sessions, public.messages, public.error_logs to rrah_admin;
