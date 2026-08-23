import Link from "next/link";
import {
  Archive,
  FileEdit,
  Inbox,
  Paperclip,
  Send,
  Star,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { StatKaart } from "@/components/ui/StatKaart";
import { Kaart } from "@/components/ui/Kaart";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import { resendGeconfigureerd } from "@/lib/resend";
import { datumKort } from "@/lib/format";
import { leesFout } from "@/lib/fout";
import { MailOpstellen, type KlantOptie } from "@/components/MailOpstellen";
import { VerzondenMelding } from "@/components/VerzondenMelding";
import { MailLeesPaneel } from "@/components/MailLeesPaneel";
import { MailTriage } from "./MailTriage";
import { VolScherm } from "@/components/ui/VolScherm";
import {
  verstuurBericht,
  wisselSter,
  verplaatsMail,
  verwijderMail,
  markeerGelezen,
} from "./acties";

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
  snippet: string | null;
  map: MailMap;
  gelezen: boolean;
  ster: boolean;
  heeft_bijlagen: boolean;
  status: string;
  created_at: string;
};

type Bijlage = { id: string; bestandsnaam: string; grootte: number | null; url: string | null };

const MAPPEN: { key: MailMap; label: string; icoon: LucideIcon }[] = [
  { key: "inbox", label: "Postvak IN", icoon: Inbox },
  { key: "verzonden", label: "Verzonden", icoon: Send },
  { key: "concepten", label: "Concepten", icoon: FileEdit },
  { key: "archief", label: "Archief", icoon: Archive },
  { key: "prullenbak", label: "Prullenbak", icoon: Trash2 },
];

const LIJST_KOLOMMEN =
  "id, richting, van, van_naam, naar, onderwerp, snippet, map, gelezen, ster, heeft_bijlagen, status, created_at";

