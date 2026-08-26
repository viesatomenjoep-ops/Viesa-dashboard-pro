-- ============================================================================
-- Viesa Dashboard — migratie 0043: favoriete sjablonen
-- ----------------------------------------------------------------------------
-- Met ruim honderd sjablonen is de lijst te lang om elke keer door te scrollen.
-- Een vlag per sjabloon zet de beste bovenaan — in het overzicht én in de
-- sjabloonkiezer van het mailvenster.
--
-- Gedeelde werkruimte: een favoriet geldt voor iedereen die het dashboard
-- gebruikt, net als de sjablonen zelf. Geen kolom per gebruiker dus.
--
-- sjablonen heeft al RLS (policy geauth_toegang, migratie 0032), dus deze kolom
-- erft die beveiliging. Idempotent.
-- ============================================================================

alter table public.sjablonen
  add column if not exists favoriet boolean not null default false;

comment on column public.sjablonen.favoriet is
  'Favoriet: wordt bovenaan getoond in het overzicht en in de sjabloonkiezer.';

-- Favorieten worden altijd samen met het type opgevraagd.
create index if not exists sjablonen_favoriet_idx
  on public.sjablonen (type, favoriet) where favoriet;
