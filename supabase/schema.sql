-- Run in Supabase SQL Editor. API secrets are never stored in plaintext.
create extension if not exists pgcrypto;
create table if not exists public.itfm_ai_api_key (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  key_hash text not null unique check (char_length(key_hash) = 64),
  key_prefix text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);
create index if not exists itfm_ai_api_key_user_active_idx on public.itfm_ai_api_key(user_id, created_at desc) where revoked_at is null;
alter table public.itfm_ai_api_key enable row level security;
-- Client roles get no direct access; only the server's service-role key accesses this table.
revoke all on public.itfm_ai_api_key from anon, authenticated;