function datumLang(iso: string): string {
  return new Date(iso).toLocaleString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function MailPagina({
  searchParams,
}: {
  searchParams: {
    fout?: string;
    verzonden?: string;
    box?: string;
    sel?: string;
    nieuw?: string;
    naar?: string;
    onderwerp?: string;
  };
}) {
  const supabase = createClient();
  const geconfigureerd = resendGeconfigureerd();
  const geldig = MAPPEN.map((m) => m.key);
  const actieveMap = (geldig.includes(searchParams.box as MailMap)
    ? searchParams.box
    : "inbox") as MailMap;
  // Compose opent nu als vol scherm; ?nieuw=1 of een reply (?naar=) opent het direct.
  const opstellen = searchParams.nieuw === "1" || Boolean(searchParams.naar);
  const selId = searchParams.sel ?? null;

  let emails: Email[] = [];
  let klanten: KlantOptie[] = [];
  let schemaOntbreekt = false;
  let foutmelding = "";
  try {
    const { data, error } = await supabase
      .from("emails")
      .select(LIJST_KOLOMMEN)
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
      .select("id, bedrijf, email, contact_naam, voornaam, achternaam, website, stad, telefoon")
      .order("bedrijf");
    klanten = data ?? [];
  } catch {
    /* klanten-tabel nog niet aanwezig */
  }
  // E-mailsjablonen uit de sjablonen-machine (best effort — tabel kan ontbreken).
  let mailSjablonen: { id: string; naam: string; onderwerp: string | null; inhoud_html: string }[] = [];
  try {
    const { data } = await supabase
      .from("sjablonen")
      .select("id, naam, onderwerp, inhoud_html")
      .eq("type", "email")
      .order("naam");
    mailSjablonen = data ?? [];
  } catch {
    /* sjablonen-tabel nog niet aanwezig */
  }

  const inMap = (m: MailMap) => emails.filter((e) => (e.map ?? "inbox") === m);
  const ongelezen = inMap("inbox").filter((e) => !e.gelezen).length;
  const aantalPerMap = Object.fromEntries(
    MAPPEN.map((m) => [m.key, inMap(m.key).length]),
  ) as Record<MailMap, number>;
  const zichtbaar = inMap(actieveMap);

  // Geselecteerd bericht (volledige inhoud) + bijlagen ophalen.
  let sel: Email | null = null;
  let bijlagen: Bijlage[] = [];
  if (selId && !schemaOntbreekt) {
    const { data: selData } = await supabase.from("emails").select("*").eq("id", selId).maybeSingle();
    sel = (selData as Email) ?? null;
    if (sel) {
      if (sel.richting === "inkomend" && !sel.gelezen) {
        await supabase.from("emails").update({ gelezen: true }).eq("id", sel.id);
        sel.gelezen = true;
        const rij = emails.find((e) => e.id === sel!.id);
        if (rij) rij.gelezen = true;
      }
      try {
        const { data: rijen } = await supabase
          .from("email_bijlagen")
          .select("id, bestandsnaam, grootte, storage_pad")
          .eq("email_id", sel.id);
        bijlagen = await Promise.all(
          (rijen ?? []).map(async (b) => {
            const { data: signed } = await supabase.storage
              .from("email-bijlagen")
              .createSignedUrl(b.storage_pad as string, 3600);
            return {
              id: b.id as string,
              bestandsnaam: b.bestandsnaam as string,
              grootte: (b.grootte as number) ?? null,
              url: signed?.signedUrl ?? null,
            };
          }),
        );
      } catch {
        /* email_bijlagen-tabel nog niet aanwezig */
      }
    }
  }

  const lijstHref = (id: string) =>
    actieveMap === "inbox" ? `/mail?sel=${id}` : `/mail?box=${actieveMap}&sel=${id}`;

  return (
    <>
      <PaginaKop
        titel="E-mail"
        actie={
          <VolScherm
            label="Nieuwe e-mail"
            titel="Nieuwe e-mail"
            breed="6xl"
            standaardOpen={opstellen}
          >
            <MailOpstellen
              verstuurActie={verstuurBericht}
              geconfigureerd={geconfigureerd}
              klanten={klanten}
              sjablonen={mailSjablonen}
              initieelNaar={searchParams.naar ?? ""}
              initieelOnderwerp={searchParams.onderwerp ?? ""}
            />
          </VolScherm>
        }
      />

      <section className="mb-6 grid grid-cols-3 gap-4">
        <StatKaart label="Ongelezen" waarde={String(ongelezen)} icoon={Inbox} toon="blauw" mobielGeenIcoon href="/mail" />
        <StatKaart
          label="Verzonden"
          waarde={String(aantalPerMap.verzonden)}
          icoon={Send}
          toon="groen"
          mobielGeenIcoon
          href="/mail?box=verzonden"
        />
        <StatKaart
          label="Concepten"
          waarde={String(aantalPerMap.concepten)}
          icoon={FileEdit}
          toon="amber"
          mobielGeenIcoon
          href="/mail?box=concepten"
        />
      </section>

      {searchParams.verzonden && <VerzondenMelding />}
      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">{searchParams.fout}</p>
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

      {schemaOntbreekt ? (
        <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Datamodel nog niet actief</p>
          <p className="mt-1 text-navy/70">Voer 0013_emails.sql uit in de Supabase SQL Editor.</p>
          {foutmelding && <p className="mt-2 font-mono text-xs text-navy/50">Details: {foutmelding}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Mappen-tabbalk met een doorlopende onderlijn; actieve map krijgt een
              accent-onderstreping — één geïntegreerd geheel over de volle breedte. */}
          <div className="-mx-1 flex gap-1 overflow-x-auto border-b border-navy/10 px-1">
            {MAPPEN.map((m) => {
              const actief = m.key === actieveMap;
              const MapIcoon = m.icoon;
              return (
                <Link
                  key={m.key}
                  href={m.key === "inbox" ? "/mail" : `/mail?box=${m.key}`}
                  className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors sm:px-4 ${
                    actief
                      ? "border-oranje text-navy"
                      : "border-transparent text-navy/55 hover:text-navy"
                  }`}
                >
                  <MapIcoon size={16} className="shrink-0" />
                  <span>{m.label}</span>
                  {aantalPerMap[m.key] > 0 && (
                    <span
                      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold ${
                        actief ? "bg-oranje/10 text-oranje" : "bg-navy/5 text-navy/50"
                      }`}
                    >
                      {aantalPerMap[m.key]}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Berichtenlijst — volle breedte, klik opent vol scherm */}
          <div>
            {zichtbaar.length === 0 ? (
              <Kaart>
                <p className="text-sm text-navy/50">
                  Geen e-mails in {MAPPEN.find((m) => m.key === actieveMap)?.label.toLowerCase()}.
                </p>
              </Kaart>
            ) : (
              <Kaart className="p-0">
                <ul>
                  {zichtbaar.map((e, i) => {
                    const uit = e.richting === "uitgaand";
                    const ongelezenRij = !e.gelezen && !uit;
                    const geselecteerd = e.id === selId;
                    const afzender = uit ? `Aan ${e.naar ?? "—"}` : `${e.van_naam ?? e.van ?? "—"}`;
                    const avatarNaam = uit ? e.naar ?? "?" : e.van_naam ?? e.van ?? "?";
                    return (
                      <li key={e.id} className={i > 0 ? "border-t border-navy/10" : ""}>
                        <Link
                          href={lijstHref(e.id)}
                          className={`flex gap-3 px-4 py-3 ${
                            geselecteerd
                              ? "border-l-2 border-oranje bg-navy/[0.03]"
                              : "border-l-2 border-transparent hover:bg-navy/[0.02]"
                          }`}
                        >
                          <Avatar naam={avatarNaam} size={36} className="mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {ongelezenRij && (
                                <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-oranje" />
                              )}
                              <span
                                className={`truncate text-sm text-navy ${
                                  ongelezenRij ? "font-semibold" : "font-medium"
                                }`}
                              >
                                {afzender}
                              </span>
                              {e.ster && (
                                <Star size={13} className="shrink-0 fill-oranje text-oranje" aria-label="Ster" />
                              )}
                              {e.heeft_bijlagen && (
                                <Paperclip size={13} className="shrink-0 text-navy/40" aria-label="Bijlage" />
                              )}
                              <span className="ml-auto shrink-0 text-xs text-navy/40">
                                {datumKort(e.created_at)}
                              </span>
                            </div>
                            <p className={`truncate text-sm ${ongelezenRij ? "font-medium text-navy" : "text-navy/80"}`}>
                              {e.onderwerp ?? "(geen onderwerp)"}
                            </p>
                            {e.snippet && <p className="truncate text-xs text-navy/45">{e.snippet}</p>}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </Kaart>
            )}
          </div>

        </div>
      )}

      {/* Leesvenster als volledig overlay-scherm (alle apparaten) */}
      {!schemaOntbreekt && sel && (
        <MailLeesPaneel sluitHref={actieveMap === "inbox" ? "/mail" : `/mail?box=${actieveMap}`}>
          <Leesvenster e={sel} bijlagen={bijlagen} />
          {sel.richting === "inkomend" && (
            <div className="mx-auto max-w-3xl">
              <MailTriage emailId={sel.id} van={sel.van} onderwerp={sel.onderwerp} />
            </div>
          )}
        </MailLeesPaneel>
      )}
    </>
  );
}

function Leesvenster({ e, bijlagen }: { e: Email; bijlagen: Bijlage[] }) {
  const uit = e.richting === "uitgaand";
  const antwoordNaar = uit ? e.naar ?? "" : e.van ?? "";
  const orig = e.onderwerp ?? "";
  const antwoordOnderwerp = /^re:/i.test(orig) ? orig : `Re: ${orig}`.trim();
  const knop = "rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-navy/5";
  return (
    <Kaart>
      <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-navy/10 pb-3">
        {antwoordNaar && (
          <Link
            href={`/mail?nieuw=1&naar=${encodeURIComponent(antwoordNaar)}&onderwerp=${encodeURIComponent(antwoordOnderwerp)}`}
            className={`${knop} border-oranje/40 text-oranje`}
          >
            ↩ Beantwoorden
          </Link>
        )}
        <form action={wisselSter.bind(null, e.id, !e.ster)}>
          <button className={`${knop} ${e.ster ? "border-oranje/40 text-oranje" : "border-navy/20 text-navy"}`}>
            {e.ster ? "★" : "☆"} Ster
          </button>
        </form>
        {!uit && (
          <form action={markeerGelezen.bind(null, e.id, false)}>
            <button className={`${knop} border-navy/20 text-navy`}>Ongelezen</button>
          </form>
        )}
        {e.map !== "archief" && e.map !== "prullenbak" && (
          <form action={verplaatsMail.bind(null, e.id, "archief")}>
            <button className={`${knop} border-navy/20 text-navy`}>Archiveren</button>
          </form>
        )}
        <form action={verwijderMail.bind(null, e.id)}>
          <button className={`${knop} border-red-200 text-red-600 hover:bg-red-50`}>
            {e.map === "prullenbak" ? "Definitief" : "Verwijderen"}
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge toon={uit ? "navy" : "groen"}>{uit ? "Verzonden" : "Ontvangen"}</Badge>
        <h1 className="text-lg font-semibold text-navy">{e.onderwerp ?? "(geen onderwerp)"}</h1>
      </div>
      <dl className="mt-3 grid gap-1 text-sm">
        <Regel dt="Van" dd={e.van_naam ?? e.van ?? "—"} />
        <Regel dt="Aan" dd={e.naar ?? "—"} />
        {e.cc && <Regel dt="Cc" dd={e.cc} />}
        <Regel dt="Datum" dd={datumLang(e.created_at)} muted />
      </dl>

      {e.html ? (
        <iframe
          title="Berichtinhoud"
          sandbox=""
          srcDoc={e.html}
          className="mt-5 h-[460px] w-full rounded-lg border border-navy/10 bg-white"
        />
      ) : (
        <div className="mt-5 whitespace-pre-wrap rounded-lg bg-achtergrond p-4 text-sm leading-relaxed text-navy">
          {e.tekst?.trim() ? e.tekst : "(geen tekstinhoud)"}
        </div>
      )}

      {bijlagen.length > 0 && (
        <div className="mt-5 border-t border-navy/10 pt-4">
          <p className="mb-2 text-sm font-medium text-navy">Bijlagen ({bijlagen.length})</p>
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
                    <span className="text-xs text-navy/40">{Math.round(b.grootte / 1024)} kB</span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Kaart>
  );
}

function Regel({ dt, dd, muted = false }: { dt: string; dd: string; muted?: boolean }) {
  return (
    <div className="flex gap-2">
      <dt className="w-14 shrink-0 text-navy/50">{dt}</dt>
      <dd className={muted ? "text-navy/70" : "text-navy"}>{dd}</dd>
    </div>
  );
}
