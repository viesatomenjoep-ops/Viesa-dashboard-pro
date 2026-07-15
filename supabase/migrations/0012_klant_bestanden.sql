-- ============================================================================
-- Viesa Command Center — migratie 0012: bestanden per klant
-- ----------------------------------------------------------------------------
-- drive_links mag nu ook aan een klant hangen (context_type 'klant',
-- context_id = klanten.id). Idempotent.
-- ============================================================================

alter table public.drive_links drop constraint if exists drive_links_context_type_check;
alter table public.drive_links add constraint drive_links_context_type_check
  check (context_type in ('algemeen','lead','project','offerte','factuur','klant'));
