-- ============================================================================
-- Viesa Command Center — migratie 0017: project ↔ klant
-- ----------------------------------------------------------------------------
-- Projecten (en daarmee hun notities) kunnen aan een klant gekoppeld worden.
-- Idempotent.
-- ============================================================================

alter table public.projecten
  add column if not exists klant_id uuid references public.klanten (id) on delete set null;
create index if not exists projecten_klant_idx on public.projecten (klant_id);
