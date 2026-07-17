-- ============================================================================
-- Viesa Command Center — migratie 0036: eigen agenda-activiteiten
-- ----------------------------------------------------------------------------
-- Onze eigen agenda (naast de gekoppelde Google/iCal-agenda's). Een activiteit
-- heeft een begin en einde, optioneel een locatie en een "hele dag"-vlag.
-- RLS: gedeelde werkruimte (elke geauthenticeerde gebruiker). Idempotent.
-- ============================================================================

create table if not exists public.agenda_activiteiten (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid default auth.uid(),
  titel      text not null,
  locatie    text,
  begin_ts   timestamptz not null,
  eind_ts    timestamptz,
  hele_dag   boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists agenda_activiteiten_begin_idx on public.agenda_activiteiten (begin_ts);

alter table public.agenda_activiteiten enable row level security;
drop policy if exists geauth_toegang on public.agenda_activiteiten;
create policy geauth_toegang on public.agenda_activiteiten
  for all to authenticated
  using (true)
  with check (true);
