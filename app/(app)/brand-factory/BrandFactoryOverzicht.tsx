"use client";

import { useState } from "react";

type Merk = {
  merk_id: string;
  slug: string;
  naam: string;
  concepten: number;
  renders: number;
  batches: number;
  laatste_render: string | null;
};

type Render = {
  id: string;
  variant: string;
  bestand_url: string | null;
  type: string;
  gerenderd_op: string;
  concept: any;
};

export function BrandFactoryOverzicht({
  merken,
  recenteRenders,
}: {
  merken: Merk[];
  recenteRenders: Render[];
}) {
  const [tab, setTab] = useState<"merken" | "recent">("merken");

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(["merken", "recent"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t
                ? "bg-white text-[#19445B] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "merken" ? "Merken" : "Recente renders"}
          </button>
        ))}
      </div>

      {/* Merken-tabel */}
      {tab === "merken" && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="px-4 py-3 font-medium">Merk</th>
                <th className="px-4 py-3 font-medium text-right">Concepten</th>
                <th className="px-4 py-3 font-medium text-right">Renders</th>
                <th className="px-4 py-3 font-medium text-right">Batches</th>
                <th className="px-4 py-3 font-medium text-right">Laatste render</th>
              </tr>
            </thead>
            <tbody>
              {merken.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    Nog geen merken. Voeg een merk toe in het Brand Factory-project
                    op je Mac en synchroniseer via de API.
                  </td>
                </tr>
              )}
              {merken.map((m) => (
                <tr key={m.merk_id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#19445B] flex items-center justify-center text-white text-xs font-bold">
                        {m.naam.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-medium text-[#19445B]">{m.naam}</span>
                        <span className="text-xs text-gray-400 ml-2 font-mono">{m.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{m.concepten}</td>
                  <td className="px-4 py-3 text-right font-mono">{m.renders.toLocaleString("nl-NL")}</td>
                  <td className="px-4 py-3 text-right font-mono">{m.batches}</td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {m.laatste_render
                      ? new Date(m.laatste_render).toLocaleDateString("nl-NL", {
                          day: "numeric",
                          month: "short",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {merken.length > 0 && (
            <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-50">
              {merken.length} merken · {merken.reduce((s, m) => s + m.renders, 0).toLocaleString("nl-NL")} totale renders
            </div>
          )}
        </div>
      )}

      {/* Recente renders grid */}
      {tab === "recent" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {recenteRenders.length === 0 && (
            <p className="col-span-full text-center text-gray-400 py-12">
              Nog geen renders. Draai je eerste batch lokaal en synchroniseer.
            </p>
          )}
          {recenteRenders.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-[#19445B]/30 transition-colors group"
            >
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                {r.bestand_url ? (
                  r.type === "video" ? (
                    <video
                      src={r.bestand_url}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                      onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                      onMouseLeave={(e) => {
                        const v = e.target as HTMLVideoElement;
                        v.pause();
                        v.currentTime = 0;
                      }}
                    />
                  ) : (
                    <img
                      src={r.bestand_url}
                      alt={r.variant}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )
                ) : (
                  <span className="text-gray-300 text-xs text-center px-2">
                    {r.variant}
                  </span>
                )}
              </div>
              <div className="px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-[#19445B]">
                    {r.concept?.key || "?"}
                  </span>
                  <span className="text-xs text-gray-400">{r.variant}</span>
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {typeof r.concept?.headline === "object"
                    ? r.concept.headline.nl || Object.values(r.concept.headline)[0]
                    : r.concept?.headline || ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
