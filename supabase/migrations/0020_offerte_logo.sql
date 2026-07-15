-- ============================================================================
-- Viesa Command Center — migratie 0020: logo op de offerte
-- ----------------------------------------------------------------------------
-- Een offerte kan een eigen logo (data-URL of URL) opslaan; dat wordt op de
-- offerte-PDF getoond zonder opnieuw te hoeven uploaden. Idempotent.
-- ============================================================================

alter table public.offertes add column if not exists logo_url text;
