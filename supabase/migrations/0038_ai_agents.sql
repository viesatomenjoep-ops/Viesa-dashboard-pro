-- ============================================================================
-- Viesa Command Center — migratie 0038: AI-agents fundament
-- ----------------------------------------------------------------------------
-- Centrale logtabel voor élke agent-run (bel-lijst, dagbriefing, verrijking, …).
-- Eén plek om te zien wat de AI deed, wat het kostte en of het lukte.
-- RLS aan + policy 'to authenticated' conform de vaste regel (geen uitzonderingen).
-- Idempotent.
-- ============================================================================

create table if not exists public.ai_runs (
  id           uuid primary key default gen_random_uuid(),
  agent        text not null,                       -- slug, bv. 'bellijst', 'dagbriefing'
  status       text not null default 'gestart',     -- gestart | klaar | mislukt
  invoer       jsonb,                               -- context die de agent kreeg
  uitvoer      jsonb,                               -- gestructureerd resultaat
  model        text,
  tokens_in    integer,
  tokens_uit   integer,
  duur_ms      integer,
  fout         text,
  created_at   timestamptz not null default now()
);

create index if not exists ai_runs_agent_idx on public.ai_runs (agent, created_at desc);

alter table public.ai_runs enable row level security;

drop policy if exists "ai_runs_geauth" on public.ai_runs;
create policy "ai_runs_geauth" on public.ai_runs
  for all to authenticated using (true) with check (true);
