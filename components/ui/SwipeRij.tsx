"use client";

import { useRef, useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";

/**
 * Rij die je (iPhone-stijl) naar links kunt slepen om te verwijderen. Onder de
 * rij verschijnt een rood vlak met een prullenbak; sleep je voorbij de drempel
 * en laat je los, dan wordt `onVerwijder` uitgevoerd. Verticaal scrollen blijft
 * werken (touch-action: pan-y).
 */
export function SwipeRij({
  children,
  onVerwijder,
}: {
  children: ReactNode;
  onVerwijder: () => void | Promise<void>;
}) {
  const [dx, setDx] = useState(0);
  const [animeer, setAnimeer] = useState(false);
  const startX = useRef(0);
  const actief = useRef(false);
  const DREMPEL = 84;

  function begin(x: number) {
    startX.current = x;
    actief.current = true;
    setAnimeer(false);
  }
  function beweeg(x: number) {
    if (!actief.current) return;
    setDx(Math.max(-160, Math.min(0, x - startX.current)));
  }
  function eind() {
    if (!actief.current) return;
    actief.current = false;
    setAnimeer(true);
    if (dx <= -DREMPEL) {
      setDx(-1000);
      Promise.resolve(onVerwijder()).catch(() => setDx(0));
    } else {
      setDx(0);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div className="absolute inset-0 flex items-center justify-end rounded-lg bg-red-500 pr-4 text-white">
        <Trash2 size={16} />
      </div>
      <div
        onPointerDown={(e) => {
          (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
          begin(e.clientX);
        }}
        onPointerMove={(e) => beweeg(e.clientX)}
        onPointerUp={eind}
        onPointerCancel={eind}
        style={{
          transform: `translateX(${dx}px)`,
          transition: animeer ? "transform .2s ease" : "none",
          touchAction: "pan-y",
        }}
        className="relative bg-white"
      >
        {children}
      </div>
    </div>
  );
}
