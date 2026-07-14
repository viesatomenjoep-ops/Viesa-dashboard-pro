# CLAUDE.md — Viesa Dashboard Pro

## 1. Doel

Intern **administratie- en salesdashboard** voor **Viesa Automations**.
**Single-user**: er is één gebruiker (de eigenaar), geen team- of rollenbeheer.

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
