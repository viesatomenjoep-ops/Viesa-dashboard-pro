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
- `/koppelingen` — status van diensten (o.a. Gmail-OAuth)
- `/zoeken` — globale zoekbalk over leads/projecten/notities/offertes
- `/design` — markdown-editor voor design_docs met GitHub-sync
  (**bewust niet in de navigatie**; alleen via directe URL)

API-routes: `POST /api/prospector` (prospector-ingest), `GET /api/cron/facturen`
(dagelijkse vervallen-bewaking), `POST /api/genereer-offerte` (Claude),
`GET /api/google/oauth/{start,callback}` (Gmail). Cron-config: `vercel.json`.

## 7. Datamodel & beveiliging

- Het canonieke datamodel staat in `supabase/migrations/0004_canoniek_datamodel.sql`
  (tabellen: leads, activiteiten, offertes, facturen, projecten, notities,
  design_docs, whiteboards, stickies, drive_links, prospector_runs, integraties;
  + view `omzet_per_maand`). Voorbeelddata: `supabase/seed.sql`.
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

## 9. Kwaliteitsborging

Na elke grote bouwronde: draai de **code-reviewer-subagent**
(`.claude/agents/code-reviewer.md`). Die beoordeelt de wijzigingen objectief op
huisstijl (navy/teal, geen zebra, KPI's bovenaan), RLS (elke tabel een policy) en
Nederlandse UI-teksten.
