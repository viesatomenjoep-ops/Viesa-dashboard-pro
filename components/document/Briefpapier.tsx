import { type ReactNode } from "react";
import Image from "next/image";
import { BEDRIJF } from "@/lib/bedrijf";

/**
 * Viesa-briefpapier (A4) met logo + NAW-gegevens. Gebruikt voor de PDF-weergave
 * van offertes en facturen. Print-vriendelijk (zie .brief-stijlen in globals.css).
 */
export function Briefpapier({
  documenttitel,
  documentnummer,
  klant,
  datumRegel,
  children,
}: {
  documenttitel: string;
  documentnummer: string;
  klant?: string | null;
  datumRegel?: string;
  children: ReactNode;
}) {
  return (
    <div className="brief mx-auto bg-white text-navy">
      {/* Briefhoofd */}
      <header className="flex items-start justify-between gap-6 border-b border-navy/15 pb-6">
        <div className="flex items-center gap-4">
          <Image src={BEDRIJF.logo} width={64} height={71} alt="Viesa" priority />
          <div>
            <div className="text-xl font-semibold text-navy">{BEDRIJF.naam}</div>
            <div className="text-sm text-navy/60">
              {BEDRIJF.straat}
              <br />
              {BEDRIJF.postcode} {BEDRIJF.plaats}
            </div>
          </div>
        </div>
        <div className="text-right text-sm text-navy/60">
          <div>{BEDRIJF.email}</div>
          <div>{BEDRIJF.telefoon}</div>
          <div className="mt-1">BTW: {BEDRIJF.btw}</div>
        </div>
      </header>

      {/* Documentkop */}
      <div className="mt-8 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-navy">{documenttitel}</h1>
          <div className="mt-1 text-sm text-navy/60">Nr. {documentnummer}</div>
          {datumRegel && (
            <div className="text-sm text-navy/60">{datumRegel}</div>
          )}
        </div>
        {klant && (
          <div className="rounded-lg bg-achtergrond px-4 py-3 text-sm">
            <div className="text-navy/50">Aan</div>
            <div className="font-medium text-navy">{klant}</div>
          </div>
        )}
      </div>

      {/* Inhoud */}
      <div className="mt-8">{children}</div>

      {/* Voettekst */}
      <footer className="mt-12 border-t border-navy/15 pt-4 text-xs text-navy/50">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            {BEDRIJF.naam} · {BEDRIJF.straat}, {BEDRIJF.postcode} {BEDRIJF.plaats}
          </span>
          <span>
            {BEDRIJF.email} · {BEDRIJF.telefoon}
          </span>
        </div>
        <div className="mt-1">
          BTW {BEDRIJF.btw} · {BEDRIJF.contactpersonen.join(" · ")}
        </div>
      </footer>
    </div>
  );
}
