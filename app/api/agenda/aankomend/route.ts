import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { icalEvents } from "@/lib/ical";

export const dynamic = "force-dynamic";

/**
 * Geeft agendapunten (iCal + eigen herinneringen) die binnen de komende ~3 uur
 * starten, zodat de client er een melding voor kan plannen (1 uur van tevoren).
 */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ items: [] }, { status: 401 });

  const nu = Date.now();
  const venster = 180 * 60 * 1000; // 3 uur vooruit
  const items: { id: string; titel: string; start: string }[] = [];

  try {
    const { data: bronnen } = await supabase.from("agenda_bronnen").select("ical_url");
    const alle = (
      await Promise.all(
        (bronnen ?? []).map((b) =>
          icalEvents(b.ical_url as string, { dagen: 1 }).catch(() => []),
        ),
      )
    ).flat();
    for (const e of alle) {
      const t = new Date(e.start).getTime();
      if (t >= nu && t <= nu + venster) {
        items.push({ id: e.id, titel: e.titel, start: e.start });
      }
    }
  } catch {
    /* geen agenda gekoppeld */
  }

  try {
    const { data: h } = await supabase.from("herinneringen").select("id, titel, wanneer");
    for (const r of h ?? []) {
      const t = new Date(r.wanneer as string).getTime();
      if (t >= nu && t <= nu + venster) {
        items.push({ id: `herinnering-${r.id}`, titel: r.titel as string, start: r.wanneer as string });
      }
    }
  } catch {
    /* geen herinneringen */
  }

  return NextResponse.json({ items });
}
