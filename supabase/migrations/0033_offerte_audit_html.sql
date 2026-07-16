-- ============================================================================
-- Viesa Dashboard — migratie 0033: WYSIWYG-inhoud voor offertes en audits
-- ----------------------------------------------------------------------------
-- Offertes en audits worden voortaan met een rich-text editor (HTML) bewerkt.
-- We voegen een `inhoud_html`-kolom toe; de bestaande `inhoud_markdown` blijft
-- staan zodat oude documenten in de PDF-weergave blijven werken (fallback).
-- Idempotent.
-- ============================================================================

alter table public.offertes
  add column if not exists inhoud_html text not null default '';

alter table public.audits
  add column if not exists inhoud_html text not null default '';
