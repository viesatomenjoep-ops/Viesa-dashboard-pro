-- ============================================================================
-- Viesa Command Center — migratie 0045: website-prototypes per lead
-- ----------------------------------------------------------------------------
-- Eén AI-gegenereerde, zelfstandige HTML-pagina per run: een vernieuwd
-- prototype van de website van een lead, te tonen als verkoopmateriaal.
-- Gedeelde werkruimte, dus de standaard-RLS-policy (geen per-gebruiker
-- scoping) — zie CLAUDE.md sectie 7. Idempotent.
-- ============================================================================

create table if not exists public.website_prototypes (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid references public.leads(id) on delete cascade,
  -- 'website' = volledige pagina, 'app' = mockup in een telefoonkader.
  type       text not null default 'website' check (type in ('website','app')),
  -- 'sjabloon' = statisch, 0 tokens; 'ai' = door Claude gegenereerd.
  bron       text not null default 'ai' check (bron in ('sjabloon','ai')),
  bron_url   text,
  html       text not null default '',
  model      text,
  tokens_in  integer,
  tokens_uit integer,
  created_at timestamptz not null default now()
);

create index if not exists website_prototypes_lead_idx
  on public.website_prototypes (lead_id, created_at desc);

alter table public.website_prototypes enable row level security;

drop policy if exists website_prototypes_geauth on public.website_prototypes;
create policy website_prototypes_geauth on public.website_prototypes
  for all to authenticated using (true) with check (true);
