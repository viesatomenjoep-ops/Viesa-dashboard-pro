# Conceptplan — Outlook-achtige mailmodule (Resend)

_Viesa Command Center · versturen én ontvangen via Resend, met een mailervaring
die zo dicht mogelijk bij Outlook ligt._

## 0. Uitgangspunten (bevestigde keuzes)

| Keuze | Besluit |
|-------|---------|
| Ontvangen | Subdomein **`inbox.viesa-automations.nl`** met MX naar Resend; hoofddomein-postbus blijft ongemoeid |
| Bijlagen | **Echte bijlagen** — upload/download via **Supabase Storage** |
| Kopie bij versturen | Geen automatische kopie; **CC/BCC-velden** zoals Outlook |
| DNS-beheer | **Strato** — MX/SPF/DKIM voor het inbox-subdomein worden daar gezet (records levert Resend) |
| Ontvangen (inbound) | **Gewenst** — mails ontvangen die Resend inbound binnenhaalt (kan nu nog niet in het dashboard) |
| Gmail-koppeling | **Alleen voor de agenda**, niet voor mail — live Gmail-inbox is van de mailpagina verwijderd |
| Huisstijl | Navy `#19445B` / teal-accent (token `oranje`), geen zebra, KPI's bovenaan, NL-teksten |
| Basis | Bouwt voort op bestaande `emails`-tabel (0013), `lib/resend.ts`, `app/api/resend/inbound` |

## 1. Doel & scope

Een volwaardig mailcentrum in het dashboard dat aanvoelt als Outlook:
3-paneel-layout, rich-text editor, conversatie-threads, mappen, CC/BCC,
reply / allen beantwoorden / doorsturen, bijlagen, gelezen/ongelezen, ster/vlag,
zoeken en filteren — met versturen én ontvangen via Resend.

**Buiten scope (voorlopig):** agenda/contacten-sync, gedeelde postvakken per
gebruiker (werkruimte blijft gedeeld), regels/automatische filters, S/MIME.

## 2. Architectuur

```
 Versturen                                   Ontvangen
 ─────────                                    ─────────
 Dashboard (compose, Tiptap)                  Afzender wereldwijd
   │  server action                             │  SMTP → MX
   ▼                                             ▼
 lib/resend.verstuurMail()  ──►  Resend API   Resend inbound (inbox-subdomein)
   │                                             │  webhook (svix-signed)
   ▼                                             ▼
 emails-tabel (uitgaand)                       /api/resend/inbound
   ▲                                             │  parse + sanitize + storage
   │        Supabase (Postgres + RLS + Realtime + Storage)
   └─────────────────────────────────────────────┘
                  Dashboard leest live mee (Realtime)
```

- **Versturen:** server action → `verstuurMail()` (Resend) → log-rij in `emails`.
- **Ontvangen:** MX van `inbox.viesa-automations.nl` → Resend inbound → webhook
  naar `/api/resend/inbound` → parsen, HTML saniteren, bijlagen naar Storage,
  rij(en) in `emails` (+ `email_bijlagen`).
- **Statusfeedback:** Resend event-webhooks (delivered/bounced/opened) updaten de
  status van de uitgaande rij.
- **Live:** Supabase Realtime op `emails` → inbox ververst zonder reload.

## 3. Datamodel (nieuwe migraties)

### 3a. `emails` uitbreiden
```sql
alter table public.emails
  add column if not exists cc            text,
  add column if not exists bcc           text,
  add column if not exists van_naam      text,        -- weergavenaam afzender
  add column if not exists message_id    text,        -- RFC Message-ID (uniek)
  add column if not exists in_reply_to   text,        -- threading
  add column if not exists referenties   text,        -- References-header
  add column if not exists thread_id     uuid,        -- conversatie-groep
  add column if not exists map           text not null default 'inbox'
        check (map in ('inbox','verzonden','concepten','prullenbak','archief')),
  add column if not exists gelezen       boolean not null default false,
  add column if not exists ster          boolean not null default false,
  add column if not exists heeft_bijlagen boolean not null default false,
  add column if not exists snippet       text,        -- voorbeeldtekst voor de lijst
  add column if not exists lead_id       uuid references public.leads (id) on delete set null;
create unique index if not exists emails_message_id_idx on public.emails (message_id) where message_id is not null;
create index if not exists emails_thread_idx on public.emails (thread_id);
create index if not exists emails_map_idx on public.emails (map, created_at desc);
```
> Uitgaande mail krijgt `map='verzonden'`, inkomend `map='inbox'`, concepten
> `map='concepten'`. Verwijderen = verplaatsen naar `prullenbak` (soft delete),
> definitief pas vanuit de prullenbak.

