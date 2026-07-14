-- ============================================================================
-- Viesa Command Center — migratie 0004: canoniek datamodel
-- ----------------------------------------------------------------------------
-- Vervangt het eerdere schema (0001–0003) door het goedgekeurde canonieke model.
-- Tabellen: leads, activiteiten, offertes, facturen, projecten, notities,
--           design_docs, whiteboards, stickies, drive_links, prospector_runs
--           (+ integraties voor de koppelingen-pagina).
-- Plus view omzet_per_maand op betaalde facturen.
--
-- LET OP: dit dropt de oude tabellen (data gaat verloren — bewust gekozen).
-- RLS staat op ALLE tabellen; policies staan uitsluitend geauthenticeerde
-- toegang toe (rol `authenticated`). Anoniem = geen toegang.
-- Idempotent: veilig opnieuw uit te voeren.
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- --- Oud schema opruimen -----------------------------------------------------
drop view if exists public.omzet_per_maand cascade;
drop view if exists public.openstaande_facturen cascade;
drop view if exists public.followups_vandaag cascade;

drop table if exists
  public.sticky_notes, public.stickies, public.whiteboards,
  public.factuur_herinneringen, public.facturen,
  public.offertes, public.offerte_templates,
  public.taken, public.activiteiten,
  public.project_notities, public.notities, public.projecten,
  public.drive_links, public.design_documenten, public.design_docs,
  public.prospector_runs, public.integraties,
  public.klanten, public.leads
  cascade;

-- Oude enum-types weg (we gebruiken nu text + check).
drop type if exists lead_bron, lead_stage, taak_status, taak_prioriteit,
  offerte_status, factuur_status, herinnering_kanaal, herinnering_status,
  project_status, drive_link_type, drive_context_type, integratie_dienst,
  integratie_status cascade;

-- --- Gedeelde updated_at-trigger ---------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- --- Tabellen ----------------------------------------------------------------

create table public.leads (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid default auth.uid(),
  bedrijf           text not null,
  plaats            text,
  website           text,
  contact_naam      text,
  email             text,
  telefoon          text,
  bron              text not null default 'handmatig' check (bron in ('prospector','handmatig')),
  score             integer not null default 0 check (score between 0 and 100),
  verwachte_waarde  numeric(12,2) not null default 0,
  signalen          jsonb not null default '[]'::jsonb,
  openingszin       text,
  status            text not null default 'nieuw'
                    check (status in ('nieuw','contact_gehad','audit_offerte','gewonnen')),
  positie           numeric not null default 0,
  notities          text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index leads_status_idx on public.leads (status, positie);

create table public.activiteiten (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid default auth.uid(),
  lead_id         uuid references public.leads (id) on delete cascade,
  type            text not null default 'notitie'
                  check (type in ('notitie','call','email','follow_up','taak','systeem')),
  titel           text,
  omschrijving    text,
  status          text not null default 'open' check (status in ('open','afgerond')),
  follow_up_datum date,
  afgerond_op     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index activiteiten_status_idx on public.activiteiten (status);
create index activiteiten_follow_up_idx on public.activiteiten (follow_up_datum);
create index activiteiten_lead_idx on public.activiteiten (lead_id);

create table public.offertes (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid default auth.uid(),
  lead_id         uuid references public.leads (id) on delete set null,
  klant           text,
  nummer          text not null,
  titel           text not null,
  inhoud_markdown text not null default '',
  bedrag          numeric(12,2) not null default 0,
  status          text not null default 'concept'
                  check (status in ('concept','verzonden','opvolgen','geaccepteerd','afgewezen')),
  drive_pdf_url   text,
  verzonden_op    date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index offertes_status_idx on public.offertes (status);

create table public.facturen (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid default auth.uid(),
  lead_id         uuid references public.leads (id) on delete set null,
  klant           text,
  nummer          text not null,
  bedrag          numeric(12,2) not null default 0,
  btw_percentage  numeric(5,2) not null default 21,
  status          text not null default 'open' check (status in ('open','betaald','vervallen')),
  factuurdatum    date not null default current_date,
  vervaldatum     date,
  betaald_op      date,
  drive_pdf_url   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index facturen_status_idx on public.facturen (status);
create index facturen_vervaldatum_idx on public.facturen (vervaldatum);

create table public.projecten (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid default auth.uid(),
  naam         text not null,
  omschrijving text,
  klant        text,
  status       text not null default 'actief' check (status in ('actief','on_hold','afgerond')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index projecten_status_idx on public.projecten (status);

create table public.notities (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid default auth.uid(),
  project_id      uuid references public.projecten (id) on delete cascade,
  lead_id         uuid references public.leads (id) on delete cascade,
  titel           text not null default 'Notitie',
  inhoud_markdown text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.design_docs (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid default auth.uid(),
  pad               text not null unique,
  inhoud_markdown   text not null default '',
  github_sha        text,
  laatst_gesynct_op timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.whiteboards (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid default auth.uid(),
  naam       text not null default 'Whiteboard',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stickies (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid default auth.uid(),
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
create index stickies_whiteboard_idx on public.stickies (whiteboard_id);

create table public.drive_links (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid default auth.uid(),
  titel        text not null,
  url          text not null,
  type         text not null default 'drive' check (type in ('drive','sheet','doc','map','pdf','overig')),
  context_type text not null default 'algemeen'
               check (context_type in ('algemeen','lead','project','offerte','factuur')),
  context_id   uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index drive_links_context_idx on public.drive_links (context_type, context_id);

create table public.prospector_runs (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid default auth.uid(),
  bron         text,
  status       text not null default 'klaar' check (status in ('bezig','klaar','mislukt')),
  aantal_leads integer not null default 0,
  gestart_op   timestamptz not null default now(),
  voltooid_op  timestamptz,
  details      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index prospector_runs_status_idx on public.prospector_runs (status);

create table public.integraties (
  id                      uuid primary key default gen_random_uuid(),
  owner_id                uuid default auth.uid(),
  dienst                  text not null unique,
  status                  text not null default 'niet_verbonden'
                          check (status in ('niet_verbonden','verbonden','fout')),
  config                  jsonb not null default '{}'::jsonb,
  laatst_gecontroleerd_op timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- --- updated_at-triggers + RLS + policies op ALLE tabellen -------------------
do $$
declare
  t text;
  tabellen text[] := array[
    'leads','activiteiten','offertes','facturen','projecten','notities',
    'design_docs','whiteboards','stickies','drive_links','prospector_runs','integraties'
  ];
begin
  foreach t in array tabellen loop
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();', t);

    -- RLS aan; uitsluitend geauthenticeerde toegang.
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists geauth_toegang on public.%I;', t);
    execute format(
      'create policy geauth_toegang on public.%I
         for all to authenticated
         using (true)
         with check (true);', t);
  end loop;
end $$;

-- --- View: omzet per maand op betaalde facturen ------------------------------
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
