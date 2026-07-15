-- ============================================================================
-- Viesa Command Center — migratie 0006: iCloud als link-type
-- ----------------------------------------------------------------------------
-- Voegt 'icloud' toe aan de toegestane drive_links.type-waarden, zodat je
-- iCloud-share-links kunt opslaan en filteren op de Bestanden-pagina.
-- Idempotent.
-- ============================================================================

alter table public.drive_links drop constraint if exists drive_links_type_check;
alter table public.drive_links
  add constraint drive_links_type_check
  check (type in ('drive','sheet','doc','map','pdf','icloud','overig'));
