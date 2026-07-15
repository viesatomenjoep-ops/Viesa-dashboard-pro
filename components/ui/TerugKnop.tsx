"use client";

import { useRouter } from "next/navigation";

/**
 * Terug-knop die naar de vórige pagina gaat (browser-history), zodat filters
 * op de lijst (branche/regio/land) behouden blijven. Valt terug op `naar` als
 * er geen geschiedenis is (bv. bij direct openen van de detail-URL).
 */
export function TerugKnop({
  naar,
  label,
  className = "text-sm text-navy/60 hover:underline",
}: {
  naar: string;
  label: string;
  className?: string;
}) {
  const router = useRouter();

  function terug() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(naar);
    }
  }

  return (
    <button type="button" onClick={terug} className={className}>
      {label}
    </button>
  );
}
