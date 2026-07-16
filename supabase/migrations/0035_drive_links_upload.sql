-- ============================================================================
-- Viesa Dashboard — migratie 0035: geüploade bestanden op Drive
-- ----------------------------------------------------------------------------
-- Naast losse links kun je nu ook echte bestanden (PDF/afbeelding/…) uploaden;
-- die gaan naar Google Drive. We bewaren de Drive-verwijzing zodat de app het
-- bestand kan tonen/downloaden en bij verwijderen ook uit Drive kan halen.
-- Idempotent.
-- ============================================================================

alter table public.drive_links
  add column if not exists drive_file_id text,
  add column if not exists mime          text;
