-- ============================================================================
-- Viesa Command Center — migratie 0046: rapporten in het activiteitenlog
-- ----------------------------------------------------------------------------
-- Een gepushte websitescan (en later: audit) komt als activiteit in het log
-- van de lead te staan, type 'rapport'. `data` bewaart de volledige,
-- structureerde rapportinhoud (jsonb) zodat een PDF later opnieuw
-- gegenereerd kan worden zonder de scan te herhalen.
--
-- `type` opnieuw hard herstellen i.p.v. drop-by-name (zie migratie 0042: een
-- gegokte constraintnaam kan stil niets doen). Veilig te herhalen.
-- ============================================================================

alter table public.activiteiten add column if not exists data jsonb;

do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.activiteiten'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%type%'
  loop
    execute format('alter table public.activiteiten drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.activiteiten add constraint activiteiten_type_check
  check (type in ('notitie','call','email','follow_up','taak','systeem','rapport'));
