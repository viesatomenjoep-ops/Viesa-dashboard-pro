-- ============================================================================
-- Viesa Command Center — bootstrap (GEEN voorbeelddata)
-- ----------------------------------------------------------------------------
-- Bewust GEEN fake leads/offertes/facturen enz. — je bouwt echte cases op.
-- Alleen de design-templates die de offerte-generator en design-editor nodig
-- hebben. Draai NA 0004 (optioneel). Idempotent.
-- ============================================================================

insert into public.design_docs (pad, inhoud_markdown) values
  ('design-systems/viesa-huisstijl.md',
   '# Huisstijl'||chr(10)||'Navy #19445B primair, teal #1E9E93 als accent. Nederlandse teksten.'),
  ('design-systems/offerte-template.md',
   '# Offerte {{titel}}'||chr(10)||chr(10)||'Beste {{bedrijfsnaam}},'||chr(10)||chr(10)||
   '## Voorstel'||chr(10)||'- ...'||chr(10)||chr(10)||'## Investering'||chr(10)||'- ...'),
  ('design-systems/e-mail-toon.md',
   '# E-mailtoon'||chr(10)||'Vriendelijk, helder, Nederlands. Kort en concreet.')
on conflict (pad) do nothing;
