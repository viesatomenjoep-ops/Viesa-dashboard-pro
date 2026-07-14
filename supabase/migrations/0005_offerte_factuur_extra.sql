-- ============================================================================
-- Viesa Command Center — migratie 0005: offerte→factuur + concept-status
-- ----------------------------------------------------------------------------
-- - facturen krijgt status 'concept' (voor "Maak factuur" uit een offerte)
-- - facturen.offerte_id koppelt een factuur aan de offerte waaruit hij ontstond
-- Idempotent.
-- ============================================================================

-- offerte_id-kolom (koppeling factuur ← offerte)
alter table public.facturen
  add column if not exists offerte_id uuid references public.offertes (id) on delete set null;

-- 'concept' toevoegen aan de factuurstatus-check.
alter table public.facturen drop constraint if exists facturen_status_check;
alter table public.facturen
  add constraint facturen_status_check
  check (status in ('concept','open','betaald','vervallen'));
