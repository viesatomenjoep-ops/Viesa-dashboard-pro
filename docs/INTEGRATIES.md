# Integraties & secrets

Overzicht van de koppelingen en waar de secrets staan. **Geheimen nooit in de
repo of in client-code** — alles in env (Vercel) of server-side in de database.

## Waar staat welke secret?

| Secret | Waar | Gebruikt door |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `..._ANON_KEY` | Vercel env (public) | client + server |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env (server-only) | ingest, cron |
| `LEADS_INGEST_SECRET` | Vercel env + GitHub Actions secret | `/api/prospector`, prospector-cron |
| `CRON_SECRET` | Vercel env | `/api/cron/facturen` |
| `ANTHROPIC_API_KEY` | Vercel env (server-only) | `/api/genereer-offerte` |
| `GITHUB_TOKEN` (contents:write) | Vercel env (server-only) | design-editor sync |
| `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI` | Vercel env (server-only) | Gmail-OAuth |
| Google `refresh_token` | DB `integraties.config` (dienst `gmail`) | Gmail versturen |

## Gmail (G3)

1. Google Cloud Console → OAuth-client (type: Web) aanmaken.
2. Redirect-URI: `https://<domein>/api/google/oauth/callback`.
3. Scopes: `gmail.send`, `gmail.readonly`, `documents.readonly`.
4. Zet `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI` in Vercel.
5. In de app → **Koppelingen → Verbind met Google**. De `refresh_token` wordt
   server-side in `integraties.config` bewaard.

> Slack (G1), Google Drive/Sheets (G2) en Outlook (G4) zijn bewust overgeslagen.

## Prospector-cron (G5)

GitHub Action `.github/workflows/prospector.yml` draait maandag 07:00 UTC:
1. draait je prospector (plaats je script op `prospector/run.mjs`, output = JSON),
2. POST naar `/api/prospector` met header `x-viesa-ingest-secret`,
3. pingt Supabase zodat het gratis project niet pauzeert.

Benodigde **GitHub Actions secrets**: `APP_BASE_URL`, `LEADS_INGEST_SECRET`,
`SUPABASE_URL`, `SUPABASE_ANON_KEY`.
