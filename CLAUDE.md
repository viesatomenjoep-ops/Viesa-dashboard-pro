# CLAUDE.md — Viesa Dashboard Pro

## 1. Doel

Intern **administratie- en salesdashboard** voor **Viesa Automations**.
**Gedeelde werkruimte**: één of enkele door de eigenaar aangemaakte gebruikers
delen dezelfde data. Geen publieke signup, geen rollenbeheer.

## 2. Stack

- **Next.js 14** (App Router, TypeScript, Tailwind CSS)
- **Supabase** — Postgres + Auth + Row Level Security (RLS)
- **Vercel** — hosting en deploys

## 3. Huisstijl

- Primaire kleur: **navy `#19445B`**
- Accent: **oranje `#F26B21`** — het **enige** accent, spaarzaam gebruiken
- Achtergrond: **`#F4F6F9`**
- **Geen zebra-tabellen** (geen afwisselende rijkleuren)
- **KPI's staan altijd bovenaan** de pagina
- **Alle UI-teksten in het Nederlands**

Uitgebreide richtlijnen staan in `/design-systems` (zie sectie 5).

## 4. Conventies

- **Server components waar mogelijk**; gebruik client components alleen als
  interactiviteit dat vereist (`'use client'`).
- **Alle Supabase-calls via een centrale client in `/lib`**:
  - `lib/supabase/server.ts` — server components / route handlers (anon + RLS)
  - `lib/supabase/client.ts` — client components (anon)
  - `lib/supabase/service.ts` — server-only, service-role (omzeilt RLS; alleen
    bewust voor beheertaken)
- **Secrets alleen in `.env.local`** (staat in `.gitignore`, nooit committen).
  `.env.example` bevat placeholders voor alle keys. Alleen `NEXT_PUBLIC_`-keys
  mogen de browser bereiken.
- RLS staat aan op alle tabellen; server-only geheimen nooit met een
  `NEXT_PUBLIC_`-prefix.

## 5. Design-context

De map **`/design-systems`** bevat Markdown-bestanden die als **design-context**
gelden. Raadpleeg deze bestanden vóór het bouwen of wijzigen van UI:

- `design-systems/huisstijl.md` — kleuren, typografie, taal
- `design-systems/patronen.md` — KPI's, tabellen, knoppen, layout

## 6. Modules (routes)

Beveiligde pagina's staan in de route-group `app/(app)`; `/login` staat erbuiten.
De middleware (`middleware.ts`) beschermt alle routes.

- `/` — dashboard met KPI's, omzetgrafiek, follow-ups van vandaag, recente leads
- `/leads` — leads & pipeline-kanban (drag & drop), `/leads/[id]` detail met
  activiteitenlog + follow-up plannen
- `/offertes` (+ `/[id]`) — offertes, Claude-generator, "Maak factuur"
- `/facturen` (+ `/[id]`) — facturen, btw, statusflow, herinneringen
- `/projecten` (+ `/[id]`) — projecten, markdown-notities, Drive-links
- `/bestanden` — centrale Drive-links (nooit bestanden zelf)
- `/whiteboard` — meerdere borden met sleepbare sticky notes
- `/bellen` — bellijst met AI-suggesties, terugbelagenda (openstaande follow-ups
  t/m vandaag), Fonio-democonsole en per lead een **gespreksvenster**: belscript
  meelezen, uitkomst kiezen, notitie en follow-up in één handeling vastleggen
  (`legGesprekVast` → activiteit `call` + activiteit `follow_up`)
- `/sjablonen` — sjablonen-machine voor `email`, `belscript`, `offerte`, `audit`.
  Standaardset importeren vult o.a. 25 outreach-mails (`lib/mailtemplates-outreach.ts`)
  en 25 belscripts (`lib/belscripts.ts`)
- `/koppelingen` — status van diensten (o.a. Gmail-OAuth) + Fonio-demo-instellingen
- `/zoeken` — globale zoekbalk over leads/projecten/notities/offertes
- `/design` — markdown-editor voor design_docs met GitHub-sync
  (**bewust niet in de navigatie**; alleen via directe URL)
