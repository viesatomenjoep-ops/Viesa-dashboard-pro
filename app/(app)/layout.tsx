import { type ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";
import type { Notificatie } from "@/lib/notificaties";

async function veilig<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

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

  // Cijfers voor de info-balk in het mobiele hamburgermenu (dezelfde als op het
  // startscherm). Best-effort — tabellen kunnen vóór migratie ontbreken.
  const [openTaken, leads, openstaand, offertes, klanten] = await Promise.all([
    veilig(async () => {
      const { count } = await supabase
        .from("taken")
        .select("*", { count: "exact", head: true })
        .eq("klaar", false);
      return count ?? 0;
    }, 0),
    veilig(async () => {
      const { count } = await supabase.from("leads").select("*", { count: "exact", head: true });
      return count ?? 0;
    }, 0),
    veilig(async () => {
      const { data } = await supabase
        .from("facturen")
        .select("bedrag, status")
        .in("status", ["open", "vervallen"]);
      return (data ?? []).reduce((s, f) => s + Number(f.bedrag ?? 0), 0);
    }, 0),
    veilig(async () => {
      const { count } = await supabase
        .from("offertes")
        .select("*", { count: "exact", head: true })
        .in("status", ["concept", "verzonden", "opvolgen"]);
      return count ?? 0;
    }, 0),
    veilig(async () => {
      const { count } = await supabase.from("klanten").select("*", { count: "exact", head: true });
      return count ?? 0;
    }, 0),
  ]);

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
    <AppShell
      userEmail={user?.email ?? undefined}
      meldingen={meldingen}
      ongelezen={ongelezen}
      info={{ openTaken, leads, openstaand, offertes, klanten }}
    >
      {children}
    </AppShell>
  );
}
