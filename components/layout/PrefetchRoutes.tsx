"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { navSecties } from "@/lib/navigatie";

/**
 * Laadt na de eerste render alle hoofdpagina's alvast in (router.prefetch), op
 * een "idle" moment zodat het de eerste weergave niet vertraagt. Samen met de
 * langere router-cache (zie next.config `staleTimes`) voelt elke klik daarna
 * instant: de eerste keer warmt alles op, daarna komt het uit het geheugen.
 */
export function PrefetchRoutes() {
  const router = useRouter();

  useEffect(() => {
    const hrefs = navSecties.flatMap((s) => s.items.map((i) => i.href));
    const start = () => hrefs.forEach((h) => router.prefetch(h));
    const idle = (window as unknown as {
      requestIdleCallback?: (cb: () => void) => number;
    }).requestIdleCallback;
    if (idle) idle(start);
    else setTimeout(start, 400);
  }, [router]);

  return null;
}
