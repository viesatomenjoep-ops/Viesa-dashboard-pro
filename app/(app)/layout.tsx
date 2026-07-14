import { type ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";

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

  return <AppShell userEmail={user?.email ?? undefined}>{children}</AppShell>;
}
