-- ============================================================================
-- Viesa Command Center — migratie 0025: klant "benaderd"-registratie
-- ----------------------------------------------------------------------------
-- Houdt bij hoe vaak (en wanneer laatst) een klant/bedrijf is benaderd, zodat
-- er met één knop een benaderpoging kan worden vastgelegd. Idempotent.
-- ============================================================================

alter table public.klanten
  add column if not exists benaderd_count      integer not null default 0,
  add column if not exists laatst_benaderd_op  timestamptz;
