-- ============================================================================
-- Viesa Command Center — migratie 0011: klantlogo
-- ----------------------------------------------------------------------------
-- Een klant kan een logo (URL) krijgen; dat logo wordt op de offerte-PDF
-- verwerkt. Idempotent.
-- ============================================================================

alter table public.klanten add column if not exists logo_url text;
