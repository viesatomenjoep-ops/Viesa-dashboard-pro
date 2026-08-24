-- 0039_brand_factory.sql
-- Brand Factory tabellen voor het Viesa Dashboard (read-only weergave; data
-- komt binnen via POST /api/brand-factory/sync vanaf de lokale Mac).
-- RLS: gedeelde werkruimte (elke geauthenticeerde gebruiker). Idempotent.

create table if not exists merken (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  naam          text not null,
  shop_url      text,
  platform      text default 'shopify',
  tokens        jsonb default '{}',
  surfaces      jsonb default '{}',
  usps          text[] default '{}',
  copy_regels   jsonb default '{}',
  actief        boolean default true,
  aangemaakt_op timestamptz default now(),
  bijgewerkt_op timestamptz default now()
);
alter table merken enable row level security;
drop policy if exists merken_auth on merken;
create policy merken_auth on merken for all to authenticated using (true) with check (true);

create table if not exists merk_producten (
  id                uuid primary key default gen_random_uuid(),
  merk_id           uuid references merken(id) on delete cascade not null,
  handle            text not null,
  titel             text not null,
  product_type      text,
  beschikbaar       boolean default true,
  prijs             numeric(10,2),
  adviesprijs       numeric(10,2),
  afbeelding        text,
  model             text,
  energielabel      text,
  varianten         jsonb default '[]',
  gescraped_op      timestamptz default now(),
  unique (merk_id, handle)
);
alter table merk_producten enable row level security;
drop policy if exists merk_producten_auth on merk_producten;
create policy merk_producten_auth on merk_producten for all to authenticated using (true) with check (true);

create table if not exists ad_concepten (
  id              uuid primary key default gen_random_uuid(),
  merk_id         uuid references merken(id) on delete cascade not null,
  key             text not null,
  batch           text not null,
  mechaniek       text not null check (mechaniek in ('product','social','sale','brand')),
  template        text not null,
  product_handle  text,
  headline        jsonb,
  subline         jsonb,
  badge           text,
  cta             jsonb,
  pricing         text default 'normal',
  toon_prijs      boolean default true,
  claim           text,
  formats         text[],
  surfaces        text[],
  locales         text[],
  status          text default 'concept' check (status in ('concept','gerenderd','goedgekeurd','afgewezen')),
  aangemaakt_op   timestamptz default now(),
  unique (merk_id, key)
);
alter table ad_concepten enable row level security;
drop policy if exists ad_concepten_auth on ad_concepten;
create policy ad_concepten_auth on ad_concepten for all to authenticated using (true) with check (true);

create table if not exists ad_renders (
  id              uuid primary key default gen_random_uuid(),
  concept_id      uuid references ad_concepten(id) on delete cascade not null,
  variant         text not null,
  bestand_url     text,
  formaat         text,
  breedte         int,
  hoogte          int,
  type            text default 'still' check (type in ('still','video')),
  gerenderd_op    timestamptz default now()
);
alter table ad_renders enable row level security;
drop policy if exists ad_renders_auth on ad_renders;
create policy ad_renders_auth on ad_renders for all to authenticated using (true) with check (true);

-- KPI-view voor de Brand Factory dashboardpagina
create or replace view brand_factory_stats as
select
  m.id as merk_id,
  m.slug,
  m.naam,
  count(distinct ac.id) as concepten,
  count(distinct ar.id) as renders,
  count(distinct ac.batch) as batches,
  max(ar.gerenderd_op) as laatste_render
from merken m
left join ad_concepten ac on ac.merk_id = m.id
left join ad_renders ar on ar.concept_id = ac.id
group by m.id, m.slug, m.naam;
