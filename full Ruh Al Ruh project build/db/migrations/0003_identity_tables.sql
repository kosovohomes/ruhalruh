-- Tables used by controlled server-only identity jobs. There are no member
-- policies: ordinary request contexts cannot read or write these records.

create table public.refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  user_id uuid not null references public.users(id) on delete cascade,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.password_resets (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  user_id uuid not null references public.users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_refresh_tokens_user_id on public.refresh_tokens(user_id);
create index idx_password_resets_user_id on public.password_resets(user_id);

alter table public.refresh_tokens enable row level security;
alter table public.password_resets enable row level security;
alter table public.refresh_tokens force row level security;
alter table public.password_resets force row level security;

drop policy if exists refresh_tokens_admin_all on public.refresh_tokens;
create policy refresh_tokens_admin_all on public.refresh_tokens
  for all to rrah_admin using (true) with check (true);

drop policy if exists password_resets_admin_all on public.password_resets;
create policy password_resets_admin_all on public.password_resets
  for all to rrah_admin using (true) with check (true);

grant all on table public.refresh_tokens, public.password_resets to rrah_admin;
