/** Types en helpers voor het notificatiecentrum (migratie 0030). */
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificatieType = "info" | "succes" | "waarschuwing" | "fout";

export type Notificatie = {
  id: string;
  type: NotificatieType;
  titel: string;
  tekst: string | null;
  context_type: string | null;
  context_id: string | null;
  link: string | null;
  gelezen: boolean;
  created_at: string;
};

/** Icoon + kleur-vlak per notificatietype (naar het voorbeeld van beeld #16). */
export const NOTIFICATIE_STIJL: Record<
  NotificatieType,
  { icoon: LucideIcon; vlak: string }
> = {
  info: { icoon: Info, vlak: "bg-blue-100 text-blue-700" },
  succes: { icoon: CheckCircle2, vlak: "bg-emerald-100 text-emerald-700" },
  waarschuwing: { icoon: AlertTriangle, vlak: "bg-amber-100 text-amber-700" },
  fout: { icoon: XCircle, vlak: "bg-red-100 text-red-700" },
};

/**
 * Maakt een notificatie. Bedoeld om later vanuit bestaande server-acties aan te
 * roepen (factuur vervallen, lead gewonnen, e-mail ontvangen). Best-effort:
 * faalt stil als de tabel nog niet bestaat.
 */
export async function maakNotificatie(
  supabase: SupabaseClient,
  n: {
    type: NotificatieType;
    titel: string;
    tekst?: string | null;
    context_type?: string | null;
    context_id?: string | null;
    link?: string | null;
  },
): Promise<void> {
  try {
    await supabase.from("notificaties").insert({
      type: n.type,
      titel: n.titel,
      tekst: n.tekst ?? null,
      context_type: n.context_type ?? null,
      context_id: n.context_id ?? null,
      link: n.link ?? null,
    });
  } catch {
    /* tabel nog niet aanwezig — negeren */
  }
}
