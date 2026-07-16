# Redesign-conceptplan — "Haze"-stijl voor Viesa Dashboard

Bron: 20 referentiebeelden ("Dashboard alles.zip", 16-07-2026). 18 komen uit het
**Haze**-admin-template (één samenhangend systeem), 2 zijn extra inspiratie
(Zoho CRM = pipeline-viz, Crextio = lichtere/kleurrijke sfeer). De beelden zelf
worden **niet** in de repo bewaard; dit document is het canonieke "designverhaal".

## Doel

De bestaande, werkende Viesa-app in de Haze-stijl trekken **zonder functionaliteit
te verliezen**. Alle UI blijft Nederlands, alle data blijft op Supabase + RLS.

## Vastgelegde keuzes (16-07-2026)

1. **Kleur** — navy `#19445B` + teal `#1E9E93` blijven leidend. We voegen een
   officieel **status- & categoriepalet** toe (groen/amber/rood/blauw/paars),
   uitsluitend voor badges, labels en grafieken — niet voor grote vlakken.
2. **Omvang** — alle bestaande pagina's restylen + **3 nieuwe schermen**:
   notificatiecentrum, kanban-bord, interne chat.
3. **eCommerce/SaaS-schermen** uit de beelden = alleen stijlreferentie, geen
   functie (past niet bij een B2B-automatiseringsbureau).
4. **Klant-/lead-labels** — zowel **status** (actief/inactief/prospect) als
   **categorie/branche** in kleur.
5. **Iconen** — **Lucide** icon-set (vervangt emoji in de vaste UI).
6. **Topbalk** — uitbreiden met avatar-/gebruikersmenu + meldingen-dropdown.
   **Dark mode** = latere ronde.
7. **Gebruikersmenu** rechtsboven — Viesa-logo + het echte ingelogde e-mailadres
   (geen nep-persoon).

## Designsysteem (samengevoegd)

### Kleuren-tokens (tailwind)
- `navy #19445B` — primair, sidebar, koppen, tekst, randen (transparant).
- `oranje #1E9E93` — accent-token (historische naam), teal.
- `achtergrond #F4F6F9` — paginabachtergrond; kaarten wit.
- **Nieuw statuspalet** (alleen labels/grafieken): `groen` (goed/betaald/actief),
  `amber` (in behandeling/pending/aandacht), `rood` (risico/verlopen/inactief),
  `blauw` (info/nieuw), `paars` (extra categorie/segment).

### Bouwstenen (nieuw of uit te breiden)
- `HeroBanner` — gradient-welkomstbanner met titel, subtekst en CTA (beeld 1, 7).
- `StatKaart` — KPI met Lucide-icoon in gekleurd vlak, groot cijfer, trend-pil
  (+x% groen / −x% rood) en optionele sparkline (beeld 1, 2, 4).
- `StatusPill` — uitgebreide `Badge` met het volledige statuspalet.
- `Avatar` — initialen in een gekleurde cirkel, kleur afgeleid van de naam
  (beeld 5, 9, 11, 17).
- `Donut` / `Gauge` / `Sparkline` / `AreaGrafiek` / `PijplijnTrechter` —
  grafiekcomponenten (via **Recharts**).
- `CategorieKleur` — mapping categorie/branche → kleur (herbruikbaar).

### Iconen & grafieken
- **Lucide** (`lucide-react`) voor sidebar-, KPI-, notificatie- en actie-iconen.
- **Recharts** voor area/donut/gauge/funnel. De bestaande `StaafGrafiek` blijft
  of migreert naar Recharts (te bepalen bij fase 2).

## Per-pagina restyle-plan (bestaand)

- **Dashboard** — HeroBanner ("Welkom terug"), KPI's als `StatKaart` met icoon +
  trend + sparkline, omzet-area-grafiek, donut voor een maanddoel, gekleurde
  status-legenda. Follow-ups/agenda/taken behouden, in de nieuwe kaartstijl.
- **Klanten** — tabel met `Avatar`-initialen, **status-** én **categorie-**pil,
  zoek + filter + paginatie (beeld 17). Geen zebra.
- **Leads & pipeline** — pipeline als gekleurde stap-/trechterkaarten met oplopend
  groen + bedrag/aantal per fase (beeld 6, 19); kaarten met prioriteits- en
  score-pillen.
- **Facturen** — statuspillen (betaald/open/verlopen), factuur-maken-formulier met
  regelitems in de nieuwe stijl (beeld 18).
- **Mail** — al 3-paneel; alleen aankleden (avatars, sterren, nette iconen).
- **Agenda** — maandrooster met gekleurde events + "nieuw event"-modal met
  kleurkiezer (beeld 12).
- **Bestanden** — opslag-widget, mappen met tellers, bestandskaarten met gekleurde
  type-iconen (beeld 14).
- **Offertes / Rapportage / Projecten / Whiteboard / Koppelingen** — meeliften op
  de nieuwe bouwstenen (KPI's, kaarten, pillen, iconen).

## Nieuwe schermen (incl. datamodel)

Elke nieuwe tabel krijgt **direct RLS + policy `to authenticated`** (CLAUDE.md §7)
en wordt bewezen met `scripts/test-rls.mjs`.

1. **Notificatiecentrum** (`/notificaties`) — beeld 16.
   - Tabel `notificaties` (type, titel, tekst, gelezen, entiteit-link, created_at).
   - Gegroepeerd vandaag/gisteren, gekleurde icoon-badges, "alles gelezen".
   - Voedt ook de bel-dropdown in de topbalk.
2. **Kanban-bord** (`/taken` of `/leads` kanban-weergave) — beeld 11.
   - Bestaande `taken` uitbreiden met `status`-kolommen (todo/bezig/review/klaar),
     prioriteit, tags; sleepbaar. Hergebruik van de bestaande taken-data waar kan.
3. **Interne chat** (`/chat`) — beeld 9.
   - Tabellen `chat_gesprekken` + `chat_berichten` (afzender, tekst, gelezen).
   - Contactenlijst + bubbels. (Realtime via Supabase optioneel/later.)

## Topbalk (nieuw)

Zoek · meldingen-bel met teller + dropdown · Viesa-logo + e-mailadres in een
menu met "Uitloggen". (Taal-switch en dark-mode-toggle: later.)

## Fasering

1. **Fundament** — kleuren-tokens + statuspalet in `tailwind.config.ts`,
   `lucide-react` + `recharts` installeren, kernbouwstenen (`HeroBanner`,
   `StatKaart`, `StatusPill`/Badge-uitbreiding, `Avatar`, grafiekcomponenten),
   designdocs bijwerken.
2. **Restyle bestaande pagina's** — dashboard eerst, dan klanten, leads,
   facturen, mail, agenda, bestanden, rest.
3. **Nieuwe schermen** — migraties + RLS voor notificaties, kanban, chat;
   daarna de UI.
4. **Topbalk-uitbreiding** — avatar-menu + meldingen-dropdown.
5. **Later** — dark mode, taal-switch, realtime chat, evt. analytics-detailpagina.

## Bewust NIET (nu)

- Letterlijke eCommerce-/SaaS-functies (orders, producten, abonnement-tiers,
  churn) — alleen als vormreferentie.
- Dark mode, meertaligheid — geparkeerd.

## Kwaliteitsborging

Na elke bouwronde de **code-reviewer-subagent** draaien (huisstijl, RLS,
Nederlandse teksten) — CLAUDE.md §9.
