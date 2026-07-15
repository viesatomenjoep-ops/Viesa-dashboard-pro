# Deploy & setup — Viesa Command Center

Alles wat nodig is om live te gaan, op één plek. Volg de blokken op volgorde.

## 1. Supabase — migraties (SQL Editor, op volgorde)

Draai deze bestanden uit `supabase/migrations/` één voor één:

| # | Bestand | Doel |
|---|---|---|
| 0001 | `0001_init.sql` | *(vervangen door 0004 — overslaan bij nieuw project)* |
| 0002 | `0002_rls_performance.sql` | *(idem — overslaan)* |
| 0003 | `0003_gedeelde_toegang.sql` | *(idem — overslaan)* |
| **0004** | `0004_canoniek_datamodel.sql` | **canoniek datamodel + RLS + view omzet_per_maand** |
| 0005 | `0005_offerte_factuur_extra.sql` | concept-factuur + offerte↔factuur-koppeling |
| 0006 | `0006_icloud_linktype.sql` | iCloud als link-type |
| 0007 | `0007_ms_tokens.sql` | Outlook-tokens (versleuteld, per gebruiker) |
| 0008 | `0008_klanten.sql` | klantenbestand + klant_id op leads/offertes/facturen |
| 0009 | `0009_audits.sql` | auditverslagen |
| 0010 | `0010_bestand_categorieen.sql` | categorieën voor Bestanden |
| 0011 | `0011_klant_logo.sql` | klantlogo (op offerte-PDF) |
| 0012 | `0012_klant_bestanden.sql` | bestanden per klant (context 'klant') |
| 0013 | `0013_emails.sql` | e-maillog (Resend) |

> Nieuw project? Begin bij **0004** en draai t/m 0013. `supabase/seed.sql`
> (alleen design-templates, geen voorbeelddata) is optioneel.

## 2. Supabase — Auth

- **Providers → Email**: aan. **Allow new users to sign up**: **UIT** (geen publieke signup).
- **Providers → Google**: aan, met Client ID + secret (voor "Log in met Google").
- **Users → Add user**: maak elke gebruiker aan (e-mail + **Auto Confirm**).
- **URL Configuration** → Site URL = `https://viesa-dashboard-pro.vercel.app`;
  Redirect URLs: `https://viesa-dashboard-pro.vercel.app/auth/callback` en `.../**`.

## 3. Vercel — Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://vtdmehhidnnvyjwwfdoa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
OWNER_USER_ID=<jouw auth-uuid>
LEADS_INGEST_SECRET=<lang geheim>
CRON_SECRET=<lang geheim>
NEXT_PUBLIC_SITE_URL=https://viesa-dashboard-pro.vercel.app

# Design-editor (optioneel)
GITHUB_TOKEN=<pat contents:write>   GITHUB_REPO=viesatomenjoep-ops/Viesa-dashboard-pro   GITHUB_BRANCH=main
# Offerte-generator
ANTHROPIC_API_KEY=<claude-key>
# Gmail (optioneel)
GOOGLE_CLIENT_ID=<...>   GOOGLE_CLIENT_SECRET=<...>   GOOGLE_REDIRECT_URI=https://viesa-dashboard-pro.vercel.app/api/google/oauth/callback
# Outlook (optioneel)
MS_CLIENT_ID=<...>   MS_TENANT_ID=<... of common>   MS_CLIENT_SECRET=<...>
MS_REDIRECT_URI=https://viesa-dashboard-pro.vercel.app/api/auth/microsoft/callback
MS_TOKEN_ENC_KEY=<32-byte base64/hex>
# Resend (e-mail) — verifieer domein viesa-automations.nl in Resend
RESEND_API_KEY=<resend-api-key>
RESEND_INBOUND_SECRET=<lang geheim, voor /api/resend/inbound>
```

Na wijzigingen: **Redeploy**.

## 4. Koppelingen

- **Google-login**: provider aan in Supabase + redirect `https://vtdmehhidnnvyjwwfdoa.supabase.co/auth/v1/callback` in de Google OAuth-client.
- **Gmail**: Google OAuth-client, redirect `.../api/google/oauth/callback` → Koppelingen → Verbind met Google.
- **Outlook**: Entra app-registratie, redirect `.../api/auth/microsoft/callback`, delegated scopes `Mail.Send`/`Mail.ReadWrite`/`User.Read`/`offline_access` → Koppelingen → Outlook verbinden.
- **Prospector-cron** (optioneel): voeg `.github/workflows/prospector.yml` toe (zie `docs/prospector-workflow.md`) + Actions-secrets `APP_BASE_URL`, `LEADS_INGEST_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.

## 5. Snelle eindtest

1. Inloggen (e-mail of Google).
2. **Klanten** → klant toevoegen → vanuit klant "Nieuwe offerte/factuur/audit".
3. Offerte/factuur/audit → **Exporteer als PDF** (huisstijl, logo + NAW).
4. **Leads** → lijst uit Excel importeren.
5. **Bestanden** → link met categorie toevoegen.

## 6. Regio (snelheid)

Zet de **Vercel Function Region** gelijk aan de **Supabase-regio** (Supabase → Project Settings → General). Scheelt latency.
