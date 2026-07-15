-- ============================================================================
-- Viesa Command Center — migratie 0016: eigen herinneringen
-- ----------------------------------------------------------------------------
-- Eigen agenda-herinneringen (los van Google) die in het dashboard beheerd en
-- samen met de iCal-afspraken getoond worden. RLS: gedeelde werkruimte.
-- Idempotent.
-- ============================================================================

create table if not exists public.herinneringen (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid default auth.uid(),
  titel      text not null,
  wanneer    timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists herinneringen_wanneer_idx on public.herinneringen (wanneer);

alter table public.herinneringen enable row level security;
drop policy if exists geauth_toegang on public.herinneringen;
create policy geauth_toegang on public.herinneringen
  for all to authenticated
  using (true)
  with check (true);
