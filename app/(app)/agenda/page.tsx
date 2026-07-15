import { PaginaKop } from "@/components/ui/PaginaKop";
import { KpiKaart } from "@/components/ui/KpiKaart";
import { Kaart } from "@/components/ui/Kaart";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { createClient } from "@/lib/supabase/server";
import {
  googleConfig,
  accessTokenFromRefresh,
  googleCalendarEvents,
  type AgendaItem,
} from "@/lib/google";
import { leesFout } from "@/lib/fout";

export const dynamic = "force-dynamic";

type Status = "verbonden" | "niet_verbonden" | "geen_config" | "fout";

function dagKop(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function tijd(item: AgendaItem): string {
  if (item.heleDag) return "Hele dag";
  const s = new Date(item.start).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (!item.eind) return s;
  const e = new Date(item.eind).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${s} – ${e}`;
}

function isVandaag(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getDate() === n.getDate() &&
    d.getMonth() === n.getMonth() &&
    d.getFullYear() === n.getFullYear()
  );
}

function binnenDagen(iso: string, dagen: number): boolean {
  const d = new Date(iso).getTime();
  const n = Date.now();
  return d >= n && d <= n + dagen * 24 * 60 * 60 * 1000;
}

export default async function AgendaPagina() {
  const supabase = createClient();
  const cfg = googleConfig();

  let items: AgendaItem[] = [];
  let status: Status = "niet_verbonden";
  let foutmelding = "";

  const { data: integ } = await supabase
    .from("integraties")
    .select("config")
    .eq("dienst", "gmail")
    .maybeSingle();
  const refresh = (integ?.config as { refresh_token?: string } | null)?.refresh_token;

  if (!cfg) {
    status = "geen_config";
  } else if (!refresh) {
    status = "niet_verbonden";
  } else {
    try {
      const at = await accessTokenFromRefresh(cfg, refresh);
      items = await googleCalendarEvents(at, { dagen: 30 });
      status = "verbonden";
    } catch (e) {
      status = "fout";
      foutmelding = leesFout(e);
    }
  }

  // Groepeer op dag (items komen al gesorteerd op starttijd binnen).
  const perDag = new Map<string, AgendaItem[]>();
  for (const it of items) {
    const sleutel = new Date(it.start).toDateString();
    if (!perDag.has(sleutel)) perDag.set(sleutel, []);
    perDag.get(sleutel)!.push(it);
  }

  const vandaag = items.filter((i) => isVandaag(i.start)).length;
  const week = items.filter((i) => binnenDagen(i.start, 7)).length;

  return (
    <>
      <PaginaKop
        titel="Agenda"
        omschrijving="De Google-agenda van Viesa (Tom & Joep) — komende 30 dagen."
      />

      <section className="mb-8 grid grid-cols-3 gap-4">
        <KpiKaart label="Vandaag" waarde={String(vandaag)} accent={vandaag > 0} />
        <KpiKaart label="Deze week" waarde={String(week)} />
        <KpiKaart label="Komende 30 dagen" waarde={String(items.length)} />
      </section>

      {status === "geen_config" && (
        <Kaart>
          <p className="text-sm font-medium text-navy">Google nog niet geconfigureerd</p>
          <p className="mt-1 text-sm text-navy/70">
            Zet <code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code> en{" "}
            <code>GOOGLE_REDIRECT_URI</code> in Vercel en redeploy.
          </p>
        </Kaart>
      )}

      {status === "niet_verbonden" && (
        <Kaart>
          <p className="text-sm font-medium text-navy">Agenda nog niet gekoppeld</p>
          <p className="mt-1 text-sm text-navy/70">
            Verbind de Google-agenda van Viesa om afspraken hier te tonen.
          </p>
          <a
            href="/api/google/oauth/start"
            className="mt-4 inline-block rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
          >
            Verbind Google-agenda
          </a>
        </Kaart>
      )}

      {status === "fout" && (
        <Kaart>
          <p className="text-sm font-medium text-oranje">Kon de agenda niet ophalen</p>
          <p className="mt-1 font-mono text-xs text-navy/50">{foutmelding}</p>
          <a
            href="/api/google/oauth/start"
            className="mt-4 inline-block rounded-lg border border-navy/20 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5"
          >
            Opnieuw verbinden
          </a>
        </Kaart>
      )}

      {status === "verbonden" &&
        (items.length === 0 ? (
          <LegeStaat
            titel="Geen afspraken"
            omschrijving="Er staan geen afspraken in de komende 30 dagen."
          />
        ) : (
          <div className="space-y-6">
            {Array.from(perDag.entries()).map(([sleutel, dagItems]) => (
              <div key={sleutel}>
                <p className="mb-2 text-sm font-semibold capitalize text-navy">
                  {dagKop(dagItems[0].start)}
                </p>
                <Kaart className="p-0">
                  <ul>
                    {dagItems.map((it, i) => (
                      <li
                        key={it.id}
                        className={`flex items-center justify-between gap-4 px-5 py-3 ${
                          i > 0 ? "border-t border-navy/10" : ""
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <span className="w-28 shrink-0 text-xs font-medium text-navy/50">
                            {tijd(it)}
                          </span>
                          <div className="min-w-0">
                            {it.link ? (
                              <a
                                href={it.link}
                                target="_blank"
                                rel="noreferrer"
                                className="truncate text-sm font-medium text-navy hover:underline"
                              >
                                {it.titel}
                              </a>
                            ) : (
                              <span className="truncate text-sm font-medium text-navy">
                                {it.titel}
                              </span>
                            )}
                            {it.locatie && (
                              <p className="truncate text-xs text-navy/50">{it.locatie}</p>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Kaart>
              </div>
            ))}
          </div>
        ))}
    </>
  );
}
