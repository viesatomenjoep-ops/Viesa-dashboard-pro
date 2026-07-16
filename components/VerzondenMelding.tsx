"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

/**
 * Drijvende bevestiging na het versturen van een e-mail: een duidelijke
 * "verzonden"-melding bovenaan het scherm plus een kort bevestigingsgeluid
 * (via Web Audio — geen extern bestand nodig). Verdwijnt vanzelf na een paar
 * seconden of via het kruisje.
 */
export function VerzondenMelding({ tekst = "E-mail verzonden" }: { tekst?: string }) {
  const [zichtbaar, setZichtbaar] = useState(true);

  useEffect(() => {
    speelBevestiging();
    const t = setTimeout(() => setZichtbaar(false), 4500);
    return () => clearTimeout(t);
  }, []);

  if (!zichtbaar) return null;

  return (
    <div className="fixed inset-x-0 top-4 z-[60] flex justify-center px-4">
      <div className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
        <CheckCircle2 size={18} className="shrink-0" />
        <span>{tekst}</span>
        <button
          type="button"
          onClick={() => setZichtbaar(false)}
          aria-label="Sluiten"
          className="ml-1 opacity-80 hover:opacity-100"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

/** Kort, vriendelijk "ping"-geluidje (twee tonen) als het versturen lukte. */
function speelBevestiging() {
  try {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const nu = ctx.currentTime;
    [880, 1320].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      const t = nu + i * 0.12;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    });
    setTimeout(() => ctx.close().catch(() => {}), 700);
  } catch {
    /* audio niet beschikbaar — stil doorgaan */
  }
}
