// ============================================================================
// RLS-bewijs: een ANONIEME client mag nergens bij.
// ----------------------------------------------------------------------------
// Gebruikt uitsluitend de publieke anon-sleutel (geen sessie). Voor elke tabel:
//   - SELECT moet 0 rijen teruggeven (RLS verbergt alles voor anon)
//   - INSERT moet geweigerd worden
// Slaagt alleen als ALLE tabellen dichtzitten.
//
// Draaien (met env NEXT_PUBLIC_SUPABASE_URL en NEXT_PUBLIC_SUPABASE_ANON_KEY):
//   node scripts/test-rls.mjs
// of:
//   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... node scripts/test-rls.mjs
// ============================================================================

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error("✗ Ontbrekende env: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TABELLEN = [
  "leads", "activiteiten", "offertes", "facturen", "projecten", "notities",
  "design_docs", "whiteboards", "stickies", "drive_links", "prospector_runs",
  "integraties", "ms_tokens", "klanten", "audits", "bestand_categorieen",
  "emails", "notificaties", "chat_berichten",
];

let geslaagd = true;

for (const tabel of TABELLEN) {
  // 1) Lezen mag geen rijen opleveren.
  const { data, error: leesFout } = await supabase.from(tabel).select("*").limit(1);
  const leesDicht = (data?.length ?? 0) === 0; // RLS geeft anon 0 rijen (geen policy)

  // 2) Schrijven moet geweigerd worden.
  const { error: schrijfFout } = await supabase.from(tabel).insert({});
  const schrijfDicht = Boolean(schrijfFout);

  const ok = leesDicht && schrijfDicht;
  if (!ok) geslaagd = false;

  console.log(
    `${ok ? "✓" : "✗"} ${tabel.padEnd(16)} ` +
      `lezen=${leesDicht ? "0 rijen" : `LEK (${data?.length} rijen)`} ` +
      `schrijven=${schrijfDicht ? "geweigerd" : "TOEGESTAAN ⚠"}` +
      (leesFout ? ` [leesfout: ${leesFout.code ?? leesFout.message}]` : ""),
  );
}

console.log("");
if (geslaagd) {
  console.log("✅ RLS-bewijs geslaagd: anonieme client kan nergens bij.");
  process.exit(0);
} else {
  console.error("❌ RLS-bewijs GEFAALD: minstens één tabel is bereikbaar voor anon.");
  process.exit(1);
}
