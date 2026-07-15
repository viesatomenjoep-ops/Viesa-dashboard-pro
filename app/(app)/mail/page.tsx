import Link from "next/link";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { KpiKaart } from "@/components/ui/KpiKaart";
import { Kaart } from "@/components/ui/Kaart";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { createClient } from "@/lib/supabase/server";
import { resendGeconfigureerd } from "@/lib/resend";
import { datumKort } from "@/lib/format";
import { leesFout } from "@/lib/fout";
import { MailOpstellen } from "@/components/MailOpstellen";
import { verstuurBericht } from "./acties";

export const dynamic = "force-dynamic";

type MailMap = "inbox" | "verzonden" | "concepten" | "prullenbak" | "archief";

type Email = {
  id: string;
  richting: "uitgaand" | "inkomend";
  van: string | null;
  van_naam: string | null;
  naar: string | null;
  cc: string | null;
  onderwerp: string | null;
  tekst: string | null;
  snippet: string | null;
  map: MailMap;
  gelezen: boolean;
  ster: boolean;
  heeft_bijlagen: boolean;
  status: string;
  created_at: string;
};

const MAPPEN: { key: MailMap; label: string; icoon: string }[] = [
  { key: "inbox", label: "Postvak IN", icoon: "📥" },
  { key: "verzonden", label: "Verzonden", icoon: "📤" },
  { key: "concepten", label: "Concepten", icoon: "📝" },
  { key: "archief", label: "Archief", icoon: "🗄️" },
  { key: "prullenbak", label: "Prullenbak", icoon: "🗑️" },
];

