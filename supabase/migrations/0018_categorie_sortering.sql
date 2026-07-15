-- ============================================================================
-- Viesa Command Center — migratie 0018: sorteervolgorde categorieën
-- ----------------------------------------------------------------------------
-- Bestand-categorieën krijgen een handmatige volgorde (sleepbaar). Idempotent.
-- ============================================================================

alter table public.bestand_categorieen
  add column if not exists sortering int not null default 0;
