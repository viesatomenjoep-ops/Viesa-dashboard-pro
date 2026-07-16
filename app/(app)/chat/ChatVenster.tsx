"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import {
  CHAT_AFZENDERS,
  chatAfzenderLabel,
  type ChatAfzender,
  type ChatBericht,
} from "@/lib/chat";

function tijd(iso: string): string {
  return new Date(iso).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  });
}

/**
 * Chatvenster voor het gedeelde teamgesprek. Je kiest bovenaan wie je bent
 * (Tom/Joep) — die keuze onthouden we lokaal. Eigen berichten staan rechts in
 * teal, die van de ander links in grijs.
 */
export function ChatVenster({
  berichten,
  stuurActie,
}: {
  berichten: ChatBericht[];
  stuurActie: (formData: FormData) => Promise<void>;
}) {
  const [ikBen, setIkBen] = useState<ChatAfzender>("tom");
  const [tekst, setTekst] = useState("");
  const bodemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opgeslagen = localStorage.getItem("chat-ikben");
    if (opgeslagen === "tom" || opgeslagen === "joep") setIkBen(opgeslagen);
  }, []);

  useEffect(() => {
    bodemRef.current?.scrollIntoView({ block: "end" });
  }, [berichten.length]);

  function kies(a: ChatAfzender) {
    setIkBen(a);
    localStorage.setItem("chat-ikben", a);
  }

  async function verstuur(formData: FormData) {
    await stuurActie(formData);
    setTekst("");
  }

  return (
    <div className="flex h-[calc(100vh-260px)] min-h-[420px] flex-col rounded-xl border border-navy/10 bg-white shadow-sm">
      {/* Kop — wie ben ik? */}
      <div className="flex items-center gap-2 border-b border-navy/10 px-4 py-2.5">
        <span className="text-sm text-navy/60">Ik ben:</span>
        {CHAT_AFZENDERS.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => kies(a.key)}
            className={`rounded-lg px-3 py-1 text-sm font-medium ${
              ikBen === a.key ? "bg-navy text-white" : "text-navy hover:bg-navy/5"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Berichten */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {berichten.length === 0 && (
          <p className="py-10 text-center text-sm text-navy/40">
            Nog geen berichten. Stuur het eerste bericht.
          </p>
        )}
        {berichten.map((b) => {
          const eigen = b.afzender === ikBen;
          return (
            <div key={b.id} className={`flex items-end gap-2 ${eigen ? "flex-row-reverse" : ""}`}>
              <Avatar naam={chatAfzenderLabel(b.afzender)} size={28} />
              <div className={`max-w-[75%] ${eigen ? "text-right" : ""}`}>
                <div
                  className={`inline-block rounded-2xl px-3.5 py-2 text-sm ${
                    eigen ? "bg-oranje text-white" : "bg-navy/[0.06] text-navy"
                  }`}
                >
                  {b.tekst}
                </div>
                <div className="mt-0.5 px-1 text-[11px] text-navy/40">
                  {chatAfzenderLabel(b.afzender)} · {tijd(b.created_at)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bodemRef} />
      </div>

      {/* Invoer */}
      <form action={verstuur} className="flex items-center gap-2 border-t border-navy/10 p-3">
        <input type="hidden" name="afzender" value={ikBen} />
        <input
          name="tekst"
          value={tekst}
          onChange={(e) => setTekst(e.target.value)}
          placeholder="Typ een bericht…"
          autoComplete="off"
          className="flex-1 rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        />
        <button
          type="submit"
          disabled={!tekst.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90 disabled:opacity-50"
        >
          <Send size={15} /> Stuur
        </button>
      </form>
    </div>
  );
}
