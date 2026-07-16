-- ============================================================================
-- Viesa Dashboard — migratie 0031: interne chat
-- ----------------------------------------------------------------------------
-- Eén gedeeld teamgesprek tussen de leden van de werkruimte (Tom & Joep). Geen
-- aparte gesprekstabel nodig — alle berichten horen bij dezelfde thread.
-- RLS: gedeelde werkruimte. Idempotent.
-- ============================================================================

create table if not exists public.chat_berichten (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid default auth.uid(),
  afzender   text not null default 'algemeen'
             check (afzender in ('tom','joep','algemeen')),
  tekst      text not null,
  created_at timestamptz not null default now()
);
create index if not exists chat_berichten_created_idx on public.chat_berichten (created_at);

alter table public.chat_berichten enable row level security;
drop policy if exists geauth_toegang on public.chat_berichten;
create policy geauth_toegang on public.chat_berichten
  for all to authenticated
  using (true)
  with check (true);
