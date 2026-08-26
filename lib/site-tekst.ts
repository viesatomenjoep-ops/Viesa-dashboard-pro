import "server-only";

/**
 * Haalt best-effort de leesbare tekst van een website op (kort, met time-out).
 * Gedeeld door de AI-agents die een website als context meesturen — verrijking
 * en de website-prototypegenerator — zodat de aanpak (en de limiet op lengte,
 * met het oog op tokengebruik) op één plek staat.
 */
export async function haalWebsiteTekst(url: string | null, maxLengte = 4000): Promise<string> {
  if (!url) return "";
  const net = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(net, {
      signal: controller.signal,
      headers: { "user-agent": "ViesaBot/1.0 (+lead-verrijking)" },
    });
    clearTimeout(t);
    if (!res.ok) return "";
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLengte);
  } catch {
    return "";
  }
}
