-- ============================================================================
-- Viesa Dashboard — migratie 0022: taken koppelen aan klant/lead
-- ----------------------------------------------------------------------------
-- Een to-do kan optioneel bij een klant of een lead horen, zodat je vanuit de
-- taak direct naar de context springt. Idempotent.
-- ============================================================================

alter table public.taken
  add column if not exists klant_id uuid references public.klanten (id) on delete set null,
  add column if not exists lead_id  uuid references public.leads (id)  on delete set null;

create index if not exists taken_klant_idx on public.taken (klant_id);
create index if not exists taken_lead_idx  on public.taken (lead_id);

-- RLS staat al aan op public.taken (zie 0015); geen nieuwe policy nodig.
