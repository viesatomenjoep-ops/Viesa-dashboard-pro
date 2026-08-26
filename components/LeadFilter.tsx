"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Mail, Play, Search } from "lucide-react";
import type { AiLead } from "./LeadDirectory";

/**
 * De filterbare tabel van de Lead Directory.
 *
 * Filteren gebeurt in de browser op de al opgehaalde lijst: bij een paar
 * honderd leads is dat direct, en het scheelt een netwerkronde per toetsaanslag.
 * Groeit de lijst naar duizenden, dan hoort dit naar de server te verhuizen.
 */
export function LeadFilter({ leads }: { leads: AiLead[] }) {
  const [zoek, setZoek] = useState("");
  const [niche, setNiche] = useState("");

  const niches = useMemo(
    () =>
      Array.from(
        new Set(leads.map((l) => l.niche).filter((n): n is string => Boolean(n))),
      ).sort((a, b) => a.localeCompare(b, "nl")),
    [leads],
  );

  const term = zoek.toLowerCase().trim();
  const gevonden = leads.filter((l) => {
    if (niche && l.niche !== niche) return false;
    if (!term) return true;
    return `${l.company_name} ${l.website ?? ""} ${l.niche ?? ""} ${l.contact_email ?? ""}`
      .toLowerCase()
      .includes(term);
  });

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy/30"
          />
          <input
            value={zoek}
            onChange={(e) => setZoek(e.target.value)}
            placeholder={`Zoek in ${leads.length} leads — bedrijf, website of niche`}
            className="w-full rounded-lg border border-navy/20 py-2 pl-9 pr-3 text-sm text-navy outline-none focus:border-navy"
          />
        </div>
        {niches.length > 0 && (
          <select
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
          >
            <option value="">Alle niches</option>
            {niches.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem]">
            <thead>
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-navy/40">
                <th className="px-4 py-3">Bedrijf</th>
                <th className="px-4 py-3">Niche</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3 text-right">Actie</th>
              </tr>
            </thead>
            <tbody>
              {gevonden.map((l) => {
                const auditHref = `/audit?url=${encodeURIComponent(
                  l.website ?? "",
                )}&niche=${encodeURIComponent(l.niche ?? "")}`;
                return (
                  <tr key={l.id} className="border-t border-navy/5">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-navy">{l.company_name}</p>
                      {l.website && (
                        <a
                          href={
                            l.website.startsWith("http") ? l.website : `https://${l.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-navy/50 hover:text-navy hover:underline"
                        >
                          {l.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {l.niche ? (
                        <span className="inline-block rounded-full bg-navy/5 px-2.5 py-1 text-xs text-navy/70">
                          {l.niche}
                        </span>
                      ) : (
                        <span className="text-xs text-navy/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {l.contact_email ? (
                        <a
                          href={`mailto:${l.contact_email}`}
                          className="inline-flex items-center gap-1.5 text-xs text-navy/60 hover:text-navy hover:underline"
                        >
                          <Mail size={12} /> {l.contact_email}
                        </a>
                      ) : (
                        <span className="text-xs text-navy/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={auditHref}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy/90"
                      >
                        <Play size={12} /> Draai audit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {gevonden.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-navy/40">
            Geen leads gevonden voor deze filters.
          </p>
        )}
      </div>

      {gevonden.length !== leads.length && (
        <p className="mt-2 text-xs text-navy/40">
          {gevonden.length} van {leads.length} leads.
        </p>
      )}
    </div>
  );
}
