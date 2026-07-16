-- ============================================================================
-- Viesa Dashboard — migratie 0034: administratie (bonnetjes & facturen scannen)
-- ----------------------------------------------------------------------------
-- Foto's van bonnetjes, facturen en bestellingen (met de mobiele camera). De
-- bestanden zelf staan in de private Storage-bucket 'administratie'; hier de
-- metadata + optioneel de Google-Drive-link. RLS: gedeelde werkruimte. Idempotent.
-- ============================================================================

create table if not exists public.administratie (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid default auth.uid(),
  type          text not null default 'bonnetje'
                check (type in ('bonnetje','factuur','bestelling','overig')),
  omschrijving  text,
  bedrag        numeric(12,2),
  storage_pad   text,               -- pad in de bucket 'administratie'
  mime          text,
  grootte       integer,
  drive_url     text,               -- link in Google Drive (indien doorgezet)
  drive_file_id text,
  created_at    timestamptz not null default now()
);
create index if not exists administratie_created_idx on public.administratie (created_at desc);

alter table public.administratie enable row level security;
drop policy if exists geauth_toegang on public.administratie;
create policy geauth_toegang on public.administratie
  for all to authenticated
  using (true)
  with check (true);

-- --- Private Storage-bucket voor de foto's -----------------------------------
insert into storage.buckets (id, name, public)
values ('administratie', 'administratie', false)
on conflict (id) do nothing;

-- Geauthenticeerde gebruikers mogen lezen; schrijven gebeurt server-side met de
-- service-role (omzeilt RLS), dus daar is geen insert-policy voor nodig.
drop policy if exists administratie_lezen on storage.objects;
create policy administratie_lezen on storage.objects
  for select to authenticated
  using (bucket_id = 'administratie');
