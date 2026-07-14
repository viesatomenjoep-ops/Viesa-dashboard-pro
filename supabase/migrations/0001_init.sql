-- ============================================================================
-- Viesa Command Center — migratie 0001: volledig datamodel
-- ----------------------------------------------------------------------------
-- Single-user: RLS staat aan op elke tabel met policy `auth.uid() = owner_id`.
-- Voer dit bestand uit in de Supabase SQL Editor (of via de Supabase CLI).
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type lead_bron            as enum ('prospector', 'handmatig');
  create type lead_stage           as enum ('nieuw', 'gekwalificeerd', 'contact', 'offerte', 'gewonnen', 'verloren');
  create type taak_status          as enum ('open', 'afgerond');
  create type taak_prioriteit      as enum ('laag', 'normaal', 'hoog');
  create type offerte_status       as enum ('concept', 'verzonden', 'opvolgen', 'geaccepteerd', 'afgewezen');
  create type factuur_status       as enum ('concept', 'verzonden', 'betaald', 'te_laat', 'geannuleerd');
  create type herinnering_kanaal   as enum ('gmail', 'outlook');
  create type herinnering_status   as enum ('gepland', 'verzonden', 'mislukt');
  create type project_status       as enum ('actief', 'on_hold', 'afgerond');
  create type drive_link_type      as enum ('drive', 'sheet', 'doc', 'map', 'pdf', 'overig');
  create type drive_context_type   as enum ('algemeen', 'lead', 'klant', 'project', 'offerte', 'factuur');
  create type integratie_dienst    as enum ('google_drive', 'google_sheets', 'google_docs', 'slack', 'gmail', 'outlook', 'claude_api');
  create type integratie_status    as enum ('niet_verbonden', 'verbonden', 'fout');
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Trigger-functie: updated_at automatisch bijwerken
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tabellen
-- ---------------------------------------------------------------------------