- `/scan` — **Websitescanner**: één URL → één oordeel (0–100). Drie metingen,
  gewogen 40/35/25: AI-zichtbaarheid (de vier modellen), GEO-gereedheid
  (`lib/geo-analyse.ts` — robots.txt, JSON-LD, kopstructuur, llms.txt) en
  techniek (PageSpeed Insights). Ontbreekt een onderdeel, dan wordt herwogen
  over wat er wél is in plaats van een nul mee te tellen. De niche wordt
  afgeleid uit de pagina als je hem niet opgeeft.
- `/audit` — **AI Visibility Audit** (SaaS-module): vraagt ChatGPT, Claude,
  Gemini en Perplexity parallel wie zij aanraden in een niche, en toont per
  model of de klant genoemd wordt. Met PDF-rapport voor de prospect en een
  GEO-artikelgenerator. `/audit/leads` is de bijbehorende prospectlijst.
- `/rapport/[sleutel]` — het **klantrapport** van een Deep Scan, buiten de login
  (RLS via de deelsleutel, migratie 0048). Drie documenten op hetzelfde adres:
  het volledige rapport, `/kort` (samenvatting van twee vellen) en `/voorstel`
  (wat Viesa aanbiedt). Alle drie zijn hetzelfde document als hun PDF — de knop
  drukt de pagina af, er is geen tweede sjabloon. Elke opening wordt vastgelegd
  (migratie 0049, `lib/rapport/weergave.ts`) en verschijnt als belsignaal in de
  scangeschiedenis. Voorbeelden achter de login op `/rapport-voorbeeld`,
  `/rapport-voorbeeld/kort`, `/rapport-voorbeeld/voorstel`,
  `/rapport-voorbeeld/mail` (de voorstelmail, met de omgevingswaarden erboven)
  en `/rapport-voorbeeld/promo` (de bewerkbare tegelmail, zie §14).
- `/brand-factory` — **Brand Factory dashboard**: overzicht van merken,
  concepten, renders en batches. Data komt binnen via `POST /api/brand-factory/sync`
  vanuit het lokale Brand Factory-project op de Mac (na elke batch-render).

API-routes: `POST /api/prospector` (prospector-ingest), `GET /api/cron/facturen`
(dagelijkse vervallen-bewaking), `POST /api/genereer-offerte` (Claude),
`GET /api/google/oauth/{start,callback}` (Gmail), `GET /api/brand-factory`
(merken-stats), `POST /api/brand-factory/sync` (batch-sync vanuit lokale Mac,
auth via `BRAND_FACTORY_SECRET`), `POST /api/audit` (vier LLM's parallel via
`Promise.allSettled`). Cron-config: `vercel.json`.

## 7. Datamodel & beveiliging

- Het canonieke datamodel staat in `supabase/migrations/0004_canoniek_datamodel.sql`
  (tabellen: leads, activiteiten, offertes, facturen, projecten, notities,
  design_docs, whiteboards, stickies, drive_links, prospector_runs, integraties;
  + view `omzet_per_maand`). Voorbeelddata: `supabase/seed.sql`.
- **Migratie 0050** (`website_scans.heeft_afdruk`): een gegenereerde kolom die
  zegt of er een schermafdruk in het bewaarde rapport zit. Nodig om er een knop
  "beeld ophalen" naast te zetten zonder de data-URI van tientallen kilobytes
  vijftig keer mee te sturen.
- **Migratie 0049** (`rapport_weergaven`): legt vast wanneer een klantrapport
  geopend wordt — het sterkste belsignaal dat er is. Bewust géén policy voor
  `anon`: het rapport is openbaar, maar de bezoeker schrijft niet zelf. De
  server legt het vast met de service-role sleutel, anders kan iedereen met een
  deellink de teller volschrijven. Opgeslagen wordt het minimum (scan, soort,
  tijdstip) — geen IP, geen user-agent, geen cookie.
- **Migratie 0040** (belgesprekken): `activiteiten.uitkomst` (bereikt, voicemail,
  niet_opgenomen, terugbellen, afspraak, geen_interesse), `leads.belpogingen`, en
  `sjablonen.type` uitgebreid met `'belscript'`.
  **0041**: `sjablonen.lettertype`. **0042**: herstelt de type-constraint hard
  (zoekt elke CHECK op `type` op ongeacht de naam). **0043**: `sjablonen.favoriet`
  — favorieten staan bovenaan in het overzicht en in de sjabloonkiezer. Alle vier
  erven de RLS van hun tabel.
