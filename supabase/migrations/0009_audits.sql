-- ============================================================================
-- Viesa Command Center — migratie 0009: audits (auditverslagen)
-- ----------------------------------------------------------------------------
-- Auditverslag in de huisstijl, gekoppeld aan een klant en/of lead.
-- Exporteerbaar als PDF. RLS: gedeelde werkruimte. Idempotent.
-- ============================================================================

create table if not exists public.audits (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid default auth.uid(),
  klant_id        uuid references public.klanten (id) on delete set null,
  lead_id         uuid references public.leads (id) on delete set null,
  nummer          text not null,
  titel           text not null default 'Auditverslag',
  status          text not null default 'concept' check (status in ('concept','afgerond')),
  inhoud_markdown text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists audits_klant_idx on public.audits (klant_id);

drop trigger if exists set_updated_at on public.audits;
create trigger set_updated_at before update on public.audits
  for each row execute function public.set_updated_at();

alter table public.audits enable row level security;
drop policy if exists geauth_toegang on public.audits;
create policy geauth_toegang on public.audits
  for all to authenticated
  using (true)
  with check (true);
