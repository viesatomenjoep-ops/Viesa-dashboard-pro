-- ============================================================================
-- Viesa Command Center — migratie 0019: extra klanttypes (hot/cold lead)
-- ----------------------------------------------------------------------------
-- Voegt 'hot_lead' en 'cold_lead' toe aan de toegestane klanttypes. Idempotent.
-- ============================================================================

alter table public.klanten drop constraint if exists klanten_type_check;
alter table public.klanten add constraint klanten_type_check
  check (type in ('prospect','klant','partner','hot_lead','cold_lead'));
