-- ============================================================================
-- Viesa Command Center — migratie 0003: gedeelde werkruimte
-- ----------------------------------------------------------------------------
-- Van "alleen eigen rijen" naar een GEDEELDE werkruimte: elke ingelogde
-- gebruiker mag alle rijen zien en beheren. Veilig omdat er geen publieke
-- signup is — alleen door de eigenaar aangemaakte accounts kunnen inloggen.
--
-- `owner_id` blijft bestaan als "aangemaakt door"-metadata (default auth.uid()),
-- maar bepaalt niet langer de toegang.
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
    execute format('alter table public.%I enable row level security;', t);
    -- Oude policy-namen opruimen.
    execute format('drop policy if exists eigenaar_alles on public.%I;', t);
    execute format('drop policy if exists gedeelde_toegang on public.%I;', t);
    -- Nieuwe gedeelde policy: elke geauthenticeerde gebruiker mag alles.
    execute format(
      'create policy gedeelde_toegang on public.%I
         for all to authenticated
         using (true)
         with check (true);', t);
  end loop;
end $$;
