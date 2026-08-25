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
- `/brand-factory` — **Brand Factory dashboard**: overzicht van merken,
  concepten, renders en batches. Data komt binnen via `POST /api/brand-factory/sync`
  vanuit het lokale Brand Factory-project op de Mac (na elke batch-render).

API-routes: `POST /api/prospector` (prospector-ingest), `GET /api/cron/facturen`
(dagelijkse vervallen-bewaking), `POST /api/genereer-offerte` (Claude),
`GET /api/google/oauth/{start,callback}` (Gmail), `GET /api/brand-factory`
(merken-stats), `POST /api/brand-factory/sync` (batch-sync vanuit lokale Mac,
auth via `BRAND_FACTORY_SECRET`). Cron-config: `vercel.json`.

## 7. Datamodel & beveiliging

- Het canonieke datamodel staat in `supabase/migrations/0004_canoniek_datamodel.sql`
  (tabellen: leads, activiteiten, offertes, facturen, projecten, notities,
  design_docs, whiteboards, stickies, drive_links, prospector_runs, integraties;
  + view `omzet_per_maand`). Voorbeelddata: `supabase/seed.sql`.
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
