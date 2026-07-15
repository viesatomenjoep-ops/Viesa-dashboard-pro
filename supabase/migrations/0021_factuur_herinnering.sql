-- ============================================================================
-- Viesa Dashboard — migratie 0021: factuur-herinnering
-- ----------------------------------------------------------------------------
-- Houdt bij wanneer de laatste betaalherinnering voor een factuur is verstuurd,
-- zodat de UI dat kan tonen en dubbel sturen zichtbaar wordt. Idempotent.
-- ============================================================================

alter table public.facturen
  add column if not exists herinnering_verstuurd_op date;

-- RLS staat al aan op public.facturen (zie 0004); geen nieuwe policy nodig.
