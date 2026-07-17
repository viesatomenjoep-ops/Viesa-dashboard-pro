"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Building2, FileText, ListTodo, ReceiptEuro, Users, type LucideIcon } from "lucide-react";
import { euro } from "@/lib/format";

type Kaart = { label: string; waarde: string; icoon: LucideIcon; kleur: string; href: string };

/**
 * Actiebalk als carrousel: witte tegels met een gekleurd icoon en donkere tekst,
 * elk op volle breedte. Schuift vanzelf om de 2 seconden met een vloeiend effect
 * en is ook te swipen. Tik op een tegel → direct naar de pagina.
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
  const [index, setIndex] = useState(0);
  const dragX = useRef(0);
  const startX = useRef<number | null>(null);
  const geswipet = useRef(false);
  const [pauze, setPauze] = useState(false);

  // Automatisch doorschuiven om de 2 seconden (pauzeert tijdens swipen).
  useEffect(() => {
    if (pauze) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % n), 2000);
    return () => clearInterval(t);
  }, [n, pauze]);

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
    if (d <= -40) setIndex((i) => (i + 1) % n);
    else if (d >= 40) setIndex((i) => (i - 1 + n) % n);
    startX.current = null;
    dragX.current = 0;
    // korte pauze zodat de gebruiker even kan kijken, daarna weer auto-slide
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
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {kaarten.map((k) => {
            const Icoon = k.icoon;
            return (
              <Link
                key={k.label}
                href={k.href}
                onClick={(e) => {
                  if (geswipet.current) e.preventDefault();
                }}
                className="flex w-full shrink-0 items-center gap-4 rounded-2xl border border-navy/10 bg-white p-4 shadow-sm"
              >
                <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white ${k.kleur}`}>
                  <Icoon size={26} strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-3xl font-bold leading-tight text-navy">{k.waarde}</div>
                  <div className="text-sm font-medium text-navy/50">{k.label}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Stipjes-indicator */}
      <div className="mt-2.5 flex justify-center gap-1.5">
        {kaarten.map((k, i) => (
          <button
            key={k.label}
            type="button"
            aria-label={`Naar ${k.label}`}
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
