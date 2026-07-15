"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BRANCHES,
  LANDEN,
  REGIOS,
  REGIOS_PER_LAND,
  KLANT_TYPES,
} from "@/lib/klanten";

const inputCls =
  "w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy";

/**
 * Responsive filterbalk voor klanten. Kies eerst een land; de regio-lijst toont
 * dan de provincies/deelstaten van dat land. Verzendt als GET-formulier.
 */
export function KlantFilters({
  q = "",
  land = "",
  regio = "",
  branche = "",
  type = "",
  branches,
}: {
  q?: string;
  land?: string;
  regio?: string;
  branche?: string;
  type?: string;
  /** Branche-opties; standaard de vaste lijst, maar de klantenlijst geeft hier
   *  de werkelijke (vrije) categorieën door zodat nieuwe branches verschijnen. */
  branches?: string[];
}) {
  const brancheOpties = branches && branches.length ? branches : [...BRANCHES];
  const [gekozenLand, setGekozenLand] = useState(land);
  const regios = gekozenLand ? REGIOS_PER_LAND[gekozenLand] ?? [] : REGIOS;

  return (
    <form className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:items-center">
      <input
        name="q"
        defaultValue={q}
        placeholder="Zoek…"
        className={`${inputCls} col-span-2 sm:col-span-1 lg:w-44`}
      />
      <select
        name="land"
        defaultValue={land}
        onChange={(e) => setGekozenLand(e.target.value)}
        className={`${inputCls} lg:w-40`}
      >
        <option value="">Alle landen</option>
        {LANDEN.map((l) => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>
      {/* key op het land: reset de regiokeuze bij wisselen van land */}
      <select name="regio" defaultValue={regio} key={gekozenLand} className={`${inputCls} lg:w-44`}>
        <option value="">Alle regio&apos;s</option>
        {regios.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <select name="branche" defaultValue={branche} className={`${inputCls} lg:w-48`}>
        <option value="">Alle branches</option>
        {brancheOpties.map((b) => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>
      <select name="type" defaultValue={type} className={`${inputCls} lg:w-36`}>
        <option value="">Alle types</option>
        {KLANT_TYPES.map((t) => (
          <option key={t.key} value={t.key}>{t.label}</option>
        ))}
      </select>
      <div className="col-span-2 flex items-center gap-3 sm:col-span-3 lg:col-span-1">
        <button
          type="submit"
          className="rounded-lg border border-navy/20 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5"
        >
          Filter
        </button>
        <Link href="/klanten" className="text-sm text-navy/50 hover:underline">
          Wissen
        </Link>
      </div>
    </form>
  );
}
