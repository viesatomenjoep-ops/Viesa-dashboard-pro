-- ============================================================================
-- Viesa Command Center — migratie 0007: Microsoft/Outlook-tokens
-- ----------------------------------------------------------------------------
-- Slaat de MSAL-tokencache (bevat access- én refresh-token) VERSLEUTELD op,
-- server-side, per gebruiker. RLS aan: alleen de eigenaar mag zijn eigen rij.
-- Idempotent.
-- ============================================================================

create table if not exists public.ms_tokens (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  token_cache  text not null,                 -- versleutelde MSAL-cache (AES-256-GCM)
  account      jsonb not null default '{}'::jsonb,  -- naam/e-mail voor weergave
  expires_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (owner_id)
);

-- updated_at-trigger (functie uit 0004).
drop trigger if exists set_updated_at on public.ms_tokens;
create trigger set_updated_at before update on public.ms_tokens
  for each row execute function public.set_updated_at();

-- RLS: uitsluitend de eigen rij (per gebruiker), geen gedeelde toegang.
alter table public.ms_tokens enable row level security;
drop policy if exists eigen_ms_tokens on public.ms_tokens;
create policy eigen_ms_tokens on public.ms_tokens
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create index if not exists ms_tokens_owner_idx on public.ms_tokens (owner_id);