-- Klanten (gewonnen leads worden hier klant)
create table if not exists public.klanten (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  bedrijfsnaam  text not null,
  contact_naam  text,
  email         text,
  telefoon      text,
  website       text,
  adres         text,
  postcode      text,
  plaats        text,
  notities      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Leads & pipeline
create table if not exists public.leads (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  bedrijfsnaam      text not null,
  website           text,
  contact_naam      text,
  email             text,
  telefoon          text,
  bron              lead_bron not null default 'handmatig',
  score             integer not null default 0 check (score between 0 and 100),
  signalen          jsonb not null default '[]'::jsonb,
  openingszin       text,
  stage             lead_stage not null default 'nieuw',
  positie           numeric not null default 0,
  geschatte_waarde  numeric(12,2) not null default 0,
  klant_id          uuid references public.klanten (id) on delete set null,
  notities          text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists leads_stage_positie_idx on public.leads (stage, positie);

-- Offerte-templates
create table if not exists public.offerte_templates (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  naam            text not null,
  inhoud_markdown text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Offertes
create table if not exists public.offertes (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nummer          text not null,
  klant_id        uuid references public.klanten (id) on delete set null,
  lead_id         uuid references public.leads (id) on delete set null,
  template_id     uuid references public.offerte_templates (id) on delete set null,
  titel           text not null,
  inhoud_markdown text not null default '',
  notities        text,
  bedrag          numeric(12,2) not null default 0,
  status          offerte_status not null default 'concept',
  drive_pdf_url   text,
  verzonden_op    date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (owner_id, nummer)
);

-- Facturen
create table if not exists public.facturen (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nummer            text not null,
  klant_id          uuid references public.klanten (id) on delete set null,
  offerte_id        uuid references public.offertes (id) on delete set null,
  bedrag            numeric(12,2) not null default 0,
  btw_percentage    numeric(5,2) not null default 21,
  status            factuur_status not null default 'concept',
  factuurdatum      date not null default current_date,
  vervaldatum       date,
  betaald_op        date,
  drive_pdf_url     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (owner_id, nummer)
);
create index if not exists facturen_status_vervaldatum_idx on public.facturen (status, vervaldatum);

-- Factuur-herinneringen (via Gmail/Outlook)
create table if not exists public.factuur_herinneringen (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  factuur_id    uuid not null references public.facturen (id) on delete cascade,
  kanaal        herinnering_kanaal not null default 'gmail',
  status        herinnering_status not null default 'gepland',
  bericht       text,
  verzonden_op  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Projecten
create table if not exists public.projecten (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  naam        text not null,
  omschrijving text,
  status      project_status not null default 'actief',
  klant_id    uuid references public.klanten (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Project-notities (markdown)
create table if not exists public.project_notities (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id      uuid not null references public.projecten (id) on delete cascade,
  titel           text not null default 'Notitie',
  inhoud_markdown text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Follow-up-taken
create table if not exists public.taken (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titel        text not null,
  omschrijving text,
  vervaldatum  date,
  status       taak_status not null default 'open',
  prioriteit   taak_prioriteit not null default 'normaal',
  lead_id      uuid references public.leads (id) on delete cascade,
  project_id   uuid references public.projecten (id) on delete cascade,
  afgerond_op  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists taken_status_vervaldatum_idx on public.taken (status, vervaldatum);

-- Drive-links (bestanden-pagina + polymorfe koppelingen). Nooit bestanden, alleen links.
create table if not exists public.drive_links (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titel         text not null,
  url           text not null,
  type          drive_link_type not null default 'drive',
  context_type  drive_context_type not null default 'algemeen',
  context_id    uuid,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists drive_links_context_idx on public.drive_links (context_type, context_id);

-- Design-system documenten (editor + GitHub-sync)
create table if not exists public.design_documenten (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  pad               text not null,
  inhoud_markdown   text not null default '',
  github_sha        text,
  laatst_gesynct_op timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (owner_id, pad)
);

-- Whiteboards + sticky notes
create table if not exists public.whiteboards (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  naam        text not null default 'Whiteboard',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.sticky_notes (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  whiteboard_id uuid not null references public.whiteboards (id) on delete cascade,
  tekst         text not null default '',
  kleur         text not null default '#FDE68A',
  x             numeric not null default 0,
  y             numeric not null default 0,
  breedte       numeric not null default 200,
  hoogte        numeric not null default 200,
  z_index       integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Integraties (koppelingen-pagina). Geheimen NIET hier; alleen status + metadata.
create table if not exists public.integraties (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dienst              integratie_dienst not null,
  status              integratie_status not null default 'niet_verbonden',
  config              jsonb not null default '{}'::jsonb,
  laatst_gecontroleerd_op timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (owner_id, dienst)
);

-- ---------------------------------------------------------------------------
-- updated_at-triggers
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  tabellen text[] := array[
    'klanten','leads','offerte_templates','offertes','facturen',
    'factuur_herinneringen','projecten','project_notities','taken',
    'drive_links','design_documenten','whiteboards','sticky_notes','integraties'
  ];
begin
  foreach t in array tabellen loop
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security: eigenaar mag alleen eigen rijen (single-user)
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  tabellen text[] := array[
    'klanten','leads','offerte_templates','offertes','facturen',
    'factuur_herinneringen','projecten','project_notities','taken',
    'drive_links','design_documenten','whiteboards','sticky_notes','integraties'
  ];
begin
  foreach t in array tabellen loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists eigenaar_alles on public.%I;', t);
    execute format(
      'create policy eigenaar_alles on public.%I
         for all to authenticated
         using (auth.uid() = owner_id)
         with check (auth.uid() = owner_id);', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Views (security_invoker = on -> respecteren RLS van de aanroeper)
-- ---------------------------------------------------------------------------

-- Omzet per maand op basis van betaalde facturen
create or replace view public.omzet_per_maand
with (security_invoker = on) as
select
  date_trunc('month', coalesce(betaald_op, factuurdatum))::date as maand,
  sum(bedrag) as omzet,
  count(*)    as aantal
from public.facturen
where status = 'betaald'
group by 1
order by 1;

-- Openstaande facturen (verzonden of te laat, nog niet betaald)
create or replace view public.openstaande_facturen
with (security_invoker = on) as
select
  count(*)                 as aantal,
  coalesce(sum(bedrag), 0) as bedrag
from public.facturen
where status in ('verzonden', 'te_laat');

-- Follow-ups van vandaag en achterstallig
create or replace view public.followups_vandaag
with (security_invoker = on) as
select *
from public.taken
where status = 'open'
  and vervaldatum is not null
  and vervaldatum <= current_date
order by vervaldatum asc;
