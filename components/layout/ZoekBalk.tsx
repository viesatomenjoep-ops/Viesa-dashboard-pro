"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Globale zoekbalk in de topbalk → /zoeken?q=… */
export function ZoekBalk() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const term = q.trim();
        if (term) router.push(`/zoeken?q=${encodeURIComponent(term)}`);
      }}
      className="flex-1"
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Zoek leads, projecten, notities, offertes…"
        className="w-full max-w-md rounded-lg border border-navy/15 bg-achtergrond px-3 py-1.5 text-sm text-navy outline-none focus:border-navy"
      />
    </form>
  );
}
