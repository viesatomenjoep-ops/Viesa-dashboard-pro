import { NextResponse } from "next/server";

/**
 * Locatie-zoeker zonder API-sleutel via OpenStreetMap (Nominatim). Zoekt op
 * postcode, adres of bedrijfsnaam en geeft nette adres-suggesties terug — genoeg
 * om in het agenda-locatieveld een echte locatie te kiezen. Focus op NL/BE.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) return NextResponse.json({ resultaten: [] });

  try {
    const url =
      "https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&countrycodes=nl,be&q=" +
      encodeURIComponent(q);
    const res = await fetch(url, {
      headers: {
        // Nominatim vereist een herkenbare User-Agent.
        "User-Agent": "ViesaDashboard/1.0 (agenda-locatie)",
        "Accept-Language": "nl",
      },
      // Kort cachen om binnen de fair-use van Nominatim te blijven.
      next: { revalidate: 60 },
    });
    if (!res.ok) return NextResponse.json({ resultaten: [] });
    const data = (await res.json()) as { display_name: string }[];
    const resultaten = data.map((r) => r.display_name).filter(Boolean);
    return NextResponse.json({ resultaten });
  } catch {
    return NextResponse.json({ resultaten: [] });
  }
}
