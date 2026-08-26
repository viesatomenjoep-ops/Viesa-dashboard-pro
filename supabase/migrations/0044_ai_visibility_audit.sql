-- ============================================================================
-- Viesa Dashboard — migratie 0044: AI Visibility Audit (SaaS-module)
-- ----------------------------------------------------------------------------
-- Drie tabellen voor de nieuwe module, plus een adminrol.
--
-- TWEE AFWIJKINGEN van de oorspronkelijke opzet, allebei noodzakelijk:
--
--  1. De derde tabel heet `ai_leads`, niet `leads`. Dit project heeft al een
--     `public.leads` (migratie 0004) met een heel ander schema — bedrijf,
--     score, status, verwachte_waarde, telefoon — en die zit vol met echte
--     data. Daar is de hele bellijst, de follow-upmodule en het dashboard op
--     gebouwd. Een tweede tabel met dezelfde naam kan niet bestaan, en de
--     policy vervangen zou de werkende app breken.
--
--  2. Er bestond nog geen adminrol. CLAUDE.md zegt expliciet: geen
--     rollenbeheer. Voor de eis "alleen admins mogen schrijven" is die er nu
--     wel, zo klein mogelijk gehouden: een tabel `app_admins` met user_ids en
--     een functie `is_admin()`.
--
-- Let ook op: deze module is per gebruiker afgeschermd (auth.uid() is
-- eigenaar), terwijl de rest van het dashboard een gedeelde werkruimte is
-- (iedereen die ingelogd is ziet alles). Dat is hier bewust anders, omdat het
-- een SaaS-module is met klanten die elkaars audits niet horen te zien.
--
-- Idempotent: veilig meerdere keren uit te voeren.
-- ============================================================================

-- gen_random_uuid() komt uit pgcrypto. Op Supabase staat die standaard aan,
-- maar op een kale Postgres niet.
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Adminrol
-- ---------------------------------------------------------------------------
create table if not exists public.app_admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.app_admins enable row level security;

-- Je mag zien of jij zelf admin bent, verder niets. Rijen toevoegen doe je in
-- de SQL Editor of via de service-role — nooit vanuit de app.
drop policy if exists eigen_adminrij_lezen on public.app_admins;
create policy eigen_adminrij_lezen on public.app_admins
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- `security definer` zodat de functie langs de RLS van app_admins mag kijken;
-- `stable` zodat Postgres hem één keer per statement evalueert in plaats van
-- per rij. `set search_path` sluit schema-kaping uit.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_admins a where a.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- 1. ai_audits — één audit per (url, zoekwoord), met de scores van de modellen
-- ---------------------------------------------------------------------------
create table if not exists public.ai_audits (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid()
                 references auth.users (id) on delete cascade,
  target_url     text not null,
  niche_keyword  text not null,
  -- Per model: { success, target_found, competitors[] }.
  llm_results    jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

comment on column public.ai_audits.llm_results is
  'Per model (openai, anthropic, gemini, perplexity): success, target_found, competitors[].';

create index if not exists ai_audits_user_id_idx on public.ai_audits (user_id);
create index if not exists ai_audits_created_at_idx on public.ai_audits (user_id, created_at desc);

alter table public.ai_audits enable row level security;

-- Vier losse policies in plaats van `for all`, zodat per handeling zichtbaar is
-- wat er mag. `with check` op insert/update voorkomt dat je een rij op naam van
-- iemand anders zet.
drop policy if exists ai_audits_select on public.ai_audits;
create policy ai_audits_select on public.ai_audits
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists ai_audits_insert on public.ai_audits;
create policy ai_audits_insert on public.ai_audits
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists ai_audits_update on public.ai_audits;
create policy ai_audits_update on public.ai_audits
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists ai_audits_delete on public.ai_audits;
create policy ai_audits_delete on public.ai_audits
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 2. geo_pages — de gegenereerde GEO-artikelen
-- ---------------------------------------------------------------------------
create table if not exists public.geo_pages (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid()
             references auth.users (id) on delete cascade,
  audit_id   uuid references public.ai_audits (id) on delete cascade,
  content    text not null default '',
  status     text not null default 'draft'
             check (status in ('draft', 'published')),
  created_at timestamptz not null default now()
);

create index if not exists geo_pages_user_id_idx on public.geo_pages (user_id);
create index if not exists geo_pages_audit_id_idx on public.geo_pages (audit_id);

alter table public.geo_pages enable row level security;

drop policy if exists geo_pages_select on public.geo_pages;
create policy geo_pages_select on public.geo_pages
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists geo_pages_insert on public.geo_pages;
create policy geo_pages_insert on public.geo_pages
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists geo_pages_update on public.geo_pages;
create policy geo_pages_update on public.geo_pages
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists geo_pages_delete on public.geo_pages;
create policy geo_pages_delete on public.geo_pages
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 3. ai_leads — gedeelde prospectlijst: iedereen leest, alleen admins schrijven
--    (heet bewust NIET `leads`; zie de toelichting bovenaan)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_leads (
  id            uuid primary key default gen_random_uuid(),
  company_name  text not null,
  website       text,
  niche         text,
  contact_email text,
  created_at    timestamptz not null default now()
);

create index if not exists ai_leads_niche_idx on public.ai_leads (niche);
create index if not exists ai_leads_company_idx on public.ai_leads (company_name);

alter table public.ai_leads enable row level security;

-- Lezen mag iedereen die ingelogd is.
drop policy if exists ai_leads_select on public.ai_leads;
create policy ai_leads_select on public.ai_leads
  for select to authenticated
  using (true);

-- Schrijven alleen als admin.
drop policy if exists ai_leads_insert on public.ai_leads;
create policy ai_leads_insert on public.ai_leads
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists ai_leads_update on public.ai_leads;
create policy ai_leads_update on public.ai_leads
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Verwijderen stond niet in de eis; bewust alleen voor admins, zodat de tabel
-- niet per ongeluk leeggehaald kan worden.
drop policy if exists ai_leads_delete on public.ai_leads;
create policy ai_leads_delete on public.ai_leads
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Jezelf admin maken (vervang het e-mailadres):
--
--   insert into public.app_admins (user_id)
--   select id from auth.users where email = 'tomjo118735@gmail.com'
--   on conflict (user_id) do nothing;
-- ---------------------------------------------------------------------------
