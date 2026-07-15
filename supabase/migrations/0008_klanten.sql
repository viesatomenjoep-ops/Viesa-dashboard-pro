-- ============================================================================
-- Viesa Command Center — migratie 0008: klantenbestand
-- ----------------------------------------------------------------------------
-- Centrale klanten-tabel (met branche, regio, stad, land, type) waar leads,
-- offertes en facturen aan gekoppeld worden (klant_id). RLS: gedeelde werkruimte.
-- Idempotent.
-- ============================================================================

create table if not exists public.klanten (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid default auth.uid(),
  bedrijf       text not null,
  contact_naam  text,
  email         text,
  telefoon      text,
  website       text,
  straat        text,
  postcode      text,
  stad          text,
  regio         text,
  land          text not null default 'Nederland',
  branche       text,
  type          text not null default 'prospect' check (type in ('prospect','klant','partner')),
  notities      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists klanten_branche_idx on public.klanten (branche);
create index if not exists klanten_regio_idx on public.klanten (regio);
create index if not exists klanten_type_idx on public.klanten (type);

-- Koppelingen naar het klantenbestand.
alter table public.leads    add column if not exists klant_id uuid references public.klanten (id) on delete set null;
alter table public.offertes add column if not exists klant_id uuid references public.klanten (id) on delete set null;
alter table public.facturen add column if not exists klant_id uuid references public.klanten (id) on delete set null;

-- updated_at-trigger (functie uit 0004).
drop trigger if exists set_updated_at on public.klanten;
create trigger set_updated_at before update on public.klanten
  for each row execute function public.set_updated_at();

-- RLS: gedeelde werkruimte (elke geauthenticeerde gebruiker).
alter table public.klanten enable row level security;
drop policy if exists geauth_toegang on public.klanten;
create policy geauth_toegang on public.klanten
  for all to authenticated
  using (true)
  with check (true);