- **`supabase/seed-sjablonen.sql`** bevat alle 124 standaardsjablonen als één
  idempotente INSERT, om ze buiten de app om te laden wanneer de importknop of
  de deploy dwarsligt. Gegenereerd uit `standaardSjablonen()`.
- **Auth**: alleen e-mail/wachtwoord-login, single-/gedeelde gebruiker, **registratie
  uitgeschakeld** (Supabase → Authentication → Sign In / Providers: signups uit).
  Geen publieke signup, geen rollenbeheer.
- **RLS-regel — geen uitzonderingen**: *elke nieuwe tabel krijgt direct RLS aan +
  een policy die uitsluitend geauthenticeerde toegang toestaat*
  (`for all to authenticated using (true) with check (true)`). Nooit een tabel
  zonder policy laten staan; anoniem = geen toegang. Bewijs met `scripts/test-rls.mjs`.
- Alle env-keys staan in `.env.example`. Server-only geheimen (service-role,
  `LEADS_INGEST_SECRET`, `CRON_SECRET`, `GITHUB_TOKEN`, `ANTHROPIC_API_KEY`,
  `GOOGLE_CLIENT_SECRET`, `OWNER_USER_ID`) nooit met `NEXT_PUBLIC_`-prefix.

## 8. Geleerde lessen

Bij elke gemelde fout die niet nog eens mag gebeuren: hier bijwerken.

- **Elke nieuwe tabel** krijgt direct RLS + policy (`to authenticated`), geen
  uitzonderingen. Bewijs met `scripts/test-rls.mjs`.
- **`/api`-routes** worden in de middleware uitgesloten van de login-redirect;
  ze doen hun eigen auth (gedeeld geheim / `getUser()`).
- **Supabase-gebruiker** altijd met **Auto Confirm** aanmaken, anders weigert
  inloggen ("Email not confirmed").
- **Anon-key** nooit gemaskeerd kopiëren: een bullet-teken (`•`, U+2022) in de
  key geeft bij het inloggen `Cannot convert argument to a ByteString`. Kopieer
  de echte waarde via Supabase → Project Settings → API.
- **Accent-kleur**: het Tailwind-token heet historisch `oranje` maar bevat nu
  teal `#1E9E93`; de klassenaam is bewust behouden zodat het accent op één plek
  te wijzigen is. Sticky-notes gebruiken eigen hex-kleuren.
- **Env-wijzigingen** in Vercel vereisen een **redeploy** voordat ze meetellen.
- **contentEditable + `dangerouslySetInnerHTML`**: React past de innerHTML bij
  élke re-render opnieuw toe en wist dan alles wat de gebruiker typte (bug in de
  mail-editor). Oplossing: het contentEditable-element met `useMemo` memoizen
  zodat React het bij het diffen overslaat (zie `components/RijkeEditor.tsx`).
  Opmaakknoppen boven zo'n editor krijgen `onMouseDown={preventDefault}` zodat
  ze de tekstselectie niet stelen.
- **Webfonts werken niet in e-mail**: Gmail en Outlook.com strippen `<link>` en
  `@font-face` (en `saniteerHtml()` haalt ze er zelf al uit). Een lettertypekiezer
  voor mail moet dus **font-stacks met een veilige terugval** aanbieden — zie
  `lib/lettertypes.ts`, groep `veilig` (staat op elk apparaat) versus `webfont`
  (alleen echt zichtbaar in het dashboard-voorbeeld). Standaard is Times New Roman.
- **CSS-variabele op de buitenste laag, niet op het gememoizeerde veld**: het
  contentEditable in `GroteEditor` is met `useMemo` bevroren. Zet je het gekozen
  lettertype in zijn inline `style`, dan hoort het bij de deps, wordt het veld bij
  elke fontwissel opnieuw gemonteerd en ben je je getypte tekst kwijt. Oplossing:
  `--mail-font` op de omhullende `<div>` zetten; als custom property erft hij
  gewoon naar binnen door (`.prose-viesa` in `app/globals.css` leest hem).
