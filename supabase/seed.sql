-- ============================================================================
-- Viesa Command Center — sample seed-data
-- ----------------------------------------------------------------------------
-- Draai NA 0004 in de Supabase SQL Editor. Vult elke module met voorbeelddata.
-- owner_id blijft leeg (metadata); RLS wordt in de SQL Editor omzeild.
-- Opnieuw draaien? Verwijder eerst met de DELETE-regels onderaan (uitgecommentarieerd).
-- ============================================================================

-- Vaste UUID's zodat we kunnen koppelen.
-- leads
insert into public.leads (id, bedrijf, plaats, website, contact_naam, email, bron, score, verwachte_waarde, signalen, openingszin, status, positie) values
  ('a1111111-1111-1111-1111-111111111111','De Koffiebranderij','Utrecht','https://koffiebranderij.nl','Sanne de Vries','sanne@koffiebranderij.nl','prospector',82,4500,
    '[{"type":"Platform","waarde":"WooCommerce"},{"type":"Traffic","waarde":"stijgend"},{"type":"Geen live chat","waarde":"kans"}]'::jsonb,
    'Ik zag dat jullie webshop hard groeit — met een paar automatiseringen houden jullie die groei bij zonder extra personeel.','nieuw',1),
  ('a2222222-2222-2222-2222-222222222222','Fietsenwinkel Van Dijk','Amersfoort','https://vandijkfietsen.nl','Peter van Dijk','info@vandijkfietsen.nl','prospector',68,3000,
    '[{"type":"Platform","waarde":"Shopify"},{"type":"Handmatige facturen","waarde":"kans"}]'::jsonb,
    'Handmatig facturen maken kost jullie vast uren per week — dat kunnen we volledig automatiseren.','contact_gehad',1),
  ('a3333333-3333-3333-3333-333333333333','Bloemsierkunst Flora','Nijmegen','https://floranijmegen.nl','Lisa Bakker','lisa@floranijmegen.nl','handmatig',74,5200,
    '[{"type":"Seizoenspieken","waarde":"hoog"}]'::jsonb,
    'Rond de feestdagen lopen jullie orders vast — laten we dat proces gladstrijken.','audit_offerte',1),
  ('a4444444-4444-4444-4444-444444444444','Meubelmakerij Hout & Co','Arnhem','https://houtenco.nl','Tom Jansen','tom@houtenco.nl','prospector',90,8000,
    '[{"type":"Platform","waarde":"Magento"},{"type":"B2B-portaal","waarde":"kans"}]'::jsonb,
    'Een B2B-bestelportaal zou jullie zakelijke klanten veel tijd besparen — en jullie ook.','gewonnen',1);

-- activiteiten (incl. follow-ups van vandaag)
insert into public.activiteiten (lead_id, type, titel, omschrijving, status, follow_up_datum) values
  ('a1111111-1111-1111-1111-111111111111','call','Eerste belletje','Kort gebeld, interesse in demo.','afgerond', null),
  ('a1111111-1111-1111-1111-111111111111','follow_up','Demo inplannen','Terugbellen voor demo-afspraak.','open', current_date),
  ('a2222222-2222-2222-2222-222222222222','email','Offerteverzoek beantwoord','Prijsindicatie gestuurd.','afgerond', null),
  ('a2222222-2222-2222-2222-222222222222','follow_up','Opvolgen offerte','Checken of de prijsindicatie is bekeken.','open', current_date),
  ('a3333333-3333-3333-3333-333333333333','follow_up','Audit voorbereiden','Auditrapport afronden en versturen.','open', current_date + 2);

-- offertes
insert into public.offertes (lead_id, klant, nummer, titel, bedrag, status, verzonden_op) values
  ('a3333333-3333-3333-3333-333333333333','Bloemsierkunst Flora','2026-0001','Automatisering orderproces',5200,'verzonden', current_date - 3),
  ('a2222222-2222-2222-2222-222222222222','Fietsenwinkel Van Dijk','2026-0002','Factuurautomatisering',3000,'opvolgen', current_date - 6),
  ('a4444444-4444-4444-4444-444444444444','Meubelmakerij Hout & Co','2026-0003','B2B-bestelportaal',8000,'geaccepteerd', current_date - 20);

