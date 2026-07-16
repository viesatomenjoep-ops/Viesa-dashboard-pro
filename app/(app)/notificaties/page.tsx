import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { Kaart } from "@/components/ui/Kaart";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { createClient } from "@/lib/supabase/server";
import { NOTIFICATIE_STIJL, type Notificatie } from "@/lib/notificaties";
import { leesFout } from "@/lib/fout";
import { markeerAllesGelezen, markeerGelezen, verwijderNotificatie } from "./acties";

export const dynamic = "force-dynamic";

const TZ = "Europe/Amsterdam";

function dagSleutel(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { timeZone: TZ });
}

function groepLabel(iso: string): string {
  const vandaag = new Date().toLocaleDateString("sv-SE", { timeZone: TZ });
  const gisterenD = new Date();
  gisterenD.setDate(gisterenD.getDate() - 1);
  const gisteren = gisterenD.toLocaleDateString("sv-SE", { timeZone: TZ });
  const dag = dagSleutel(iso);
  if (dag === vandaag) return "Vandaag";
  if (dag === gisteren) return "Gisteren";
  return "Ouder";
}

function tijd(iso: string): string {
  return new Date(iso).toLocaleString("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

export default async function NotificatiesPagina() {
  const supabase = createClient();
  let notificaties: Notificatie[] = [];
  let schemaOntbreekt = false;
  let foutmelding = "";
  try {
    const { data, error } = await supabase
      .from("notificaties")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    notificaties = (data ?? []) as Notificatie[];
  } catch (e) {
    schemaOntbreekt = true;
    foutmelding = leesFout(e);
  }

  const ongelezen = notificaties.filter((n) => !n.gelezen).length;

  // Groeperen op Vandaag / Gisteren / Ouder, met behoud van de sorteervolgorde.
  const groepen: { label: string; items: Notificatie[] }[] = [];
  for (const n of notificaties) {
    const label = groepLabel(n.created_at);
    const bestaand = groepen.find((g) => g.label === label);
    if (bestaand) bestaand.items.push(n);
    else groepen.push({ label, items: [n] });
  }

  return (
    <>
      <PaginaKop
        titel="Notificaties"
        omschrijving="Blijf op de hoogte van wat er speelt."
        actie={
          ongelezen > 0 ? (
            <form action={markeerAllesGelezen}>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-navy/20 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5">
                <CheckCheck size={16} /> Alles gelezen
              </button>
            </form>
          ) : undefined
        }
      />

      {schemaOntbreekt ? (
        <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Datamodel nog niet actief</p>
          <p className="mt-1 text-navy/70">Voer 0030_notificaties.sql uit in de Supabase SQL Editor.</p>
          {foutmelding && <p className="mt-2 font-mono text-xs text-navy/50">Details: {foutmelding}</p>}
        </div>
      ) : notificaties.length === 0 ? (
        <p className="px-1 text-sm text-navy/40">Geen notificaties.</p>
      ) : (
        <div className="space-y-6">
          {groepen.map((groep) => (
            <div key={groep.label}>
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-navy/40">
                {groep.label}
              </p>
              <Kaart className="p-0">
                <ul>
                  {groep.items.map((n, i) => {
                    const { icoon: Icoon, vlak } = NOTIFICATIE_STIJL[n.type] ?? NOTIFICATIE_STIJL.info;
                    return (
                      <li
                        key={n.id}
                        className={`flex items-start gap-3 px-4 py-3.5 sm:px-5 ${
                          i > 0 ? "border-t border-navy/10" : ""
                        } ${n.gelezen ? "" : "bg-navy/[0.015]"}`}
                      >
                        <span
                          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${vlak}`}
                        >
                          <Icoon size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm text-navy ${n.gelezen ? "font-medium" : "font-semibold"}`}>
                              {n.titel}
                            </p>
                            {!n.gelezen && (
                              <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-oranje" />
                            )}
                            <span className="ml-auto shrink-0 text-xs text-navy/40">{tijd(n.created_at)}</span>
                          </div>
                          {n.tekst && <p className="mt-0.5 text-sm text-navy/60">{n.tekst}</p>}
                          <div className="mt-1.5 flex items-center gap-3 text-xs">
                            {n.link && (
                              <Link href={n.link} className="font-medium text-oranje hover:underline">
                                Bekijken →
                              </Link>
                            )}
                            {!n.gelezen && (
                              <form action={markeerGelezen.bind(null, n.id)}>
                                <button className="text-navy/50 hover:text-navy">Markeer gelezen</button>
                              </form>
                            )}
                            <form action={verwijderNotificatie.bind(null, n.id)}>
                              <button className="text-navy/40 hover:text-red-500">Verwijderen</button>
                            </form>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Kaart>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
