import "server-only";

/**
 * Google OAuth + Gmail-verzending (server-only). Tokens worden server-side
 * bewaard in de integraties-tabel (dienst 'gmail'), nooit in de client.
 * Vereist env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI.
 */

const AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN = "https://oauth2.googleapis.com/token";

// Ruime Google-scope (Gmail versturen/lezen + Docs + Agenda lezen), zoals afgestemd.
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/documents.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
];

export type GoogleConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export function googleConfig(): GoogleConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri };
}

export function oauthUrl(cfg: GoogleConfig, state: string): string {
  const p = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES.join(" "),
    state,
  });
  return `${AUTH}?${p.toString()}`;
}

export async function exchangeCode(
  cfg: GoogleConfig,
  code: string,
): Promise<{ refresh_token?: string; access_token: string; expires_in: number }> {
  const res = await fetch(TOKEN, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: cfg.redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Google token ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function accessTokenFromRefresh(
  cfg: GoogleConfig,
  refreshToken: string,
): Promise<string> {
  const res = await fetch(TOKEN, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Google refresh ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

/** Verstuurt een e-mail via de Gmail API met een access token. */
export async function gmailSend(
  accessToken: string,
  msg: { to: string; subject: string; body: string; from?: string },
): Promise<void> {
  const lines = [
    `To: ${msg.to}`,
    msg.from ? `From: ${msg.from}` : "",
    `Subject: ${msg.subject}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    msg.body,
  ].filter(Boolean);
  const raw = Buffer.from(lines.join("\r\n"), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ raw }),
    },
  );
  if (!res.ok) throw new Error(`Gmail send ${res.status}: ${await res.text()}`);
}

/** Eén afspraak uit Google Calendar, genormaliseerd voor de Agenda-pagina. */
export type AgendaItem = {
  id: string;
  titel: string;
  start: string; // ISO-datum(-tijd)
  eind: string | null;
  heleDag: boolean;
  locatie: string | null;
  link: string | null;
};

/**
 * Haalt komende afspraken op uit de primaire Google-agenda.
 * `dagen` bepaalt hoe ver vooruit gekeken wordt (standaard 30).
 */
export async function googleCalendarEvents(
  accessToken: string,
  opts?: { dagen?: number; max?: number },
): Promise<AgendaItem[]> {
  const dagen = opts?.dagen ?? 30;
  const max = opts?.max ?? 50;
  const nu = new Date();
  const tot = new Date(nu.getTime() + dagen * 24 * 60 * 60 * 1000);

  const p = new URLSearchParams({
    timeMin: nu.toISOString(),
    timeMax: tot.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: String(max),
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${p.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" },
  );
  if (!res.ok) throw new Error(`Calendar ${res.status}: ${await res.text()}`);

  const data = (await res.json()) as {
    items?: Array<{
      id: string;
      summary?: string;
      location?: string;
      htmlLink?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
    }>;
  };

  return (data.items ?? []).map((e) => {
    const heleDag = Boolean(e.start?.date && !e.start?.dateTime);
    return {
      id: e.id,
      titel: e.summary?.trim() || "(geen titel)",
      start: e.start?.dateTime ?? e.start?.date ?? "",
      eind: e.end?.dateTime ?? e.end?.date ?? null,
      heleDag,
      locatie: e.location ?? null,
      link: e.htmlLink ?? null,
    };
  });
}
