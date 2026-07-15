-- ============================================================================
-- Viesa Command Center — migratie 0010: categorieën voor bestanden
-- ----------------------------------------------------------------------------
-- - drive_links krijgt een vrij 'categorie'-veld.
-- - bestand_categorieen: eigen (opgeslagen) categorieën, naast de standaardlijst.
-- RLS: gedeelde werkruimte. Idempotent.
-- ============================================================================

alter table public.drive_links add column if not exists categorie text;
create index if not exists drive_links_categorie_idx on public.drive_links (categorie);

create table if not exists public.bestand_categorieen (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid default auth.uid(),
  naam       text not null unique,
  created_at timestamptz not null default now()
);

alter table public.bestand_categorieen enable row level security;
drop policy if exists geauth_toegang on public.bestand_categorieen;
create policy geauth_toegang on public.bestand_categorieen
  for all to authenticated
  using (true)
  with check (true);