- **Follow-ups filteren met `lte`, nooit met `eq`**: filterde het dashboard op
  `follow_up_datum = vandaag`, dan verdween alles wat gisteren was blijven liggen
  stilletjes uit beeld. Gebruik `.lte(...)` en label oudere items als
  "achterstallig" (`app/(app)/kpi.ts`, `app/(app)/bellen/page.tsx`).
- **Nooit een bulk-insert waarvan je de fout inslikt**: `importeerStandaard()`
  voegde alle 124 sjablonen in één INSERT toe en ving alleen een ontbrekende
  kolom af. Weigerde de database één rij (het type `belscript`), dan kwam er
  níéts binnen — ook de e-mailsjablonen niet — en meldde de pagina alsnog
  "geïmporteerd". Een mislukte import was zo niet te onderscheiden van een
  geslaagde, en dat kostte uren zoeken. Regel: **per groep invoegen, het
  werkelijk ingevoegde aantal melden, en een fout altijd tonen.**
- **Een CHECK-constraint op naam droppen is niet betrouwbaar**: migratie 0040
  deed `drop constraint if exists sjablonen_type_check`. Postgres kiest die naam
  automatisch, maar bij een tweede check op dezelfde tabel wordt het
  `..._check1` — en dan doet die drop niets, zónder foutmelding. Zoek de
  constraint op via `pg_constraint` (zie migratie 0042) in plaats van te gokken.
- **Een Next.js route-bestand mag alleen HTTP-handlers en config exporteren.**
  `app/api/audit/route.ts` exporteerde ook types en hulpfuncties; `next build`
  faalt dan met "does not match the required types of a Next.js Route" — terwijl
  `tsc --noEmit` gewoon groen is. Zet zulke code in `lib/`; dat is bovendien de
  enige manier om hem los te testen.
- **Twee lijsten die hetzelfde moeten dekken, lopen uit elkaar.** De scanner had
  een `STAPPEN`-lijst voor de weergave en een tweede opsomming in `laadRapport`
  die een bewaarde scan terugzette. Toen `technologie` erbij kwam, kreeg alleen
  de eerste die stap; de weergave las `st.status` van niets en de pagina klapte
  eruit met "undefined is not an object". Een `Record<string, …>` accepteert elke
  sleutelverzameling, dus de typecontrole zweeg. Nu komen beide uit
  `lib/scan-stappen.ts`, en `scripts/test-scan-stappen.mjs` eist dat elke stap
  een staat krijgt.
- **Een JSON-kolom is geen type.** `website_scans.rapport` is geschreven door de
  scanner van *toen*; `JSON.stringify` laat bovendien elke `undefined` sleutel
  weg. `rapportVanScan` controleerde op `scores.lcp === null`, een ontbrekende
  sleutel las als `undefined`, glipte erdoorheen, en de regel erna riep
  `.toLocaleString()` aan op niets — waarna de klant "a client-side exception has
  occurred" zag in plaats van zijn rapport. Alles wat uit zo'n kolom komt gaat nu
  eerst door `lib/rapport/heelScan.ts`. Een ontbrekende meting wordt `null`,
  nooit nul: nul leest als een slechte uitslag.
- **Een halfleeg vel zie je niet in de code.** Liet je de onderdelen op papier
  doorlopen, dan eindigde het ene halverwege een vel en begon het volgende
  eronder — en soms bleven er twee regels op een verder leeg blad achter. Elk
  onderdeel begint nu op een eigen vel (`break-before: page`), en de
  afdrukafstanden zijn zo afgesteld dat een onderdeel er ook op past. Bewijs met
  `npm run check:pdf` (server moet draaien): die telt per vel hoeveel pixels van
  wit afwijken en slaat alarm onder de 8%. Meten met `getBoundingClientRect`
  werkt hier níét — dat gaf 1115px waar het vel 1123px is, terwijl de PDF alsnog
  omsloeg.
- **Papier is geen telefoon.** Een A4 is ~794 CSS-px breed, dus een
  `@media (max-width: 900px)`-regel slaat in de afdrukweergave óók aan. De
  omslag stapelde daardoor, de laptop werd paginabreed en de rest schoof van het
  vel. Zet de kolommen in het `@media print`-blok expliciet terug.
