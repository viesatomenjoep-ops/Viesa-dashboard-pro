-- ============================================================================
-- Viesa Command Center — migratie 0013: e-maillog (Resend)
-- ----------------------------------------------------------------------------
-- Logt verzonden (en via webhook ontvangen) e-mails. RLS: gedeelde werkruimte.
-- Idempotent.
-- ============================================================================

create table if not exists public.emails (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid default auth.uid(),
  richting    text not null default 'uitgaand' check (richting in ('uitgaand','inkomend')),
  van         text,
  naar        text,
  onderwerp   text,
  html        text,
  tekst       text,
  status      text not null default 'verzonden',
  provider_id text,
  klant_id    uuid references public.klanten (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists emails_created_idx on public.emails (created_at desc);
create index if not exists emails_klant_idx on public.emails (klant_id);

alter table public.emails enable row level security;
drop policy if exists geauth_toegang on public.emails;
create policy geauth_toegang on public.emails
  for all to authenticated
  using (true)
  with check (true);
