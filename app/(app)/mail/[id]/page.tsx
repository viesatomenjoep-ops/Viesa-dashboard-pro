import Link from "next/link";
import { notFound } from "next/navigation";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import { verwijderMail, wisselSter, verplaatsMail, markeerGelezen } from "../acties";

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
  html: string | null;
  map: MailMap;
  gelezen: boolean;
  ster: boolean;
  status: string;
  created_at: string;
};

function datumLang(iso: string): string {
  return new Date(iso).toLocaleString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function MailDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("emails")
    .select("*")
    .eq("id", params.id)
    .single();
  if (error || !data) notFound();
  const e = data as Email;
  const uit = e.richting === "uitgaand";

  // Openen = als gelezen markeren (alleen inkomende, ongelezen berichten).
  if (!uit && !e.gelezen) {
    await supabase.from("emails").update({ gelezen: true }).eq("id", e.id);
    e.gelezen = true;
  }

  const afzenderNaam = e.van_naam ?? e.van ?? "—";
  const antwoordNaar = uit ? e.naar ?? "" : e.van ?? "";
  const orig = e.onderwerp ?? "";
  const antwoordOnderwerp = /^re:/i.test(orig) ? orig : `Re: ${orig}`.trim();

  // Bijlagen ophalen (kan ontbreken als migratie 0028 nog niet is uitgevoerd).
  type Bijlage = { id: string; bestandsnaam: string; mime: string | null; grootte: number | null; url: string | null };
  let bijlagen: Bijlage[] = [];
  try {
    const { data: rijen } = await supabase
      .from("email_bijlagen")
      .select("id, bestandsnaam, mime, grootte, storage_pad")
      .eq("email_id", e.id);
    bijlagen = await Promise.all(
      (rijen ?? []).map(async (b) => {
        const { data: signed } = await supabase.storage
          .from("email-bijlagen")
          .createSignedUrl(b.storage_pad as string, 3600);
        return {
          id: b.id as string,
          bestandsnaam: b.bestandsnaam as string,
          mime: (b.mime as string) ?? null,
          grootte: (b.grootte as number) ?? null,
          url: signed?.signedUrl ?? null,
        };
      }),
    );
  } catch {
    /* email_bijlagen-tabel nog niet aanwezig */
  }

  return (
    <>
      <PaginaKop
        titel="Bericht"
        actie={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/mail"
              className="rounded-lg border border-navy/20 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5"
            >
              ← Naar inbox
            </Link>
            {antwoordNaar && (
              <Link
                href={`/mail?naar=${encodeURIComponent(antwoordNaar)}&onderwerp=${encodeURIComponent(antwoordOnderwerp)}`}
                className="rounded-lg border border-navy/20 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5"
              >
                Beantwoorden
              </Link>
            )}
            <form action={wisselSter.bind(null, e.id, !e.ster)}>
              <button
                type="submit"
                className={`rounded-lg border px-4 py-2 text-sm font-medium hover:bg-navy/5 ${
                  e.ster ? "border-oranje/40 text-oranje" : "border-navy/20 text-navy"
                }`}
              >
                {e.ster ? "★ Ster" : "☆ Ster"}
              </button>
            </form>
            {!uit && (
              <form action={markeerGelezen.bind(null, e.id, false)}>
                <button
                  type="submit"
                  className="rounded-lg border border-navy/20 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5"
                >
                  Markeer ongelezen
                </button>
              </form>
            )}
            {e.map !== "archief" && e.map !== "prullenbak" && (
              <form action={verplaatsMail.bind(null, e.id, "archief")}>
                <button
                  type="submit"
                  className="rounded-lg border border-navy/20 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5"
                >
                  Archiveren
                </button>
              </form>
            )}
            <form action={verwijderMail.bind(null, e.id)}>
              <button
                type="submit"
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                {e.map === "prullenbak" ? "Definitief verwijderen" : "Verwijderen"}
              </button>
            </form>
          </div>
        }
      />

      <Kaart>
        <div className="flex flex-wrap items-center gap-2 border-b border-navy/10 pb-4">
          <Badge toon={uit ? "navy" : "groen"}>{uit ? "Verzonden" : "Ontvangen"}</Badge>
          {e.ster && <span className="text-oranje" aria-label="Ster">★</span>}
          <h1 className="text-lg font-semibold text-navy">
            {e.onderwerp ?? "(geen onderwerp)"}
          </h1>
        </div>

        <dl className="mt-4 grid gap-1 text-sm">
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-navy/50">Van</dt>
            <dd className="text-navy">{uit ? e.van_naam ?? e.van ?? "—" : afzenderNaam}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-navy/50">Aan</dt>
            <dd className="text-navy">{uit ? e.naar ?? "—" : e.naar ?? "—"}</dd>
          </div>
          {e.cc && (
            <div className="flex gap-2">
              <dt className="w-16 shrink-0 text-navy/50">Cc</dt>
              <dd className="text-navy">{e.cc}</dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-navy/50">Datum</dt>
            <dd className="text-navy/70">{datumLang(e.created_at)}</dd>
          </div>
        </dl>

        {/* Body: HTML wordt in een afgeschermde iframe getoond (geen scripts,
            geen toegang tot de app). Zonder HTML tonen we de platte tekst. */}
        {e.html ? (
          <iframe
            title="Berichtinhoud"
            sandbox=""
            srcDoc={e.html}
            className="mt-6 h-[520px] w-full rounded-lg border border-navy/10 bg-white"
          />
        ) : (
          <div className="mt-6 whitespace-pre-wrap rounded-lg bg-achtergrond p-4 text-sm leading-relaxed text-navy">
            {e.tekst?.trim() ? e.tekst : "(geen tekstinhoud)"}
          </div>
        )}

        {bijlagen.length > 0 && (
          <div className="mt-6 border-t border-navy/10 pt-4">
            <p className="mb-2 text-sm font-medium text-navy">
              Bijlagen ({bijlagen.length})
            </p>
            <ul className="flex flex-wrap gap-2">
              {bijlagen.map((b) => (
                <li key={b.id}>
                  <a
                    href={b.url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-navy/15 px-3 py-2 text-sm text-navy hover:bg-navy/5"
                  >
                    <span aria-hidden>📎</span>
                    <span className="truncate">{b.bestandsnaam}</span>
                    {b.grootte != null && (
                      <span className="text-xs text-navy/40">
                        {Math.round(b.grootte / 1024)} kB
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Kaart>
    </>
  );
}