### 3b. `email_bijlagen` (nieuw)
```sql
create table if not exists public.email_bijlagen (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid default auth.uid(),
  email_id     uuid not null references public.emails (id) on delete cascade,
  bestandsnaam text not null,
  mime         text,
  grootte      integer,
  storage_pad  text not null,          -- pad in de Storage-bucket
  content_id   text,                   -- voor inline-afbeeldingen (cid:)
  created_at   timestamptz not null default now()
);
create index if not exists email_bijlagen_email_idx on public.email_bijlagen (email_id);
-- RLS: geauth_toegang (for all to authenticated) — conform CLAUDE.md §7
```

### 3c. Threading
`thread_id` bepalen bij ontvangst/verzending:
1. Heeft de mail een `In-Reply-To`/`References` die matcht met een bestaande
   `message_id`? → neem diens `thread_id` over.
2. Anders → nieuw `thread_id` (= eigen id).
Conversatieweergave groepeert op `thread_id`, nieuwste onder.

### 3d. Storage
Bucket **`email-bijlagen`** (private). Toegang via **signed URLs** vanaf de
server; nooit publiek. Padconventie: `{email_id}/{bestandsnaam}`.

Elke nieuwe tabel krijgt direct RLS + `geauth_toegang`-policy en wordt bewezen
met `scripts/test-rls.mjs` (CLAUDE.md §7).

## 4. Ontvangen via Resend (inbound)

1. **DNS** — voor `inbox.viesa-automations.nl`: MX → Resend inbound, plus
   SPF/DKIM/DMARC-records die Resend aanlevert. Hoofddomein blijft los werken.
2. **Resend inbound-route** — in het Resend-dashboard een inbound-adres/route
   aanmaken die naar `https://<app>/api/resend/inbound` post.
3. **Webhook-beveiliging upgraden** — nu alleen een query-`secret`; overstappen
   op **Svix-signatureverificatie** (Resend ondertekent webhooks). Fail-closed
   blijft.
4. **Parsen** — `from`, `to`, `cc`, `subject`, `html`, `text`, en headers
   (`Message-ID`, `In-Reply-To`, `References`) → thread bepalen.
5. **HTML saniteren** — inkomende HTML door `sanitize-html`/DOMPurify; renderen
   in een **gesandboxte iframe** (geen scripts, externe afbeeldingen pas na
   "afbeeldingen tonen").
6. **Bijlagen** — Resend levert inbound attachments; server uploadt ze naar
   Storage en maakt `email_bijlagen`-rijen; `heeft_bijlagen=true`.
7. **Idempotentie** — unieke index op `message_id` voorkomt dubbele rijen bij
   herbezorging van de webhook.
8. **CRM-koppeling** — afzender-email matchen op `klanten.email` / `leads.email`
   → automatisch `klant_id`/`lead_id` zetten (verschijnt dan in de tijdlijn).

## 5. Versturen via Resend

- `verstuurMail()` uitbreiden met `cc`, `bcc`, `reply_to`, thread-headers
  (`In-Reply-To`/`References`) en `attachments` (base64 uit Storage).
- **Rich editor → HTML**: Tiptap levert nette HTML; automatisch een
  tekst-fallback genereren. Huisstijl-handtekening (bestaat al) onderaan.
- **Reply / Allen beantwoorden / Doorsturen**: prefill met quote van origineel,
  onderwerp `Re:`/`Fwd:`, juiste thread-headers; bij "allen beantwoorden" gaan
  de oorspronkelijke CC's mee.
- **Concepten**: opslaan als `map='concepten'`, later openen en verzenden.
- **Statusflow**: Resend event-webhook (`delivered`, `bounced`, `complained`,
  `opened`) → status op de uitgaande rij bijwerken (badge in de UI).

## 6. Outlook-UI

**3-paneel-layout** (desktop):

- **Links — mappen** met ongelezen-tellers: Postvak IN, Verzonden, Concepten,
  Prullenbak, Archief. Onder de mappen: snelle filters (Ongelezen, Met bijlage,
  Met ster) en "Per klant".
- **Midden — berichtenlijst** (compact): afzender/ontvanger, onderwerp, snippet,
  datum, ster, bijlage-clip, dikgedrukt bij ongelezen. Conversaties samengevouwd.
- **Rechts — leesvenster**: kop met onderwerp + van/aan/cc + datum, gesandboxte
  HTML-body, bijlagenstrip met download, en een actiebalk.

**Toolbar (ribbon-light):** Nieuw · Beantwoorden · Allen beantwoorden ·
Doorsturen · Archiveren · Verwijderen · Markeren gelezen/ongelezen · Ster.

**Opstellen (compose):** modal/paneel met To/Cc/Bcc als **chips met
autocomplete** uit klanten + leads, onderwerp, **Tiptap rich-text editor**
(vet/cursief/onderstreept, lijsten, links, kleur, handtekening), en
Verzenden/Concept opslaan.

**Bijlagen kiezen — vanaf elk apparaat.** Een gewone `<input type="file" multiple>`
opent de **systeem-bestandskiezer**, die per apparaat het juiste geeft:
- **iPhone/iPad:** de **Bestanden**-app (iCloud Drive, Downloads), plus Foto's en
  Camera.
