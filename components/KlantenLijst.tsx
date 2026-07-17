"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Kaart } from "@/components/ui/Kaart";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { klantTypeToon, klantTypeLabel, type Klant } from "@/lib/klanten";

/**
 * Klantenlijst voor in een vol scherm — met een zoekveld bovenaan (zoekt op
 * bedrijf, stad en e-mail). Rijen linken naar het klantdetail.
 */
export function KlantenLijst({ klanten }: { klanten: Klant[] }) {
  const [q, setQ] = useState("");
  const term = q.toLowerCase().trim();
  const zichtbaar = term
    ? klanten.filter((k) =>
        `${k.bedrijf} ${k.stad ?? ""} ${k.email ?? ""}`.toLowerCase().includes(term),
      )
    : klanten;

  return (
    <div>
      <div className="relative mb-3">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Zoek op bedrijf, stad of e-mail…"
          className="w-full rounded-lg border border-navy/20 py-2 pl-9 pr-3 text-sm text-navy outline-none focus:border-navy"
        />
      </div>

      {zichtbaar.length === 0 ? (
        <LegeStaat titel="Geen klanten" omschrijving="Geen klanten gevonden voor deze zoekopdracht." />
      ) : (
        <Kaart className="p-0">
          <ul>
            {zichtbaar.map((k, i) => (
              <li key={k.id} className={i > 0 ? "border-t border-navy/10" : ""}>
                <Link
                  href={`/klanten/${k.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-navy/[0.02]"
                >
                  <Avatar naam={k.bedrijf} />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-navy">{k.bedrijf}</span>
                    <span className="block truncate text-xs text-navy/50">
                      {k.stad ?? "—"}
                      {k.email ? ` · ${k.email}` : ""}
                    </span>
                  </div>
                  <Badge toon={klantTypeToon(k.type)}>{klantTypeLabel(k.type)}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Kaart>
      )}
    </div>
  );
}
