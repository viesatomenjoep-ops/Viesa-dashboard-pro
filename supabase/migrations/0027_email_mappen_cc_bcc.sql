-- ============================================================================
-- Viesa Command Center — migratie 0027: mailmodule fase 1 (CC/BCC, mappen,
-- gelezen/ongelezen, ster) + fundament voor threading & bijlagen (fase 2/3).
-- ----------------------------------------------------------------------------
-- Breidt de bestaande emails-tabel (0013) uit. Geen nieuwe tabel → RLS/policy
-- op emails blijft ongewijzigd. Idempotent.
-- ============================================================================

alter table public.emails
  add column if not exists cc             text,
  add column if not exists bcc            text,
  add column if not exists van_naam       text,        -- weergavenaam afzender
  add column if not exists message_id     text,        -- RFC Message-ID (uniek)
  add column if not exists in_reply_to    text,        -- threading (fase 3)
  add column if not exists referenties    text,        -- References-header
  add column if not exists thread_id      uuid,        -- conversatie-groep
  add column if not exists map            text not null default 'inbox'
        check (map in ('inbox','verzonden','concepten','prullenbak','archief')),
  add column if not exists gelezen        boolean not null default false,
  add column if not exists ster           boolean not null default false,
  add column if not exists heeft_bijlagen boolean not null default false,
  add column if not exists snippet        text,        -- voorbeeldtekst voor de lijst
  add column if not exists lead_id        uuid references public.leads (id) on delete set null;

-- Bestaande rijen in de juiste map zetten: uitgaand → verzonden, rest → inbox.
-- (De default 'inbox' hierboven zette alle bestaande rijen al op 'inbox'.)
update public.emails set map = 'verzonden' where richting = 'uitgaand' and map = 'inbox';

-- Verzonden mail is per definitie 'gelezen'; ontvangen mail begint ongelezen.
update public.emails set gelezen = true where richting = 'uitgaand';

-- Snippet vullen voor bestaande rijen (eerste ~140 tekens platte tekst).
update public.emails
  set snippet = left(regexp_replace(coalesce(tekst, ''), '\s+', ' ', 'g'), 140)
  where snippet is null;

create unique index if not exists emails_message_id_idx
  on public.emails (message_id) where message_id is not null;
create index if not exists emails_thread_idx on public.emails (thread_id);
create index if not exists emails_map_idx on public.emails (map, created_at desc);
create index if not exists emails_gelezen_idx on public.emails (gelezen) where gelezen = false;