- **`min-width: auto` van flexbox wint van `max-width`.** De lettertypekiezer in
  de mail-editor had `max-w-[10rem]` maar bleef zo breed als "Times New Roman",
  duwde het venster opzij, en het sluitkruis schoof uit beeld. Een `<select>` in
  een flexrij heeft `min-w-0` nodig.
- **Geen functies van server- naar client-component doorgeven**: een
  `'use client'`-component (bv. `AreaGrafiek`) mag géén functie-prop krijgen
  vanuit een server-component ("Functions cannot be passed directly to Client
  Components"). Geef een string-enum door (bv. `formaat="euro"`) en doe de
  formattering binnen de client-component.

## 9. Kwaliteitsborging

Na elke grote bouwronde: draai de **code-reviewer-subagent**
(`.claude/agents/code-reviewer.md`). Die beoordeelt de wijzigingen objectief op
huisstijl (navy/teal, geen zebra, KPI's bovenaan), RLS (elke tabel een policy) en
Nederlandse UI-teksten.

## 10. Brand Factory — dashboard-integratie

De Brand Factory draait lokaal op de Mac (aparte repo). Het dashboard is een
read-only weergave: data komt binnen via `POST /api/brand-factory/sync`
(auth: `BRAND_FACTORY_SECRET`), aangeroepen door een post-render hook in het
Brand Factory-project na elke render.

Database: `merken`, `merk_producten`, `ad_concepten`, `ad_renders` +
view `brand_factory_stats` (migratie 0039).

Env-variabelen toe te voegen aan `.env.local` en Vercel:
- `BRAND_FACTORY_SECRET` — gedeeld geheim voor de sync-API

## 11. Fonio — AI-telefonie (resellerprogramma)

Viesa wordt reseller van Fonio. Om tijdens een verkoopgesprek live te kunnen
demonstreren staat er een **democonsole op `/bellen`**. Alles is configuratie in
plaats van vastgezet in code, omdat nog niet vaststaat wat het partnerprogramma
technisch biedt.

Instellen: **Koppelingen → Fonio-demo** (demonummer, demo-link, partnerportaal,
en een schakelaar om de demo in te sluiten). De config staat als JSON in de
bestaande `integraties`-rij onder dienst `fonio` — geen nieuwe tabel nodig
(`dienst` heeft geen CHECK-constraint). De console blijft onzichtbaar zolang er
geen nummer of link is ingevuld: zie `app/(app)/bellen/fonio.ts`.

Drie varianten, oplopend in kracht — nu is **A** gebouwd:
- **A · Demoknop** — bellen naar het demonummer + link openen. Werkt altijd.
- **B · Ingesloten console** — de demo in een `<iframe>`. Alleen mogelijk als
  Fonio insluiten toestaat (veel SaaS blokkeert dat met `X-Frame-Options`);
  daarom staat dit achter een schakelaar en niet standaard aan.
- **C · Demo per prospect** — via de partner-API een demo-agent aanmaken die
  gevoed is met de website van de lead. Vereist API-toegang.

Env-variabele (alleen nodig voor variant C):
- `FONIO_API_KEY` — server-only, nooit met `NEXT_PUBLIC_`-prefix

## 12. AI Visibility Audit (SaaS-module)

Losstaande module die verkoopt: laat een prospect zien dat AI-modellen hem niet
noemen, en verkoop vervolgens de oplossing.

**Route `/audit`** — `POST /api/audit` bevraagt vier modellen **parallel** met
`Promise.allSettled`. Dat is de kern: valt Perplexity uit, dan toont de audit de
andere drie. Elk model krijgt letterlijk dezelfde opdracht; de antwoorden gaan
door `parseConcurrenten()` in `lib/audit.ts`, die markdown-hekjes, inleidende
praat en kale arrays opvangt. `doelGevonden()` vergelijkt op hostnaam, niet op
volledige URL, zodat `https://www.x.nl/diensten` matcht met `x.nl`.

**PDF** — `components/AuditPDFDocument.tsx` (`@react-pdf/renderer`), vier
pagina's. Wordt **lui geladen** in `AuditPdfKnop.tsx`: die bibliotheek is zwaar
en hoort niet in de hoofdbundel van een dashboard waar de meeste pagina's er
niets mee doen.

**GEO** — `actions/generate-geo-content.ts` schrijft het artikel met
`claude-opus-5`, streamt (anders loopt een lang artikel tegen de HTTP-timeout)
en slaat het op als concept in `geo_pages`. Publiceren is een aparte handeling.

**Datamodel** — migratie `0044`: `ai_audits`, `geo_pages` (beide per gebruiker
via `auth.uid()`), `ai_leads` (iedereen leest, alleen admins schrijven) plus
`app_admins` + `is_admin()`.

Env: `OPENAI_API_KEY`, `GEMINI_API_KEY`, `PERPLEXITY_API_KEY` (`ANTHROPIC_API_KEY`
bestond al). Model-ID's zijn te overschrijven via `OPENAI_MODEL`, `CLAUDE_MODEL`,
`GEMINI_MODEL`, `PERPLEXITY_MODEL` — zo hoef je bij een nieuwe modelversie niet
te deployen.

## 13. Outreach-agents (Claude Code)

Vijf subagents in `.claude/agents/` plus het commando `/outreach` in
`.claude/commands/`. Ze draaien in Claude Code, niet in het dashboard — het zijn
Markdown-definities, geen applicatiecode.

De keten: `lead-scout` (domeinen uit gratis, ToS-conforme bronnen) →
`prospect-dossier` (dossier van één A4, gescoord 0–30) → `belscript-schrijver`
en `mailscript-schrijver` → `outreach-regisseur` (stuurt de keten aan en levert
een werklijst).

Volledige ronde:

```
/outreach "groothandel woninginrichting" "West-Brabant" 40
```

Twee dingen die in de agents zelf zijn vastgelegd en niet per ongeluk mogen
verdwijnen:

- **Bronnen**: geen Indeed, geen LinkedIn, geen Maps-scraping. Niet uit
  voorzichtigheid maar omdat handhaving reëel is — en de careers-pagina van het
  bedrijf zelf geeft hetzelfde signaal.
- **Geen persoonsgegevens**: functietitels en afdelingsmailboxen, geen namen.
  Daarmee blijft gerechtvaardigd belang als AVG-grondslag overeind.

Geen agent verstuurt iets. De laatste meter is menselijk.

Het scoringsmodel is niet opnieuw bedacht: `prospect-dossier` gebruikt de drie
assen uit de bestaande skill `webshop-prospector` (ouderdom · administratieve
bezetting · Excel-waarschijnlijkheid), inclusief de tiergrenzen op 24/18/12.

## 14. Voorstel en promotiemail

Eén bron voor het aanbod: **`lib/aanbod.ts`** (zes diensten, drie pijlers, één
review, de kernbelofte en de auditbelofte). De teksten komen letterlijk van de
landingspagina, zodat een prospect die eerst de mail leest en daarna de site
opent hetzelfde verhaal ziet.

Twee documenten, dezelfde teksten, heel andere opmaak:

- **`lib/mail/promo-mail.ts`** — de promotiemail. Geneste tabellen, inline
  stijlen, font-stacks met veilige terugval, geen SVG, geen flexbox, geen grid.
  Niet uit netheid maar uit noodzaak: Gmail gooit `<style>`-blokken weg en
  Outlook op Windows rendert met de opmaakmotor van Word. De "graphics" zijn
  gekleurde tabelcellen, want mailprogramma's blokkeren externe afbeeldingen tot
  de lezer erop klikt — een mail die voor zijn opmaak op plaatjes leunt ziet er
  bij eerste opening kapot uit. Bewaakt door `scripts/test-promo-mail.mjs`.
- **`components/rapport/Voorstel.tsx`** — hetzelfde aanbod in de
  rapport-huisstijl, afdrukbaar als derde PDF naast de korte en lange scan.

Daarnaast is er een derde document: **`lib/mail/promo-tegels.ts`** — de
**tegelmail** (Mail → Promomail). Geen rapportblok, maar de zes diensten als de
dienstentegels van de landingspagina, elk met een klein vignet: golfvorm,
chatbubbels, koppelnodes, afvinklijst, ladende site, KPI-meters. Drie regels
die hier gelden:

- **De scène moet stilstaand kloppen.** Alle beweging zit in klassen in het
  `<style>`-blok: Apple Mail en iOS spelen die af, Gmail en Outlook gooien ze
  weg en tonen het stilstaande tafereel. Nooit een vignet bouwen dat pas klopt
  als het beweegt, en nooit inline `animation` (dan bewaakt de test het niet).
- **Het accent is hier `#E2603F`** — dat van de landingspagina, niet het
  dashboard-teal. Deze mail moet aanvoelen als de site waar de prospect op
  doorklikt; het dashboard is voor ons.
- **Bewerkbaar is alleen tekst** (onderwerp, aanhef, intro, afsluiting, en
  welke tegels meegaan — `standaardPromoVelden()` vult het venster). Het
  ontwerp ligt vast; voorbeeld en verzending lopen allebei door
  `lib/mail/tegel-opzet.ts`. Bewaakt door `scripts/test-promo-tegels.mjs`.

Versturen gaat via **Mail → Voorstel versturen**. Dat is een eigen server-action
(`verstuurVoorstel`), níét de gewone `verstuurBericht`: die wikkelt de inhoud in
`mailHtmlRijk()` — briefhoofd, titel, voettekst — en dat is precies verkeerd
voor een mail die zelf al een compleet ontwerp is. Het voorbeeldvenster en de
verstuurde mail lopen allebei door `lib/mail/voorstel-opzet.ts`, zodat het
voorbeeld geen gok is.

Env (alle optioneel):
- `NEXT_PUBLIC_WHATSAPP` — nummer zonder plus of spaties; leeg = de terugval in
  `lib/rapport/contact.ts`
- `NEXT_PUBLIC_AFSPRAAK_URL` — Cal.com-link; leeg = de knop wordt een mailtje
Het logo in de mail heeft **geen** variabele: het bestand staat in `public/` en
het adres komt van Vercel zelf (`VERCEL_PROJECT_PRODUCTION_URL`). Dat was wél
instelbaar, en dat heeft twee keer een gebroken plaatje in het briefhoofd van
een prospect opgeleverd. Het staat **kaal op het navy**, zoals in de kop van de
landingspagina: `viesa-hex.png` is doorzichtig, de zeshoek zakt weg in het navy
en de witte V blijft staan — dat ís het merk. Er heeft ooit een zandkleurig
tegeltje omheen gezeten uit angst dat de zeshoek zou wegvallen; dat maakte er
een losse sticker van die op de site nergens voorkomt. Nooit meer een vlakje om
het logo, in geen enkele mailing.

## 15. Beweging

`components/rapport/beweging.css` brengt de bewegingstaal van de landingspagina
naar de klantdocumenten: dezelfde easing (`cubic-bezier(.2,.8,.2,1)` voor
binnenkomen), dezelfde 6px-fade, dezelfde getekende ring. Drie regels:

- **Zonder JavaScript.** De reveals lopen op `animation-timeline: view()` achter
  een `@supports`. Kent de browser dat niet, dan staat alles er gewoon.
- **Niets beweegt op papier.** Een animatie die halverwege bevriest tijdens het
  afdrukken geeft een half doorzichtige PDF.
- **`prefers-reduced-motion` is opt-in**, niet opt-out: alles zit ín een
  `no-preference`-blok, zodat een vergeten regel nooit tóch beweegt.

**E-mail kan dit niet.** Gmail gooit `<style>`-blokken weg en Outlook rendert met
de opmaakmotor van Word: geen keyframes, geen transitions, geen SVG. Het enige
wat daar beweegt is een GIF, en die van ons kan niet: `public/viesa-logo-animatie.gif`
heeft een **harde witte doos** om de zeshoek. Op een witte mailachtergrond zie
je dat niet, maar in een donkere weergave — op een telefoon eerder regel dan
uitzondering — zit er een wit blokje om het logo. Daarom staat overal het
doorzichtige `viesa-logo.png` / `viesa-hex.png`, en beweegt het briefhoofd
alleen via CSS (Apple Mail). Wil je hier ooit weer een GIF, maak hem dan eerst
doorzichtig.
