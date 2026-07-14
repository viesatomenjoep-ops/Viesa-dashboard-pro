import { createClient } from "@/lib/supabase/server";
import { signOut } from "./login/actions";

const kpis = [
  { label: "Omzet deze maand", waarde: "€ 0" },
  { label: "Openstaande facturen", waarde: "€ 0" },
  { label: "Actieve deals", waarde: "0" },
  { label: "Nieuwe leads", waarde: "0" },
];

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-navy">Viesa Dashboard</h1>
          <p className="mt-1 text-sm text-navy/60">
            Intern administratie- en salesdashboard voor Viesa Automations
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user?.email && (
            <span className="hidden text-sm text-navy/60 sm:inline">
              {user.email}
            </span>
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-lg border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy transition-colors hover:bg-navy/5"
            >
              Uitloggen
            </button>
          </form>
        </div>
      </header>

      {/* KPI's staan altijd bovenaan */}
      <section
        aria-label="Kerncijfers"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-navy/10 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-navy/60">{kpi.label}</p>
            <p className="mt-2 text-3xl font-semibold text-navy">{kpi.waarde}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 rounded-xl border border-navy/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-navy">Aan de slag</h2>
        <p className="mt-2 text-sm text-navy/70">
          Je bent ingelogd. Bouw de eerste modules verder uit — bijvoorbeeld
          klanten, facturen of deals.
        </p>
      </section>
    </main>
  );
}
