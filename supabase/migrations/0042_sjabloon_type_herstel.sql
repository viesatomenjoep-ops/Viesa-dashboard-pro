-- ============================================================================
-- Viesa Dashboard — migratie 0042: sjabloon-type-constraint hard herstellen
-- ----------------------------------------------------------------------------
-- Migratie 0040 verruimde `sjablonen.type` met 'belscript' door de constraint
-- `sjablonen_type_check` te droppen en opnieuw aan te maken. Dat werkt alleen
-- als die constraint ook écht zo heet. Postgres kiest die naam automatisch bij
-- een inline CHECK, maar heeft de tabel ooit een tweede check gekregen, dan
-- heet hij `sjablonen_type_check1` — en dan doet 0040's `drop ... if exists`
-- niets, blijft de oude constraint staan en weigert de database nog steeds
-- 'belscript'. De migratie meldt dan geen enkele fout, terwijl het importeren
-- van de belscripts stilvalt.
--
-- Deze migratie sluit dat uit: hij zoekt élke CHECK-constraint op de kolom
-- `type` op, ongeacht de naam, gooit die weg en zet er één juiste terug.
--
-- Veilig om te draaien of 0040 nu wel of niet is gelukt, en veilig om te
-- herhalen. sjablonen heeft al RLS (0032), dus er verandert niets aan de
-- beveiliging.
-- ============================================================================

do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.sjablonen'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%type%'
  loop
    execute format('alter table public.sjablonen drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.sjablonen add constraint sjablonen_type_check
  check (type in ('email', 'offerte', 'audit', 'belscript'));

-- Zekerheidshalve ook de kolom uit 0041; add ... if not exists doet niets als
-- die er al staat.
alter table public.sjablonen add column if not exists lettertype text;
