-- ============================================================================
-- Viesa Command Center — migratie 0024: categorieën, klanten & geo-velden
-- ----------------------------------------------------------------------------
-- 1. `categorieen`  — herbruikbare, opslaanbare categorieën (vrije regel wordt
--                     direct een echte categorie). Soorten: it_aanbod, platform,
--                     bestand_type. Gedeeld in de werkruimte.
-- 2. `klanten`      — nieuwe module, gespiegeld op leads + geo & categorie-velden.
-- 3. leads          — land/provincie + it_aanbod/platform kolommen.
-- 4. drive_links    — type-check laten vallen zodat vrije categorieën mogen.
--
-- RLS: elke nieuwe tabel krijgt direct de policy `geauth_toegang`
-- (for all to authenticated) — conform CLAUDE.md §7. Idempotent.
-- ============================================================================

-- --- 1. categorieen ---------------------------------------------------------
create table if not exists public.categorieen (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid default auth.uid(),
  soort      text not null check (soort in ('it_aanbod','platform','bestand_type')),
  waarde     text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (soort, waarde)
);
create index if not exists categorieen_soort_idx on public.categorieen (soort);

-- --- 2. klanten (gespiegeld op leads) ---------------------------------------
create table if not exists public.klanten (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid default auth.uid(),
  bedrijf           text not null,
  plaats            text,
  adres             text,
  land              text not null default 'Nederland',
  provincie         text,
  website           text,
  contact_naam      text,
  email             text,
  telefoon          text,
  telefoon_contact  text,
  place_id          text,
  rating_google     numeric(2,1),
  aantal_reviews    integer,
  voornaam          text,
  achternaam        text,
  functie           text,
  seniority         text,
  afdeling          text,
  linkedin          text,
  twitter           text,
  it_aanbod         text,
  platform          text,
  score             integer not null default 50 check (score between 0 and 100),
  status            text not null default 'actief'
                    check (status in ('actief','inactief','prospect')),
  notities          text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
-- Zorg dat álle kolommen bestaan, óók als de tabel al bestond uit een eerder
-- script (dan slaat `create table if not exists` hierboven over). Kolommen zijn
-- nullable of hebben een default, zodat toevoegen op een gevulde tabel lukt.
alter table public.klanten
  add column if not exists owner_id          uuid default auth.uid(),
  add column if not exists bedrijf           text,
  add column if not exists plaats            text,
  add column if not exists adres             text,
  add column if not exists land              text not null default 'Nederland',
  add column if not exists provincie         text,
  add column if not exists website           text,
  add column if not exists contact_naam      text,
  add column if not exists email             text,
  add column if not exists telefoon          text,
  add column if not exists telefoon_contact  text,
  add column if not exists place_id          text,
  add column if not exists rating_google     numeric(2,1),
  add column if not exists aantal_reviews    integer,
  add column if not exists voornaam          text,
  add column if not exists achternaam        text,
  add column if not exists functie           text,
  add column if not exists seniority         text,
  add column if not exists afdeling          text,
  add column if not exists linkedin          text,
  add column if not exists twitter           text,
  add column if not exists it_aanbod         text,
  add column if not exists platform          text,
  add column if not exists score             integer not null default 50,
  add column if not exists status            text not null default 'actief',
  add column if not exists notities          text,
  add column if not exists created_at        timestamptz not null default now(),
  add column if not exists updated_at        timestamptz not null default now();

create index if not exists klanten_provincie_idx on public.klanten (provincie);

-- --- 3. leads: geo + categorie-velden ---------------------------------------
alter table public.leads
  add column if not exists land      text not null default 'Nederland',
  add column if not exists provincie text,
  add column if not exists it_aanbod text,
  add column if not exists platform  text;

-- --- 4. drive_links: dynamische categorieën toestaan ------------------------
alter table public.drive_links drop constraint if exists drive_links_type_check;

-- Bestaande (lowercase) types gelijktrekken met de nieuwe categorie-waarden,
-- zodat de typefilter en de keuzelijst niet dubbel ('drive' én 'Drive') tonen.
update public.drive_links set type = case lower(type)
  when 'drive'  then 'Drive'
  when 'sheet'  then 'Sheet'
  when 'doc'    then 'Doc'
  when 'map'    then 'Map'
  when 'pdf'    then 'PDF'
  when 'overig' then 'Overig'
  else type
end;

-- --- Triggers + RLS + policies op de nieuwe tabellen ------------------------
do $$
declare
  t text;
  tabellen text[] := array['categorieen','klanten'];
begin
  foreach t in array tabellen loop
    execute format('drop trigger if exists set_updated_at on public.%I;', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at();', t);

    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists geauth_toegang on public.%I;', t);
    execute format(
      'create policy geauth_toegang on public.%I
         for all to authenticated
         using (true)
         with check (true);', t);
  end loop;
end $$;

-- --- Seed: standaardcategorieën (idempotent) --------------------------------
insert into public.categorieen (soort, waarde) values
  ('platform', 'Shopify'),
  ('platform', 'WooCommerce'),
  ('platform', 'Magento'),
  ('platform', 'Lightspeed'),
  ('platform', 'CCV Shop'),
  ('platform', 'Shopware'),
  ('platform', 'PrestaShop'),
  ('platform', 'Wix'),
  ('platform', 'Squarespace'),
  ('platform', 'Maatwerk / custom'),
  ('platform', 'Onbekend'),
  ('it_aanbod', 'Webshop-integratie'),
  ('it_aanbod', 'Voorraadkoppeling'),
  ('it_aanbod', 'Order-automatisering'),
  ('it_aanbod', 'Boekhoudkoppeling'),
  ('it_aanbod', 'E-mail- & marketingautomatisering'),
  ('it_aanbod', 'Data-dashboard'),
  ('it_aanbod', 'API-koppeling'),
  ('it_aanbod', 'AI-chatbot'),
  ('bestand_type', 'Drive'),
  ('bestand_type', 'Sheet'),
  ('bestand_type', 'Doc'),
  ('bestand_type', 'Map'),
  ('bestand_type', 'PDF'),
  ('bestand_type', 'Overig')
on conflict (soort, waarde) do nothing;
