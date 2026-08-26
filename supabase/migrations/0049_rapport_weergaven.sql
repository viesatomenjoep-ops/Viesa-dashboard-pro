-- ============================================================================
-- Viesa Command Center — migratie 0049: wanneer een klantrapport geopend wordt
-- ----------------------------------------------------------------------------
-- Je stuurt een prospect zijn Deep Scan en hoort daarna niets meer. Of hij het
-- geopend heeft is het sterkste belsignaal dat er is: iemand die vanochtend
-- twee keer door zijn rapport scrolde, is een heel ander gesprek dan iemand die
-- de mail nooit aanraakte. Zonder dit blijft de opvolging gokwerk.
--
-- Wat we bewaren is met opzet het minimum: welke scan, welk van de drie
-- documenten, en wanneer. Geen IP-adres, geen user-agent, geen cookie, geen
-- herkenning tussen bezoeken door. Dat is genoeg om te weten wanneer je moet
-- bellen, en het scheelt ons een verwerking die onder de AVG uitleg zou vragen
-- die we niet willen geven aan iemand die we nog moeten leren kennen.
--
-- Er is bewust géén policy voor `anon`. Het rapport is een openbare pagina,
-- maar de bezoeker schrijft hier niet zelf: de server legt de weergave vast met
-- de service-role sleutel (zie lib/rapport/weergave.ts). Zou anon wél mogen
-- invoegen, dan kan iedereen die een deellink heeft de teller volschrijven.
--
-- Idempotent.
-- ============================================================================

create table if not exists public.rapport_weergaven (
  id         uuid primary key default gen_random_uuid(),
  scan_id    uuid not null references public.website_scans (id) on delete cascade,
  -- Welke van de drie documenten: 'volledig', 'kort' of 'voorstel'. Dat
  -- onderscheid vertelt iets: wie het voorstel opent is verder dan wie alleen
  -- de samenvatting bekeek.
  soort      text not null check (soort in ('volledig', 'kort', 'voorstel')),
  bekeken_op timestamptz not null default now()
);

-- De vraag die we stellen is altijd "wat is er bij deze scan gebeurd, nieuwste
-- eerst" — vandaar deze samengestelde index en niet twee losse.
create index if not exists rapport_weergaven_scan_idx
  on public.rapport_weergaven (scan_id, bekeken_op desc);

alter table public.rapport_weergaven enable row level security;

-- Alleen ingelogde gebruikers lezen de weergaven; niemand anders raakt de tabel
-- aan. Het vastleggen gebeurt server-side boven RLS.
drop policy if exists rapport_weergaven_geauth on public.rapport_weergaven;
create policy rapport_weergaven_geauth on public.rapport_weergaven
  for all to authenticated using (true) with check (true);
