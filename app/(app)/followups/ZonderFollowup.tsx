"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { euro } from "@/lib/format";
import { overDagen, type LeadZonderFollowup } from "@/lib/followups";
import { planFollowupVoorLead } from "./acties";

/**
 * Leads die nergens meer op de rol staan.
 *
 * Dit is het stille lek in elke opvolging: een lead waarvan de laatste
 * follow-up is afgerond en waar niets voor in de plaats kwam. Die verdwijnt uit
 * beeld zonder dat iemand besloot te stoppen. Hier staan ze weer, met één klik
 * om ze terug in de cyclus te zetten.
 */
export function ZonderFollowup({ leads }: { leads: LeadZonderFollowup[] }) {
  const [gepland, setGepland] = useState<Set<string>>(new Set());
  const [fout, setFout] = useState<string | null>(null);
  const [bezig, start] = useTransition();

  function plan(leadId: string, dagen: number) {
    setFout(null);
    start(async () => {
      const r = await planFollowupVoorLead(leadId, overDagen(dagen));
      if (r.ok) setGepland((v) => new Set(v).add(leadId));
      else setFout(r.fout ?? "Plannen mislukt.");
    });
  }

  if (leads.length === 0) {
    return (
      <p className="px-4 py-4 text-sm text-navy/50 sm:px-5">
        Elke open lead staat ergens op de rol. Zo hoort het.
      </p>
    );
  }

  return (
    <>
      <ul className="divide-y divide-navy/5">
        {leads.map((l) => {
          const klaar = gepland.has(l.id);
          return (
            <li
              key={l.id}
              className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5 ${
                klaar ? "opacity-50" : ""
              }`}
            >
              <div className="min-w-0">
                <Link
                  href={`/leads/${l.id}`}
                  className="truncate text-sm font-medium text-navy hover:underline"
                >
                  {l.bedrijf ?? "Onbekend bedrijf"}
                </Link>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-navy/50">
                  {l.status && <span>{l.status}</span>}
                  {typeof l.score === "number" && <span>score {l.score}</span>}
                  {Number(l.verwachte_waarde ?? 0) > 0 && (
                    <span>{euro(Number(l.verwachte_waarde))}</span>
                  )}
                  <span className="text-navy/35">
                    {l.laatst_gebeld ? "stil sinds laatste gesprek" : "nog nooit gebeld"}
                  </span>
                </div>
              </div>

              {klaar ? (
                <span className="text-xs font-medium text-emerald-600">Ingepland</span>
              ) : (
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-xs text-navy/40">
                    <CalendarPlus size={12} /> Opvolgen:
                  </span>
                  {[
                    { label: "morgen", dagen: 1 },
                    { label: "+1 wk", dagen: 7 },
                    { label: "+1 mnd", dagen: 30 },
                  ].map((k) => (
                    <button
                      key={k.dagen}
                      type="button"
                      onClick={() => plan(l.id, k.dagen)}
                      disabled={bezig}
                      className="rounded-lg border border-navy/15 px-2 py-1 text-xs font-medium text-navy hover:bg-navy/5 disabled:opacity-50"
                    >
                      {k.label}
                    </button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {fout && <p className="px-4 py-2 text-xs text-oranje sm:px-5">{fout}</p>}
    </>
  );
}
