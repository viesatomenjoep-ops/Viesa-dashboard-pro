# Security-review — Viesa Command Center

Laatste review: juli 2026. Bevindingen en fixes.

## 1. Row Level Security (RLS)

- **RLS staat aan op elke tabel** (`0004_canoniek_datamodel.sql`): leads,
  activiteiten, offertes, facturen, projecten, notities, design_docs,
  whiteboards, stickies, drive_links, prospector_runs, integraties.
- Elke tabel heeft één policy: `for all to authenticated using (true) with check (true)`.
  De rol `anon` heeft **geen** policy → een anonieme client ziet 0 rijen en mag
  niets schrijven.
- **Bewijs**: `node scripts/test-rls.mjs` (gebruikt alleen de anon-sleutel).
  Verwacht: elke tabel "lezen=0 rijen, schrijven=geweigerd".
- **Regel**: elke nieuwe tabel krijgt direct RLS + policy (zie CLAUDE.md).

## 2. Secrets

- Alleen `NEXT_PUBLIC_*` mag de browser bereiken (Supabase-URL + anon-key —
  publiek bedoeld). Alle overige keys zijn server-only.
- Geen secrets in de repo: `.env.local` staat in `.gitignore`; `.env.example`
  bevat alleen placeholders.
- Server-only geheimen: `SUPABASE_SERVICE_ROLE_KEY`, `LEADS_INGEST_SECRET`,
  `CRON_SECRET`, `ANTHROPIC_API_KEY`, `GITHUB_TOKEN`, `GOOGLE_CLIENT_SECRET`.
  Deze worden uitsluitend in server components / route handlers gelezen.

## 3. OAuth-tokens

- De Google/Gmail `refresh_token` staat **server-side** in `integraties.config`
  en wordt nooit naar de client gestuurd. Access tokens worden per request
  vers opgehaald uit de refresh token (`lib/google.ts`).

## 4. API-routes

- `/api/prospector` en `/api/cron/facturen` authenticeren met een gedeeld geheim
  (header / `Authorization: Bearer`), niet met een sessie.
- `/api/genereer-offerte` en de Google-OAuth-routes vereisen een ingelogde
  gebruiker (`getUser()`), en de middleware laat `/api` de eigen auth doen.

## 5. Supabase advisories (nog te draaien)

Draai in het Supabase-dashboard **Advisors → Security** en **Performance** en
werk bevindingen hier bij. Aandachtspunten die we al afdekken:

- **RLS enabled**: ✅ op alle publieke tabellen.
- **Function search_path**: `set_updated_at` is `security definer`-vrij en simpel;
  geen dynamische SQL met gebruikersinput.
- **Views**: `omzet_per_maand` gebruikt `security_invoker = on`, dus de view
  respecteert de RLS van de aanroeper (geen data-lek via de view).

> Kom je een advisory tegen die onduidelijk is? Noteer 'm hier en vraag om uitleg
> in gewone taal voordat je 'm "oplost".