-- facturen (open, vervallen, en betaald verspreid over maanden voor de grafiek)
insert into public.facturen (lead_id, klant, nummer, bedrag, status, factuurdatum, vervaldatum, betaald_op) values
  ('a4444444-4444-4444-4444-444444444444','Meubelmakerij Hout & Co','VF-2026-001',8000,'betaald', current_date - 5,  current_date + 9,  current_date),
  ('a3333333-3333-3333-3333-333333333333','Bloemsierkunst Flora','VF-2026-002',5200,'open',    current_date - 2,  current_date + 12, null),
  ('a2222222-2222-2222-2222-222222222222','Fietsenwinkel Van Dijk','VF-2025-045',3000,'vervallen',current_date - 40, current_date - 10, null),
  ('a4444444-4444-4444-4444-444444444444','Meubelmakerij Hout & Co','VF-2025-030',6000,'betaald', current_date - 35, current_date - 21, current_date - 30),
  ('a4444444-4444-4444-4444-444444444444','Meubelmakerij Hout & Co','VF-2025-018',4500,'betaald', current_date - 65, current_date - 51, current_date - 60),
  ('a3333333-3333-3333-3333-333333333333','Bloemsierkunst Flora','VF-2025-009',3800,'betaald', current_date - 95, current_date - 81, current_date - 90);

-- projecten + notities
insert into public.projecten (id, naam, omschrijving, klant, status) values
  ('c1111111-1111-1111-1111-111111111111','B2B-portaal Hout & Co','Bouw van het zakelijke bestelportaal.','Meubelmakerij Hout & Co','actief');
insert into public.notities (project_id, titel, inhoud_markdown) values
  ('c1111111-1111-1111-1111-111111111111','Kickoff','## Kickoff\n\n- Scope: bestelportaal + koppeling met voorraad\n- Deadline: eind kwartaal');

-- design_docs
insert into public.design_docs (pad, inhoud_markdown) values
  ('design-systems/huisstijl.md','# Huisstijl\n\nNavy #19445B, oranje #F26B21 als enig accent.');

-- whiteboard + stickies
insert into public.whiteboards (id, naam) values
  ('d1111111-1111-1111-1111-111111111111','Ideeën');
insert into public.stickies (whiteboard_id, tekst, kleur, x, y) values
  ('d1111111-1111-1111-1111-111111111111','Nieuwsbrief-automatisering aanbieden','#FDE68A',40,40),
  ('d1111111-1111-1111-1111-111111111111','Case study Hout & Co maken','#BFDBFE',280,120);

-- drive_links
insert into public.drive_links (titel, url, type, context_type) values
  ('Offertesjabloon','https://docs.google.com/document/d/voorbeeld','doc','algemeen'),
  ('Klantenoverzicht','https://docs.google.com/spreadsheets/d/voorbeeld','sheet','algemeen');

-- prospector_runs
insert into public.prospector_runs (bron, status, aantal_leads, voltooid_op) values
  ('webshop-prospector','klaar',3, now());

-- integraties (koppelingen-pagina)
insert into public.integraties (dienst, status) values
  ('google_drive','niet_verbonden'),('google_sheets','niet_verbonden'),
  ('google_docs','niet_verbonden'),('gmail','niet_verbonden'),
  ('outlook','niet_verbonden'),('slack','niet_verbonden'),
  ('claude_api','niet_verbonden')
on conflict (dienst) do nothing;

-- Opruimen (indien opnieuw seeden):
-- delete from public.facturen; delete from public.offertes; delete from public.activiteiten;
-- delete from public.notities; delete from public.stickies; delete from public.whiteboards;
-- delete from public.drive_links; delete from public.prospector_runs; delete from public.projecten;
-- delete from public.design_docs; delete from public.leads;
