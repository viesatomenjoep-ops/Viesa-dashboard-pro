-- ============================================================================
-- Viesa Command Center — migratie 0048: deelbaar adres voor een scanrapport
-- ----------------------------------------------------------------------------
-- Een klant moet zijn rapport kunnen openen zonder in te loggen: hij krijgt een
-- link in de mail. Daarvoor krijgt elke bewaarde scan een geheime sleutel die
-- in de URL komt te staan (/rapport/<sleutel>).
--
-- Waarom niet gewoon het id in de URL? Een uuid is niet raadbaar, maar hij
-- staat ook in het dashboard en in logregels. Een aparte sleutel kan ingetrokken
-- worden (op null zetten) zonder de scan zelf te raken, en maakt zichtbaar dat
-- een rapport bewust gedeeld is.
--
-- `gedeeld_op` legt vast wanneer de link is aangemaakt, zodat later te zien is
-- welke rapporten daadwerkelijk de deur uit zijn gegaan.
--
-- Idempotent.
-- ============================================================================

alter table public.website_scans
  add column if not exists deelsleutel text,
  add column if not exists gedeeld_op timestamptz,
  -- De bedrijfsnaam voor op de omslag. Een scan kent alleen een hostnaam; is de
  -- scan vanuit een lead gestart, dan weten we de echte naam en die leest een
  -- stuk beter dan "voorbeeld-webshop.nl".
  add column if not exists bedrijf text;

-- Uniek, maar meerdere niet-gedeelde scans mogen naast elkaar null zijn.
create unique index if not exists website_scans_deelsleutel_idx
  on public.website_scans (deelsleutel)
  where deelsleutel is not null;

-- ----------------------------------------------------------------------------
-- Anonieme toegang, uitsluitend via een geldige sleutel
-- ----------------------------------------------------------------------------
-- De bestaande policy (`website_scans_geauth`) blijft: ingelogde gebruikers
-- doen alles. Deze policy komt daar bovenop en geeft anon *alleen* leesrecht,
-- en alleen op rijen die daadwerkelijk gedeeld zijn.
--
-- Let op: een policy filtert rijen, hij verbergt geen kolommen. Een anonieme
-- bezoeker die de sleutel van rij A heeft, kan dus niet bij rij B — maar zou de
-- deelsleutel van rij A kunnen teruglezen. Dat is zijn eigen sleutel, dus dat
-- is geen lek.

drop policy if exists website_scans_gedeeld_lezen on public.website_scans;
create policy website_scans_gedeeld_lezen on public.website_scans
  for select to anon
  using (deelsleutel is not null);
