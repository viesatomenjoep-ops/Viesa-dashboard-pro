-- ============================================================================
-- Viesa Command Center — migratie 0040: belgesprekken
-- ----------------------------------------------------------------------------
-- De bellijst (0037) hield alleen `laatst_gebeld` bij en overschreef die telkens.
-- Er bleef dus geen gespreksgeschiedenis over en een follow-up moest je apart
-- aanmaken. Deze migratie voegt drie dingen toe:
--
--   1. activiteiten.uitkomst  — hoe een gesprek afliep (bereikt, voicemail, …).
--      Een belgesprek wordt vanaf nu vastgelegd als activiteit van type 'call',
--      zodat het in het activiteitenlog van de lead terechtkomt.
--   2. leads.belpogingen      — hoe vaak we het geprobeerd hebben. Zo zie je
--      "3x gebeld, nooit bereikt" in plaats van alleen de laatste datum.
--   3. sjablonen.type 'belscript' — belscripts wonen in de bestaande
--      sjablonen-machine, naast e-mail/offerte/audit.
--
-- Beide tabellen hebben al RLS (policy geauth_toegang uit 0004 resp. 0032), dus
-- deze kolommen erven die beveiliging — er is geen nieuwe policy nodig.
-- Idempotent: veilig meerdere keren uit te voeren.
-- ============================================================================

-- 1) Uitkomst van een belgesprek -------------------------------------------
alter table public.activiteiten add column if not exists uitkomst text;

-- De CHECK apart zetten (en eerst droppen) houdt de migratie herhaalbaar.
alter table public.activiteiten drop constraint if exists activiteiten_uitkomst_check;
alter table public.activiteiten add constraint activiteiten_uitkomst_check
  check (
    uitkomst is null
    or uitkomst in (
      'bereikt',
      'voicemail',
      'niet_opgenomen',
      'terugbellen',
      'afspraak',
      'geen_interesse'
    )
  );

comment on column public.activiteiten.uitkomst is
  'Alleen gevuld bij type=''call'': hoe het gesprek afliep.';

create index if not exists activiteiten_uitkomst_idx
  on public.activiteiten (uitkomst) where uitkomst is not null;

-- 2) Belpogingen per lead ---------------------------------------------------
alter table public.leads add column if not exists belpogingen integer not null default 0;

comment on column public.leads.belpogingen is
  'Aantal keer geprobeerd te bellen; loopt op bij elk vastgelegd gesprek.';

-- 3) Belscripts in de sjablonen-machine -------------------------------------
alter table public.sjablonen drop constraint if exists sjablonen_type_check;
alter table public.sjablonen add constraint sjablonen_type_check
  check (type in ('email', 'offerte', 'audit', 'belscript'));
