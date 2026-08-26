import { createClient } from "@/lib/supabase/server";
import { LeadFilter } from "./LeadFilter";

/**
 * Lead Directory — de gedeelde prospectlijst waaruit je direct een audit start.
 *
 * Server component: de leads komen rechtstreeks uit Supabase, zonder omweg via
 * een API-route. Het filteren gebeurt in een kleine client-component eromheen,
 * zodat alleen dát stuk JavaScript nodig heeft.
 *
 * Let op: dit leest `ai_leads`, niet `leads`. Die laatste is de bestaande
 * leadtabel van het dashboard, met een heel ander schema — zie migratie 0044.
 */

export type AiLead = {
  id: string;
  company_name: string;
  website: string | null;
  niche: string | null;
  contact_email: string | null;
};

export async function LeadDirectory() {
  const supabase = createClient();

  let leads: AiLead[] = [];
  let fout = "";
  try {
    const { data, error } = await supabase
      .from("ai_leads")
      .select("id, company_name, website, niche, contact_email")
      .order("company_name");
    if (error) throw error;
    leads = (data ?? []) as AiLead[];
  } catch (e) {
    fout = e instanceof Error ? e.message : "Leads niet op te halen.";
  }

  if (fout) {
    return (
      <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
        <p className="font-medium text-oranje">Lead directory niet beschikbaar</p>
        <p className="mt-1 text-navy/70">
          Voer <code className="rounded bg-navy/5 px-1">0044_ai_visibility_audit.sql</code>{" "}
          uit in de Supabase SQL Editor.
        </p>
        <p className="mt-2 font-mono text-xs text-navy/50">{fout}</p>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-2xl border border-navy/10 bg-white p-6 text-sm text-navy/50">
        Nog geen leads in de directory. Een beheerder kan ze toevoegen in de
        tabel <code className="rounded bg-navy/5 px-1">ai_leads</code>.
      </div>
    );
  }

  return <LeadFilter leads={leads} />;
}
