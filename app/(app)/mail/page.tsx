import Link from "next/link";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { KpiKaart } from "@/components/ui/KpiKaart";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { createClient } from "@/lib/supabase/server";
import { resendGeconfigureerd } from "@/lib/resend";
import { datumKort } from "@/lib/format";
import { leesFout } from "@/lib/fout";
import { MailOpstellen } from "@/components/MailOpstellen";
import { verstuurBericht } from "./acties";

export const dynamic = "force-dynamic";

type Email = {
  id: string;
  richting: "uitgaand" | "inkomend";
  van: string | null;
  naar: string | null;
  onderwerp: string | null;
  tekst: string | null;
  status: string;
  created_at: string;
};

export default async function MailPagina({
  searchParams,
}: {
  searchParams: { fout?: string; verzonden?: string; box?: string; nieuw?: string };
}) {
  const supabase = createClient();
  const geconfigureerd = resendGeconfigureerd();
  const box = searchParams.box; // "verzonden" | "inkomend" | undefined (alles)
  const opstellen = searchParams.nieuw === "1";

  let emails: Email[] = [];
  let klanten: { id: string; bedrijf: string; email: string | null }[] = [];
  let schemaOntbreekt = false;
  let foutmelding = "";
  try {
    const { data, error } = await supabase
      .from("emails")
      .select("*")
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

  const uitgaand = emails.filter((e) => e.richting === "uitgaand").length;
  const inkomend = emails.filter((e) => e.richting === "inkomend").length;

  const zichtbaar = emails.filter((e) => {
    if (box === "verzonden") return e.richting === "uitgaand";
    if (box === "inkomend") return e.richting === "inkomend";
    return true;
  });

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

      <section className="mb-8 grid grid-cols-3 gap-4">
        <KpiKaart label="Totaal" waarde={String(emails.length)} href="/mail" />
        <KpiKaart label="Verzonden" waarde={String(uitgaand)} href="/mail?box=verzonden" />
        <KpiKaart label="Ontvangen" waarde={String(inkomend)} href="/mail?box=inkomend" />
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

      {opstellen ? (
        /* Opstellen-scherm */
        <Kaart>
          <p className="mb-3 text-sm font-medium text-navy">Nieuw bericht</p>
          <MailOpstellen
            verstuurActie={verstuurBericht}
            geconfigureerd={geconfigureerd}
            klanten={klanten}
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
          titel="Geen e-mails"
          omschrijving="Klik op '+ Nieuwe e-mail' om je eerste bericht te versturen."
        />
      ) : (
        /* Inbox */
        <Kaart className="p-0">
          <ul>
            {zichtbaar.map((e, i) => (
              <li key={e.id} className={i > 0 ? "border-t border-navy/10" : ""}>
                <Link
                  href={`/mail/${e.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-navy/[0.02] sm:px-5"
                >
                  <Badge toon={e.richting === "uitgaand" ? "navy" : "groen"}>
                    {e.richting === "uitgaand" ? "Verzonden" : "Ontvangen"}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-navy">
                      {e.onderwerp ?? "(geen onderwerp)"}
                    </p>
                    <p className="truncate text-xs text-navy/50">
                      {e.richting === "uitgaand" ? `Aan ${e.naar ?? "—"}` : `Van ${e.van ?? "—"}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-navy/40">{datumKort(e.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Kaart>
      )}
    </>
  );
}
