-- ============================================================================
-- Viesa Dashboard — migratie 0032: sjablonen (template-machine)
-- ----------------------------------------------------------------------------
-- Herbruikbare sjablonen voor e-mail, offerte en audit. Inhoud is opgemaakte
-- HTML (WYSIWYG) met {{variabelen}} die bij gebruik worden ingevuld vanuit de
-- klant/lead. RLS: gedeelde werkruimte. Idempotent.
-- ============================================================================

create table if not exists public.sjablonen (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid default auth.uid(),
  type        text not null default 'email'
              check (type in ('email','offerte','audit')),
  naam        text not null,
  onderwerp   text,                       -- alleen voor e-mail
  inhoud_html text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists sjablonen_type_idx on public.sjablonen (type, naam);

alter table public.sjablonen enable row level security;
drop policy if exists geauth_toegang on public.sjablonen;
create policy geauth_toegang on public.sjablonen
  for all to authenticated
  using (true)
  with check (true);