export default async function MailPagina({
  searchParams,
}: {
  searchParams: {
    fout?: string;
    verzonden?: string;
    box?: string;
    nieuw?: string;
    naar?: string;
    onderwerp?: string;
  };
}) {
  const supabase = createClient();
  const geconfigureerd = resendGeconfigureerd();
  // Actieve map; standaard Postvak IN.
  const geldig = MAPPEN.map((m) => m.key);
  const actieveMap = (geldig.includes(searchParams.box as MailMap)
    ? searchParams.box
    : "inbox") as MailMap;
  // Opstelmodus ook openen als er een 'naar' meekomt (vanuit 'Mail deze klant').
  const opstellen = searchParams.nieuw === "1" || Boolean(searchParams.naar);

  let emails: Email[] = [];
  let klanten: { id: string; bedrijf: string; email: string | null }[] = [];
  let schemaOntbreekt = false;
  let foutmelding = "";
  try {
    const { data, error } = await supabase
      .from("emails")
      .select(
        "id, richting, van, van_naam, naar, onderwerp, snippet, map, gelezen, ster, heeft_bijlagen, status, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    emails = (data ?? []) as Email[];
  } catch (e) {
    schemaOntbreekt = true;
    foutmelding = leesFout(e);
  }
  try {
    const { data } = await supabase
      .from("klanten")
      .select("id, bedrijf, email")
      .order("bedrijf");
    klanten = data ?? [];
  } catch {
    /* klanten-tabel nog niet aanwezig */
  }

  const inMap = (m: MailMap) => emails.filter((e) => (e.map ?? "inbox") === m);
  const ongelezen = inMap("inbox").filter((e) => !e.gelezen).length;
  const aantalPerMap = Object.fromEntries(
    MAPPEN.map((m) => [m.key, inMap(m.key).length]),
  ) as Record<MailMap, number>;

  const zichtbaar = inMap(actieveMap);

  return (
    <>
      <PaginaKop
        titel="E-mail"
        actie={
          opstellen ? (
            <Link
              href="/mail"
              className="rounded-lg border border-navy/20 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5"
            >
              ← Naar inbox
            </Link>
          ) : (
            <Link
              href="/mail?nieuw=1"
              className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
            >
              + Nieuwe e-mail
            </Link>
          )
        }
      />

      <section className="mb-6 grid grid-cols-3 gap-4">
        <KpiKaart label="Ongelezen" waarde={String(ongelezen)} href="/mail" />
        <KpiKaart label="Verzonden" waarde={String(aantalPerMap.verzonden)} href="/mail?box=verzonden" />
        <KpiKaart label="Concepten" waarde={String(aantalPerMap.concepten)} href="/mail?box=concepten" />
      </section>

      {searchParams.verzonden && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          E-mail verzonden.
        </p>
      )}
      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">
          {searchParams.fout}
        </p>
      )}

      {!geconfigureerd && (
        <div className="mb-6 rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Resend nog niet geconfigureerd</p>
          <p className="mt-1 text-navy/70">
            Zet <code>RESEND_API_KEY</code> in Vercel en redeploy. Verifieer het domein{" "}
            <code>viesa-automations.nl</code> in Resend.
          </p>
        </div>
      )}

      {!opstellen && !schemaOntbreekt && (
        <nav className="mb-4 flex flex-wrap gap-1">
          {MAPPEN.map((m) => {
            const actief = m.key === actieveMap;
            return (
              <Link
                key={m.key}
                href={m.key === "inbox" ? "/mail" : `/mail?box=${m.key}`}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium ${
                  actief
                    ? "bg-navy text-white"
                    : "border border-navy/15 text-navy hover:bg-navy/5"
                }`}
              >
                <span aria-hidden>{m.icoon}</span>
                {m.label}
                {aantalPerMap[m.key] > 0 && (
                  <span className={`text-xs ${actief ? "text-white/70" : "text-navy/40"}`}>
                    {aantalPerMap[m.key]}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      )}

      {opstellen ? (
        /* Opstellen-scherm */
        <Kaart>
          <p className="mb-3 text-sm font-medium text-navy">Nieuw bericht</p>
          <MailOpstellen
            verstuurActie={verstuurBericht}
            geconfigureerd={geconfigureerd}
            klanten={klanten}
            initieelNaar={searchParams.naar ?? ""}
            initieelOnderwerp={searchParams.onderwerp ?? ""}
          />
        </Kaart>
      ) : schemaOntbreekt ? (
        <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Datamodel nog niet actief</p>
          <p className="mt-1 text-navy/70">Voer 0013_emails.sql uit in de Supabase SQL Editor.</p>
          {foutmelding && (
            <p className="mt-2 font-mono text-xs text-navy/50">Details: {foutmelding}</p>
          )}
        </div>
      ) : zichtbaar.length === 0 ? (
        <LegeStaat
          titel={`Geen e-mails in ${MAPPEN.find((m) => m.key === actieveMap)?.label.toLowerCase()}`}
          omschrijving="Klik op '+ Nieuwe e-mail' om je eerste bericht te versturen."
        />
      ) : (
        /* Berichtenlijst */
        <Kaart className="p-0">
          <ul>
            {zichtbaar.map((e, i) => {
              const uit = e.richting === "uitgaand";
              const ongelezenRij = !e.gelezen && !uit;
              const afzender = uit
                ? `Aan ${e.naar ?? "—"}`
                : `Van ${e.van_naam ?? e.van ?? "—"}`;
              return (
                <li key={e.id} className={i > 0 ? "border-t border-navy/10" : ""}>
                  <Link
                    href={`/mail/${e.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-navy/[0.02] sm:px-5"
                  >
                    <span
                      aria-hidden
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        ongelezenRij ? "bg-oranje" : "bg-transparent"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={`truncate text-sm text-navy ${
                            ongelezenRij ? "font-semibold" : "font-medium"
                          }`}
                        >
                          {e.onderwerp ?? "(geen onderwerp)"}
                        </p>
                        {e.ster && <span className="shrink-0 text-oranje" aria-label="Ster">★</span>}
                        {e.heeft_bijlagen && (
                          <span className="shrink-0 text-navy/40" aria-label="Bijlage">📎</span>
                        )}
                      </div>
                      <p className="truncate text-xs text-navy/50">
                        {afzender}
                        {e.snippet ? ` — ${e.snippet}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-navy/40">{datumKort(e.created_at)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Kaart>
      )}
    </>
  );
}
