"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { verwerkNotulen, type AgendaVoorstel } from "@/lib/ai/notulen";

/** Notulen-agent (#7): zet ruwe notities om in gestructureerde actiepunten. */
export async function verwerkNotulenAgent(tekst: string) {
  const supabase = createClient();
  return verwerkNotulen(supabase, tekst);
}

/** Maakt de gekozen taken aan (to-do's). */
export async function maakTakenBulk(
  titels: string[],
): Promise<{ ok: boolean; aantal: number; fout?: string }> {
  const rijen = (titels ?? [])
    .filter(Boolean)
    .map((t) => ({
      titel: t.slice(0, 200),
      wie: "algemeen" as const,
      status: "todo" as const,
      periode: "week" as const,
      prioriteit: "normaal" as const,
    }));
  if (!rijen.length) return { ok: true, aantal: 0 };
  const supabase = createClient();
  const { error } = await supabase.from("taken").insert(rijen);
  if (error) return { ok: false, aantal: 0, fout: error.message };
  revalidatePath("/taken");
  return { ok: true, aantal: rijen.length };
}

/** Zet de gekozen agenda-items in de eigen agenda. */
export async function maakAgendaItems(
  items: AgendaVoorstel[],
): Promise<{ ok: boolean; aantal: number; fout?: string }> {
  const vandaag = new Date().toISOString().slice(0, 10);
  const rijen = (items ?? [])
    .filter((i) => i && i.titel)
    .map((i) => {
      const datum = i.datum && /^\d{4}-\d{2}-\d{2}$/.test(i.datum) ? i.datum : vandaag;
      return { titel: i.titel.slice(0, 200), begin_ts: `${datum}T09:00:00`, hele_dag: false };
    });
  if (!rijen.length) return { ok: true, aantal: 0 };
  const supabase = createClient();
  const { error } = await supabase.from("agenda_activiteiten").insert(rijen);
  if (error) return { ok: false, aantal: 0, fout: error.message };
  revalidatePath("/agenda");
  return { ok: true, aantal: rijen.length };
}
