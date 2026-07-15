-- ============================================================================
-- Viesa Command Center — migratie 0026: branche, bedrijfsgrootte & medewerkers
-- ----------------------------------------------------------------------------
-- Extra kwalificatievelden op leads én klanten:
--   - branche            (sector, opslaanbare categorie)
--   - bedrijfsgrootte    (ZZP/MKB/MKB-plus/Groothandel/…, opslaanbare categorie)
--   - aantal_medewerkers (getal, vaak af te leiden uit LinkedIn e.d.)
-- Voegt twee nieuwe categorie-soorten toe. Idempotent.
-- ============================================================================

-- --- categorieen: nieuwe soorten toestaan -----------------------------------
alter table public.categorieen drop constraint if exists categorieen_soort_check;
alter table public.categorieen
  add constraint categorieen_soort_check
  check (soort in ('it_aanbod','platform','bestand_type','branche','bedrijfsgrootte'));

-- --- kolommen op leads ------------------------------------------------------
alter table public.leads
  add column if not exists branche            text,
  add column if not exists bedrijfsgrootte    text,
  add column if not exists aantal_medewerkers integer;

-- --- kolommen op klanten ----------------------------------------------------
alter table public.klanten
  add column if not exists branche            text,
  add column if not exists bedrijfsgrootte    text,
  add column if not exists aantal_medewerkers integer;

-- --- seed: standaardcategorieën (idempotent) --------------------------------
insert into public.categorieen (soort, waarde) values
  ('branche', 'E-commerce / webshop'),
  ('branche', 'Groothandel'),
  ('branche', 'Retail / detailhandel'),
  ('branche', 'Productie / fabrikant'),
  ('branche', 'Horeca'),
  ('branche', 'Bouw & installatie'),
  ('branche', 'Transport & logistiek'),
  ('branche', 'Zakelijke dienstverlening'),
  ('branche', 'Gezondheidszorg'),
  ('branche', 'Overig'),
  ('bedrijfsgrootte', 'Kleine ondernemer / ZZP'),
  ('bedrijfsgrootte', 'MKB'),
  ('bedrijfsgrootte', 'MKB-plus'),
  ('bedrijfsgrootte', 'Groothandel'),
  ('bedrijfsgrootte', 'Grootbedrijf / corporate')
on conflict (soort, waarde) do nothing;
