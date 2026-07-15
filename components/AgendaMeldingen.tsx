"use client";

import { useCallback, useEffect, useState } from "react";

type Item = { id: string; titel: string; start: string };

const VOORAF_MIN = 60; // meld 1 uur van tevoren
const SLEUTEL = "viesa-gemelde-agenda"; // localStorage: al gemelde items

function gemeld(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SLEUTEL) ?? "[]"));
  } catch {
    return new Set();
  }
}
function bewaarGemeld(s: Set<string>) {
  try {
    localStorage.setItem(SLEUTEL, JSON.stringify(Array.from(s).slice(-200)));
  } catch {
    /* negeer */
  }
}

async function toon(titel: string, body: string) {
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(titel, { body, icon: "/icon-192.png", badge: "/icon-192.png" });
      return;
    }
  } catch {
    /* val terug op Notification */
  }
  new Notification(titel, { body, icon: "/icon-192.png" });
}

/**
 * Draait onzichtbaar mee in de app-shell. Vraagt (na klik) toestemming voor
 * meldingen en toont een melding 1 uur vóór een agendapunt/herinnering, zolang
 * het dashboard open of geïnstalleerd is. Rendert een klein 🔔-knopje.
 */
export function AgendaMeldingen() {
  const [permissie, setPermissie] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof Notification !== "undefined") setPermissie(Notification.permission);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const plan = useCallback(async () => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    let items: Item[] = [];
    try {
      const res = await fetch("/api/agenda/aankomend", { cache: "no-store" });
      if (!res.ok) return;
      items = (await res.json()).items ?? [];
    } catch {
      return;
    }

    const nu = Date.now();
    const reeds = gemeld();
    for (const it of items) {
      if (reeds.has(it.id)) continue;
      const start = new Date(it.start).getTime();
      const meldMoment = start - VOORAF_MIN * 60 * 1000;
      const tijd = new Date(it.start).toLocaleTimeString("nl-NL", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const melden = () => {
        toon("Over een uur in je agenda", `${tijd} — ${it.titel}`);
        const s = gemeld();
        s.add(it.id);
        bewaarGemeld(s);
      };
      if (start <= nu) continue;
      if (meldMoment <= nu) {
        melden(); // start binnen een uur → nu melden
      } else if (meldMoment - nu <= 3 * 60 * 60 * 1000) {
        window.setTimeout(melden, meldMoment - nu); // plan binnen dit venster
        reeds.add(it.id); // voorkom dubbele timers deze sessie
      }
    }
  }, []);

  useEffect(() => {
    if (permissie !== "granted") return;
    plan();
    const t = window.setInterval(plan, 5 * 60 * 1000); // elke 5 min opnieuw checken
    return () => window.clearInterval(t);
  }, [permissie, plan]);

  async function aanzetten() {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setPermissie(p);
  }

  if (permissie === "granted") {
    return <span title="Meldingen staan aan" className="text-navy/40">🔔</span>;
  }
  if (permissie === "denied") {
    return (
      <span title="Meldingen geblokkeerd — zet ze aan in je browserinstellingen" className="text-navy/30">
        🔕
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={aanzetten}
      title="Meldingen aanzetten voor agendapunten"
      className="rounded-lg border border-navy/20 px-2 py-1 text-sm text-navy hover:bg-navy/5"
    >
      🔔 Meldingen aan
    </button>
  );
}
