-- ============================================================================
-- Viesa Command Center — migratie 0050: heeft deze scan een schermafdruk?
-- ----------------------------------------------------------------------------
-- Het klantrapport opent met de homepage van de klant in een laptop. Scans van
-- vóór die functie hebben dat beeld niet, en tonen op de omslag een leeg
-- venster met "geen schermafdruk beschikbaar" — precies waar de site van de
-- klant hoort te staan.
--
-- Om daar een knop naast te kunnen zetten ("alsnog ophalen") moet de
-- scanpagina weten wélke scans hem missen. De afdruk zelf is een data-URI van
-- tientallen kilobytes; die vijftig keer meesturen om er een vinkje van te
-- maken is zonde. Vandaar een gegenereerde kolom: Postgres rekent hem uit bij
-- het schrijven, en de pagina selecteert één boolean.
--
-- `stored` en niet `virtual`: Postgres 15 kent alleen stored, en het scheelt
-- rekenwerk bij elke keer lezen.
--
-- Idempotent.
-- ============================================================================

alter table public.website_scans
  add column if not exists heeft_afdruk boolean
  generated always as ((rapport ->> 'schermafdruk') is not null) stored;

-- De vraag is altijd "welke van de laatste scans missen hun beeld", dus alleen
-- de rijen zonder afdruk hoeven in de index.
create index if not exists website_scans_zonder_afdruk_idx
  on public.website_scans (created_at desc)
  where heeft_afdruk = false;
