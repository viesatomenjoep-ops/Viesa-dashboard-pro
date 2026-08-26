"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PhoneOutgoing } from "lucide-react";
import { ZoekKies, type Optie } from "@/components/ZoekKies";
import { voegLeadToeAanBellijst } from "./acties";

export type BellijstKandidaat = { id: string; bedrijf: string; plaats: string | null };

/**
 * Handmatig een lead op de bellijst zetten — naast de AI-suggesties hierboven,
 * niet als vervanging ervan. Zoek op bedrijfsnaam en kies er één; alleen leads
 * die nog niet op de lijst staan worden aangeboden.
 */
export function HandmatigToevoegen({ kandidaten }: { kandidaten: BellijstKandidaat[] }) {
  const router = useRouter();
  const [zoek, setZoek] = useState("");
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, startOvergang] = useTransition();

  if (kandidaten.length === 0) return null;

  const opties: Optie[] = kandidaten.map((k) => ({
    waarde: k.bedrijf,
    sub: k.plaats ?? undefined,
  }));

  function kies(o: Optie) {
    const gekozen = kandidaten.find((k) => k.bedrijf === o.waarde && (k.plaats ?? undefined) === o.sub);
    if (!gekozen) return;
    setFout(null);
    startOvergang(async () => {
      const res = await voegLeadToeAanBellijst(gekozen.id);
      if (res.ok) {
        setZoek("");
        router.refresh();
      } else {
        setFout(res.fout ?? "Toevoegen mislukt.");
      }
    });
  }

  return (
    <div className="mb-6 rounded-xl border border-navy/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-navy/5 text-navy">
          <PhoneOutgoing size={18} />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-navy">Zelf een lead toevoegen</h2>
          <p className="text-xs text-navy/50">
            Weet je al wie je wilt bellen? Zoek &apos;m op en zet &apos;m zelf op de lijst.
          </p>
        </div>
      </div>
      <div className="mt-3 max-w-sm">
        <ZoekKies
          value={zoek}
          onChange={setZoek}
          onKies={kies}
          opties={opties}
          placeholder="Zoek op bedrijfsnaam…"
          className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy disabled:opacity-60"
        />
      </div>
      {bezig && <p className="mt-2 text-xs text-navy/40">Bezig met toevoegen…</p>}
      {fout && <p className="mt-2 text-xs text-red-600">{fout}</p>}
    </div>
  );
}
