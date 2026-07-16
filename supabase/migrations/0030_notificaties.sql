-- ============================================================================
-- Viesa Dashboard — migratie 0030: notificatiecentrum
-- ----------------------------------------------------------------------------
-- Meldingen voor de gedeelde werkruimte (bv. factuur vervallen, lead gewonnen,
-- e-mail ontvangen). Voedt zowel de /notificaties-pagina als de bel-dropdown in
-- de topbalk. RLS: gedeelde werkruimte. Idempotent.
-- ============================================================================

create table if not exists public.notificaties (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid default auth.uid(),
  type         text not null default 'info'
               check (type in ('info','succes','waarschuwing','fout')),
  titel        text not null,
  tekst        text,
  context_type text,
  context_id   uuid,
  link         text,
  gelezen      boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists notificaties_created_idx on public.notificaties (created_at desc);
create index if not exists notificaties_gelezen_idx on public.notificaties (gelezen);

alter table public.notificaties enable row level security;
drop policy if exists geauth_toegang on public.notificaties;
create policy geauth_toegang on public.notificaties
  for all to authenticated
  using (true)
  with check (true);
