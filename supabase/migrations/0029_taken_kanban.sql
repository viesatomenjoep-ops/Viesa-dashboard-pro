-- ============================================================================
-- Viesa Dashboard — migratie 0029: taken-kanban
-- ----------------------------------------------------------------------------
-- Breidt de bestaande `taken`-tabel uit met een kanban-status, prioriteit,
-- tags en een sorteervolgorde, zodat to-do's op een sleepbaar bord kunnen. Het
-- bestaande `klaar`-veld blijft (dashboard-to-do); de 'klaar'-kolom en `klaar`
-- worden in de acties gelijk gehouden. Idempotent.
-- ============================================================================

alter table public.taken
  add column if not exists status     text not null default 'todo'
    check (status in ('todo','bezig','review','klaar')),
  add column if not exists prioriteit text not null default 'normaal'
    check (prioriteit in ('laag','normaal','hoog')),
  add column if not exists tags       text[] not null default '{}',
  add column if not exists positie    int    not null default 0;

-- Reeds afgevinkte taken meteen in de 'klaar'-kolom zetten.
update public.taken set status = 'klaar' where klaar = true and status = 'todo';

create index if not exists taken_status_idx on public.taken (status, positie);

-- RLS staat al aan op public.taken (zie 0015); geen nieuwe policy nodig.
