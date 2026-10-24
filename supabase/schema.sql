create extension if not exists pgcrypto;

create table if not exists public.itfm_api_keys (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    key_hash text not null unique,
    key_prefix text not null,
    created_at timestamptz not null default now(),
    last_used_at timestamptz,
    revoked_at timestamptz
);

alter table public.itfm_api_keys enable row level security;

revoke all on public.itfm_ai_api_keys from anon, authenticated;