import { PaginaKop } from "@/components/ui/PaginaKop";
import { KpiKaart } from "@/components/ui/KpiKaart";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { createClient } from "@/lib/supabase/server";
import { resendGeconfigureerd } from "@/lib/resend";
import { BEDRIJF } from "@/lib/bedrijf";
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
  searchParams: { fout?: string; verzonden?: string };
}) {
  const supabase = createClient();
  const geconfigureerd = resendGeconfigureerd();

  let emails: Email[] = [];
  let schemaOntbreekt = false;
  let foutmelding = "";
  try {
    const { data, error } = await supabase
      .from("emails")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    emails = (data ?? []) as Email[];
  } catch (e) {
    schemaOntbreekt = true;
    foutmelding = leesFout(e);
  }

  const uitgaand = emails.filter((e) => e.richting === "uitgaand").length;
  const inkomend = emails.filter((e) => e.richting === "inkomend").length;

  return (
    <>
      <PaginaKop
        titel="E-mail"
        omschrijving={`Verstuur en bewaar e-mails namens ${BEDRIJF.email}.`}
      />

      <section className="mb-8 grid grid-cols-3 gap-4">
        <KpiKaart label="Totaal" waarde={String(emails.length)} />
        <KpiKaart label="Verzonden" waarde={String(uitgaand)} />
        <KpiKaart label="Ontvangen" waarde={String(inkomend)} />
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
            Zet <code>RESEND_API_KEY</code> in Vercel (en <code>.env.local</code>) en
            redeploy. Verifieer het domein <code>viesa-automations.nl</code> in Resend.
          </p>
        </div>
      )}

      {/* Nieuw bericht */}
      <div className="mb-8">
        <Kaart>
          <p className="mb-3 text-sm font-medium text-navy">Nieuw bericht</p>
          <MailOpstellen verstuurActie={verstuurBericht} geconfigureerd={geconfigureerd} />
        </Kaart>
      </div>

      {/* Log */}
      {schemaOntbreekt ? (
        <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Datamodel nog niet actief</p>
          <p className="mt-1 text-navy/70">Voer 0013_emails.sql uit in de Supabase SQL Editor.</p>
          {foutmelding && (
            <p className="mt-2 font-mono text-xs text-navy/50">Details: {foutmelding}</p>
          )}
        </div>
      ) : emails.length === 0 ? (
        <LegeStaat titel="Nog geen e-mails" omschrijving="Verstuur hierboven je eerste bericht." />
      ) : (
        <Kaart className="p-0">
          <ul>
            {emails.map((e, i) => (
              <li
                key={e.id}
                className={`flex items-center justify-between gap-4 px-5 py-3 ${
                  i > 0 ? "border-t border-navy/10" : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Badge toon={e.richting === "uitgaand" ? "navy" : "groen"}>
                    {e.richting === "uitgaand" ? "Verzonden" : "Ontvangen"}
                  </Badge>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-navy">
                      {e.onderwerp ?? "(geen onderwerp)"}
                    </p>
                    <p className="truncate text-xs text-navy/50">
                      {e.richting === "uitgaand" ? `Aan ${e.naar ?? "—"}` : `Van ${e.van ?? "—"}`}
                    </p>
                  </div>
                </div>
                <span className="hidden shrink-0 text-xs text-navy/40 sm:inline">
                  {datumKort(e.created_at)}
                </span>
              </li>
            ))}
          </ul>
        </Kaart>
      )}
    </>
  );
}
