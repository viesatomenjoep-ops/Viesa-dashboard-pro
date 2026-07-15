-- ============================================================================
-- Viesa Command Center — migratie 0028: e-mailbijlagen (mailmodule fase 2).
-- ----------------------------------------------------------------------------
-- Bijlagen van ontvangen (en later verzonden) e-mails. De bestanden zelf staan
-- in de private Storage-bucket 'email-bijlagen'; hier alleen de metadata + pad.
-- RLS: nieuwe tabel krijgt direct de policy geauth_toegang (CLAUDE.md §7).
-- Idempotent.
-- ============================================================================

create table if not exists public.email_bijlagen (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid default auth.uid(),
  email_id     uuid not null references public.emails (id) on delete cascade,
  bestandsnaam text not null,
  mime         text,
  grootte      integer,
  storage_pad  text not null,          -- pad in de bucket 'email-bijlagen'
  content_id   text,                   -- voor inline-afbeeldingen (cid:)
  created_at   timestamptz not null default now()
);
create index if not exists email_bijlagen_email_idx on public.email_bijlagen (email_id);

alter table public.email_bijlagen enable row level security;
drop policy if exists geauth_toegang on public.email_bijlagen;
create policy geauth_toegang on public.email_bijlagen
  for all to authenticated
  using (true)
  with check (true);

-- --- Storage-bucket voor de bestanden (privé) -------------------------------
-- Kan ook via Supabase → Storage → New bucket ('email-bijlagen', private).
insert into storage.buckets (id, name, public)
values ('email-bijlagen', 'email-bijlagen', false)
on conflict (id) do nothing;

-- Geauthenticeerde gebruikers mogen lezen; schrijven gebeurt server-side met de
-- service-role (die RLS omzeilt), dus daar is geen insert-policy voor nodig.
drop policy if exists email_bijlagen_lezen on storage.objects;
create policy email_bijlagen_lezen on storage.objects
  for select to authenticated
  using (bucket_id = 'email-bijlagen');
