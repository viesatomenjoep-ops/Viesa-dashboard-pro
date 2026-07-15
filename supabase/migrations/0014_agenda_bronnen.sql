-- ============================================================================
-- Viesa Command Center — migratie 0014: agenda-bronnen (iCal)
-- ----------------------------------------------------------------------------
-- Geheime/openbare iCal (.ics) links (bv. van Google Calendar) waaruit de
-- Agenda-pagina afspraken leest. Geen OAuth nodig. RLS: gedeelde werkruimte.
-- Idempotent.
-- ============================================================================

create table if not exists public.agenda_bronnen (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid default auth.uid(),
  naam       text not null default 'Agenda',
  ical_url   text not null,
  created_at timestamptz not null default now()
);

alter table public.agenda_bronnen enable row level security;
drop policy if exists geauth_toegang on public.agenda_bronnen;
create policy geauth_toegang on public.agenda_bronnen
  for all to authenticated
  using (true)
  with check (true);
