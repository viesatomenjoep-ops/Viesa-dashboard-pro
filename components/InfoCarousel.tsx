"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Building2, FileText, ListTodo, ReceiptEuro, Users, type LucideIcon } from "lucide-react";
import { euro } from "@/lib/format";

type Kaart = { label: string; waarde: string; icoon: LucideIcon; kleur: string; href: string };

// Aantal tegels dat tegelijk zichtbaar is in de actiebalk.
const ZICHTBAAR = 2;

/**
 * Actiebalk als carrousel: witte tegels met een gekleurd icoon en donkere tekst.
 * Er zijn er steeds twee tegelijk zichtbaar; de balk schuift vanzelf om de 2
 * seconden één tegel op, met een vloeiend effect. Ook zelf te swipen. Tik op een
 * tegel → direct naar de pagina.
 */
export function InfoCarousel({
  openTaken,
  leads,
  openstaand,
  offertes,
  klanten,
}: {
  openTaken: number;
  leads: number;
  openstaand: number;
  offertes: number;
  klanten: number;
}) {
  const kaarten: Kaart[] = [
    { label: "Te doen", waarde: String(openTaken), icoon: ListTodo, kleur: "bg-blue-500", href: "/taken" },
    { label: "Leads", waarde: String(leads), icoon: Users, kleur: "bg-emerald-500", href: "/leads" },
    { label: "Openstaand", waarde: euro(openstaand), icoon: ReceiptEuro, kleur: "bg-amber-500", href: "/facturen" },
    { label: "Offertes", waarde: String(offertes), icoon: FileText, kleur: "bg-purple-500", href: "/offertes" },
    { label: "Klanten", waarde: String(klanten), icoon: Building2, kleur: "bg-violet-500", href: "/klanten" },
  ];
  const n = kaarten.length;
  // Aantal beginposities zodat er altijd twee volle tegels in beeld staan.
  const posities = Math.max(1, n - ZICHTBAAR + 1);
  const [index, setIndex] = useState(0);
  const dragX = useRef(0);
  const startX = useRef<number | null>(null);
  const geswipet = useRef(false);
  const [pauze, setPauze] = useState(false);

  // Automatisch één tegel opschuiven om de 2 seconden (pauzeert tijdens swipen).
  useEffect(() => {
    if (pauze) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % posities), 2000);
    return () => clearInterval(t);
  }, [posities, pauze]);

  function omlaag(x: number) {
    startX.current = x;
    geswipet.current = false;
    setPauze(true);
  }
  function beweeg(x: number) {
    if (startX.current === null) return;
    dragX.current = x - startX.current;
    if (Math.abs(dragX.current) > 8) geswipet.current = true;
  }
  function omhoog() {
    if (startX.current === null) return;
    const d = dragX.current;
    if (d <= -40) setIndex((i) => (i + 1) % posities);
    else if (d >= 40) setIndex((i) => (i - 1 + posities) % posities);
    startX.current = null;
    dragX.current = 0;
    setTimeout(() => setPauze(false), 3000);
  }

  return (
    <div>
      <div
        className="overflow-hidden"
        onPointerDown={(e) => omlaag(e.clientX)}
        onPointerMove={(e) => beweeg(e.clientX)}
        onPointerUp={omhoog}
        onPointerCancel={omhoog}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * (100 / ZICHTBAAR)}%)` }}
        >
          {kaarten.map((k) => {
            const Icoon = k.icoon;
            return (
              <div key={k.label} className="w-1/2 shrink-0 px-1">
                <Link
                  href={k.href}
                  onClick={(e) => {
                    if (geswipet.current) e.preventDefault();
                  }}
                  className="flex h-full items-center gap-2.5 rounded-2xl border border-navy/10 bg-white p-3 shadow-sm"
                >
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${k.kleur}`}>
                    <Icoon size={22} strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-xl font-bold leading-tight text-navy">{k.waarde}</div>
                    <div className="truncate text-xs font-medium text-navy/50">{k.label}</div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stipjes-indicator (per beginpositie) */}
      <div className="mt-2.5 flex justify-center gap-1.5">
        {Array.from({ length: posities }).map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Positie ${i + 1}`}
            onClick={() => {
              setIndex(i);
              setPauze(true);
              setTimeout(() => setPauze(false), 3000);
            }}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-5 bg-white" : "w-1.5 bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
