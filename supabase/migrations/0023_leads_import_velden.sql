-- ============================================================================
-- Viesa Command Center — migratie 0023: import-velden op leads
-- ----------------------------------------------------------------------------
-- Ondersteunt de Excel/CSV-import op de Leads-pagina. De template bevat naast
-- bedrijf/website/e-mail ook Google-Places-velden (place_id, rating, reviews)
-- en losse contactpersoon-velden (voor-/achternaam, functie, seniority,
-- afdeling, socials, direct telefoonnummer). Alle nieuwe kolommen zijn nullable
-- zodat ontbrekende gegevens geen probleem zijn; alleen bedrijf blijft verplicht.
--
-- Geen nieuwe tabel → RLS/policy op leads blijft ongewijzigd (CLAUDE.md §7).
-- Idempotent.
-- ============================================================================

alter table public.leads
  add column if not exists place_id         text,
  add column if not exists adres            text,
  add column if not exists rating_google    numeric(2,1),
  add column if not exists aantal_reviews   integer,
  add column if not exists voornaam         text,
  add column if not exists achternaam       text,
  add column if not exists functie          text,
  add column if not exists seniority        text,
  add column if not exists afdeling         text,
  add column if not exists linkedin         text,
  add column if not exists twitter          text,
  add column if not exists telefoon_contact text;

-- 'import' toevoegen aan de bron-check zodat geïmporteerde leads herkenbaar zijn.
alter table public.leads drop constraint if exists leads_bron_check;
alter table public.leads
  add constraint leads_bron_check
  check (bron in ('prospector','handmatig','import'));
