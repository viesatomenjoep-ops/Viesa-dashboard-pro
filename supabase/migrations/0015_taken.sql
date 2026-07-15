-- ============================================================================
-- Viesa Command Center — migratie 0015: taken (to-do's)
-- ----------------------------------------------------------------------------
-- Persoonlijke/gedeelde to-do's per persoon (Tom/Joep/algemeen) en periode
-- (week/maand/jaar). RLS: gedeelde werkruimte. Idempotent.
-- ============================================================================

create table if not exists public.taken (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid default auth.uid(),
  wie        text not null default 'algemeen' check (wie in ('tom','joep','algemeen')),
  titel      text not null,
  klaar      boolean not null default false,
  periode    text not null default 'week' check (periode in ('week','maand','jaar')),
  deadline   date,
  created_at timestamptz not null default now()
);
create index if not exists taken_wie_idx on public.taken (wie);
create index if not exists taken_periode_idx on public.taken (periode);

alter table public.taken enable row level security;
drop policy if exists geauth_toegang on public.taken;
create policy geauth_toegang on public.taken
  for all to authenticated
  using (true)
  with check (true);
