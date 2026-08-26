-- ============================================================================
-- Viesa Command Center — migratie 0047: bewaarde websitescans
-- ----------------------------------------------------------------------------
-- Elke voltooide scan op /scan (los van of hij naar een lead gepusht is) komt
-- hier als volledig rapport (jsonb) te staan, zodat de pagina een geschiedenis
-- kan tonen om terug te openen of te verwijderen — zonder de scan opnieuw te
-- hoeven draaien (en dus zonder opnieuw de vier modellen te bevragen).
-- Gedeelde werkruimte, dus de standaard-RLS-policy — zie CLAUDE.md sectie 7.
-- Idempotent.
-- ============================================================================

create table if not exists public.website_scans (
  id           uuid primary key default gen_random_uuid(),
  url          text not null,
  host         text not null,
  niche        text,
  totaal_score integer not null,
  rapport      jsonb not null,
  created_at   timestamptz not null default now()
);

create index if not exists website_scans_created_idx
  on public.website_scans (created_at desc);

alter table public.website_scans enable row level security;

drop policy if exists website_scans_geauth on public.website_scans;
create policy website_scans_geauth on public.website_scans
  for all to authenticated using (true) with check (true);
