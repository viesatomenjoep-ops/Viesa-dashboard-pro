import { type ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import type { Notificatie } from "@/lib/notificaties";

/**
 * App-shell voor alle beveiligde pagina's. De middleware zorgt dat alleen
 * ingelogde bezoekers hier komen. Responsief: zijbalk op desktop, uitschuifbaar
 * menu op mobiel (zie AppShell).
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Laatste meldingen + ongelezen-teller voor de bel in de topbalk (best-effort:
  // de tabel kan nog ontbreken vóór migratie 0030). Beide queries parallel.
  let meldingen: Notificatie[] = [];
  let ongelezen = 0;
  try {
    const [recent, teller] = await Promise.all([
      supabase.from("notificaties").select("*").order("created_at", { ascending: false }).limit(6),
      supabase.from("notificaties").select("*", { count: "exact", head: true }).eq("gelezen", false),
    ]);
    meldingen = (recent.data ?? []) as Notificatie[];
    ongelezen = teller.count ?? 0;
  } catch {
    /* notificaties-tabel nog niet aanwezig */
  }

  return (
    <AppShell userEmail={user?.email ?? undefined} meldingen={meldingen} ongelezen={ongelezen}>
      {children}
    </AppShell>
  );
}
