import { type ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { Zijbalk } from "@/components/layout/Zijbalk";

/**
 * App-shell voor alle beveiligde pagina's: vaste zijbalk + topbalk met de
 * ingelogde gebruiker en een uitlog-knop. De middleware zorgt dat alleen
 * ingelogde bezoekers hier komen.
 */
export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen">
      <Zijbalk />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-3 border-b border-navy/10 bg-white px-6 py-3">
          {user?.email && (
            <span className="text-sm text-navy/60">{user.email}</span>
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy transition-colors hover:bg-navy/5"
            >
              Uitloggen
            </button>
          </form>
        </header>
        <main className="flex-1 px-6 py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
