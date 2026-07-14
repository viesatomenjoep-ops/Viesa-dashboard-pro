-- ============================================================================
-- Viesa Command Center — migratie 0002: RLS-performance
-- ----------------------------------------------------------------------------
-- 1) Index op owner_id per tabel (elke policy filtert hierop).
-- 2) Policies herschrijven met (select auth.uid()) zodat Postgres de functie
--    één keer per statement evalueert (initPlan-caching) i.p.v. per rij.
-- Idempotent: veilig opnieuw uit te voeren.
-- ============================================================================

do $$
declare
  t text;
  tabellen text[] := array[
    'klanten','leads','offerte_templates','offertes','facturen',
    'factuur_herinneringen','projecten','project_notities','taken',
    'drive_links','design_documenten','whiteboards','sticky_notes','integraties'
  ];
begin
  foreach t in array tabellen loop
    -- Index op owner_id
    execute format(
      'create index if not exists %I on public.%I (owner_id);',
      t || '_owner_id_idx', t);

    -- Policy herschrijven met (select auth.uid())
    execute format('drop policy if exists eigenaar_alles on public.%I;', t);
    execute format(
      'create policy eigenaar_alles on public.%I
         for all to authenticated
         using ((select auth.uid()) = owner_id)
         with check ((select auth.uid()) = owner_id);', t);
  end loop;
end $$;
