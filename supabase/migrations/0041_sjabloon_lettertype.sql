-- ============================================================================
-- Viesa Dashboard — migratie 0041: lettertype per sjabloon
-- ----------------------------------------------------------------------------
-- Een sjabloon kan zijn eigen lettertype meebrengen (sleutel uit
-- lib/lettertypes.ts, bv. 'georgia'). Bij het kiezen van een sjabloon in het
-- mailvenster wordt dat lettertype meteen toegepast en meegestuurd.
--
-- sjablonen heeft al RLS (policy geauth_toegang, migratie 0032), dus deze kolom
-- erft die beveiliging. Idempotent.
-- ============================================================================

alter table public.sjablonen add column if not exists lettertype text;

comment on column public.sjablonen.lettertype is
  'Sleutel van het lettertype uit lib/lettertypes.ts; leeg = de standaard (georgia).';
