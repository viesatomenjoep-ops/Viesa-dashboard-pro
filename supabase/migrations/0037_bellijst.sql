-- ============================================================================
-- Viesa Command Center — migratie 0037: bellijst (leads die we gaan bellen)
-- ----------------------------------------------------------------------------
-- Extra velden op leads om een aparte bel-sectie te voeden. leads heeft al RLS
-- (policy geauth_toegang), dus deze kolommen erven die beveiliging. Idempotent.
-- ============================================================================

alter table public.leads add column if not exists bellen boolean not null default false;
alter table public.leads add column if not exists bel_notitie text;
alter table public.leads add column if not exists laatst_gebeld timestamptz;

-- Snel de bel-lijst kunnen ophalen.
create index if not exists leads_bellen_idx on public.leads (bellen) where bellen;