- **Laptop/desktop:** Finder (macOS) of Verkenner (Windows).
- Aanvullend **slepen-en-neerzetten** in het opstelscherm op desktop.
Ontvangen bijlagen zijn andersom overal te **openen/downloaden** (leesvenster →
download via signed URL), of door te sturen. Geen aparte app nodig.

**Overig Outlook-gedrag:** zoeken (onderwerp/afzender/inhoud), gelezen/ongelezen,
ster/vlag, mappen wisselen, soft-delete naar prullenbak. **Responsive:** op
mobiel twee stappen (lijst → bericht), leesvenster als volledige pagina.

**KPI's bovenaan** (blijft): Ongelezen · Verzonden (vandaag) · Concepten.

## 7. Koppeling met de rest van het dashboard

- Inkomende én uitgaande mail automatisch aan klant/lead koppelen (via e-mail-
  match) → verschijnt in de bestaande **klant-tijdlijn**.
- Bestaande knop **"Mail deze klant"** opent compose met context vooringevuld.
- Optioneel: bij verzenden een activiteit loggen op de lead (type `email`).

## 8. Beveiliging & AVG

- Webhook met **Svix-signature** i.p.v. gedeeld query-geheim.
- HTML altijd **saniteren + sandboxen**; externe afbeeldingen standaard blokkeren.
- Storage privé, alleen **signed URLs**; grootte-/type-limiet op uploads.
- RLS op **alle** nieuwe tabellen; service-role alleen server-side in de webhook.
- Secrets nooit met `NEXT_PUBLIC_`-prefix. Bewaartermijn/opschoning van
  mailinhoud afspreken (AVG).

## 9. Techniekkeuzes

| Onderdeel | Keuze | Alternatief |
|-----------|-------|-------------|
| Rich editor | **Tiptap** (ProseMirror, React, licht) | react-quill |
| HTML-render | `sanitize-html` + gesandboxte iframe | DOMPurify + shadow DOM |
| Realtime inbox | **Supabase Realtime** op `emails` | polling |
| Bijlagen | **Supabase Storage** (private + signed URLs) | — |
| Webhook-auth | **Svix** (Resend-ondertekening) | gedeeld geheim (huidig) |

## 10. Fasering (roadmap)

- **Fase 1 — Fundament & versturen++**: migratie 3a, CC/BCC in `verstuurMail` +
  compose, HTML-weergave van bestaande mails (sanitized), mappen +
  gelezen/ongelezen + soft-delete. _Direct zichtbare winst, geen DNS nodig._
- **Fase 2 — Ontvangen via Resend**: DNS-subdomein, inbound-webhook uitbreiden +
  Svix, threading, sanitisatie, koppeling klant/lead, Realtime-inbox.
- **Fase 3 — Rich editor & antwoorden**: Tiptap, reply/allen/doorsturen met
  quote + thread-headers, handtekening, concepten.
- **Fase 4 — Bijlagen**: migratie 3b + Storage-bucket, upload/download vanaf elk
  apparaat (Bestanden-app op iPhone/iPad, Finder/Verkenner op laptop, camera/foto's),
  inline afbeeldingen, bijlage-clip in de lijst.
- **Fase 5 — Outlook-finish**: 3-paneel-layout, ribbon-toolbar, zoeken/filters,
  ster/vlag, conversatieweergave, statuswebhooks, mobiele flow.

## 11. Beslissingen — status

- ✅ **DNS**: beheer ligt bij **Strato**. Actie: MX/SPF/DKIM voor
  `inbox.viesa-automations.nl` toevoegen (records uit de Resend-domeinpagina).
- ✅ **Gmail**: alleen voor de agenda; de mailmodule draait volledig op Resend.
  Live Gmail-inbox is van de mailpagina gehaald.
- ⬜ **Resend inbound** is een aparte feature: vóór Fase 2 in het Resend-dashboard
  controleren/aanzetten dat het plan **inbound + attachments** ondersteunt
  (volumelimieten/kosten meenemen).
- ⬜ **Bewaartermijn** en opschoning van mailinhoud + bijlagen (AVG) afspreken.
- ⬜ **Kosten**: Storage-volume voor bijlagen en Resend-verzendvolume.

## 12. Env & configuratie (aanvullen in `.env.example`)

- `RESEND_API_KEY` — bestaat (versturen).
- `RESEND_INBOUND_SIGNING_SECRET` — nieuw, Svix-verificatie van inbound-webhook.
- `EMAIL_INBOUND_DOMAIN=inbox.viesa-automations.nl` — nieuw, herkenning eigen adres.
- Supabase Storage-bucket `email-bijlagen` (private) aanmaken.
- Env-wijzigingen in Vercel vereisen een **redeploy** (CLAUDE.md §8).
```
```
```
_Dit is een conceptplan — nog geen code gewijzigd. Volgorde en scope per fase in
overleg bij te stellen._
