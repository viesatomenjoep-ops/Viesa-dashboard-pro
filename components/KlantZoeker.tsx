"use client";

import { useId, useState } from "react";

/**
 * Zoekbare klant-selector met suggesties (autocomplete via datalist). Typ een
 * deel van de bedrijfsnaam en kies uit de suggesties; de bijbehorende klant-id
 * wordt in een verborgen veld meegestuurd.
 */
export function KlantZoeker({
  klanten,
  idNaam = "klant_id",
  tekstNaam = "klant",
  initieelId = "",
  initieelNaam = "",
  className = "",
  placeholder = "Klant zoeken…",
}: {
  klanten: { id: string; bedrijf: string }[];
  idNaam?: string;
  tekstNaam?: string;
  initieelId?: string;
  initieelNaam?: string;
  className?: string;
  placeholder?: string;
}) {
  const [naam, setNaam] = useState(initieelNaam);
  const listId = useId();

  // Resolve de id op basis van de (exact) gekozen bedrijfsnaam.
  const gevonden = klanten.find((k) => k.bedrijf === naam);
  const id = gevonden ? gevonden.id : naam === initieelNaam ? initieelId : "";

  return (
    <>
      <input
        name={tekstNaam}
        value={naam}
        onChange={(e) => setNaam(e.target.value)}
        list={listId}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />
      <input type="hidden" name={idNaam} value={id} />
      <datalist id={listId}>
        {klanten.map((k) => (
          <option key={k.id} value={k.bedrijf} />
        ))}
      </datalist>
    </>
  );
}
