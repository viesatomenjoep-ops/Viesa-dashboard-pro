import "server-only";
import { schoonSleutel } from "@/lib/geheimen";

/**
 * Controleert of de AI-sleutels goed staan — zonder ze ooit te tonen.
 *
 * Waarom dit bestaat: een verkeerd gezette sleutel merk je anders pas als een
 * prospect meekijkt en er drie van de vier modelkaarten leeg blijven. Vercel
 * geeft geen enkele terugkoppeling: een sleutel die alleen op Production staat
 * en niet op Preview lijkt daar precies hetzelfde als een sleutel die klopt.
 *
 * Elke controle is de goedkoopst mogelijke echte aanroep. Waar de aanbieder een
 * modellenlijst heeft gebruiken we die — dat kost geen tokens. Alleen Perplexity
 * heeft dat niet; daar vragen we één token op.
 *
 * De sleutelwaarde verlaat de server nooit. Alleen: staat hij ingesteld, werkt
 * hij, en zo niet — waarom niet.
 */

export type SleutelStatus = {
  key: string;
  label: string;
  /** Waar je hem haalt, voor als hij ontbreekt. */
  bron: string;
  ingesteld: boolean;
  /** null = nog niet gecontroleerd. */
  werkt: boolean | null;
  melding: string;
  /** Zonder deze sleutel valt alleen dit onderdeel uit. */
  gevolg: string;
  /** Extra uitleg die pas na de controle bekend is, bv. welke modellen mogen. */
  detail?: string;
};

type Controle = {
  key: string;
  label: string;
  bron: string;
  gevolg: string;
  test: (sleutel: string) => Promise<Response>;
  /** Leest extra informatie uit een geslaagd antwoord. Mag falen; dan geen detail. */
  detail?: (res: Response) => Promise<string | undefined>;
};

const TIMEOUT_MS = 12_000;

/** Eén controle, met een harde tijdslimiet — een trage dienst mag niet hangen. */
async function metTimeout(fn: (signal: AbortSignal) => Promise<Response>) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    return await fn(ac.signal);
  } finally {
    clearTimeout(t);
  }
}

const CONTROLES: Controle[] = [
  {
    key: "OPENAI_API_KEY",
    label: "OpenAI (ChatGPT)",
    bron: "platform.openai.com → API keys",
    gevolg: "De ChatGPT-kaart in de audit blijft leeg.",
    test: (sleutel) =>
      metTimeout((signal) => {
        const { sleutel: org } = schoonSleutel(process.env.OPENAI_ORG_ID);
        return fetch("https://api.openai.com/v1/models", {
          headers: {
            Authorization: `Bearer ${sleutel}`,
            ...(org ? { "OpenAI-Organization": org } : {}),
          },
          signal,
        });
      }),
  },
  {
    key: "ANTHROPIC_API_KEY",
    label: "Anthropic (Claude)",
    bron: "console.anthropic.com → API Keys",
    gevolg: "De Claude-kaart blijft leeg én de GEO-artikelgenerator werkt niet.",
    test: (sleutel) =>
      metTimeout((signal) =>
        fetch("https://api.anthropic.com/v1/models?limit=1", {
          headers: { "x-api-key": sleutel, "anthropic-version": "2023-06-01" },
          signal,
        }),
      ),
  },
  {
    key: "GEMINI_API_KEY",
    label: "Google Gemini",
    bron: "aistudio.google.com → Get API key (niet de Cloud Console)",
    gevolg: "De Gemini-kaart blijft leeg.",
    test: (sleutel) =>
      metTimeout((signal) =>
        fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", {
          headers: { "x-goog-api-key": sleutel },
          signal,
        }),
      ),
    // Google's modelnamen verschillen per account. Een werkende sleutel met een
    // model dat dit account niet heeft geeft "model bestaat niet" — dus tonen
    // we hier wélke modellen er wél zijn, in plaats van te laten gokken.
    detail: async (res) => {
      try {
        const data = (await res.json()) as {
          models?: { name?: string; supportedGenerationMethods?: string[] }[];
        };
        const namen = (data.models ?? [])
          .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
          .map((m) => (m.name ?? "").replace(/^models\//, ""))
          .filter((n) => n.includes("flash"))
          .slice(0, 4);
        if (namen.length === 0) return undefined;
        return `Beschikbaar voor deze sleutel: ${namen.join(", ")}. Zet er één van in GEMINI_MODEL.`;
      } catch {
        return undefined;
      }
    },
  },
  {
    key: "PERPLEXITY_API_KEY",
    label: "Perplexity",
    bron: "perplexity.ai → Settings → API",
    gevolg: "De Perplexity-kaart blijft leeg.",
    test: (sleutel) =>
      // Perplexity heeft geen modellenlijst. Eén token opvragen is de goedkoopste
      // echte controle; dat kost een fractie van een cent.
      metTimeout((signal) =>
        fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sleutel}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: process.env.PERPLEXITY_MODEL ?? "sonar",
            messages: [{ role: "user", content: "ok" }],
            max_tokens: 1,
          }),
          signal,
        }),
      ),
  },
  {
    key: "PAGESPEED_API_KEY",
    label: "Google PageSpeed",
    bron: "console.cloud.google.com → PageSpeed Insights API → Credentials",
    gevolg: "De prestatiescore valt terug op een lage limiet zonder sleutel.",
    test: (sleutel) =>
      // Een geldigheidscontrole zonder een volledige meting te draaien: een
      // ongeldige sleutel geeft 400/403 vóórdat de analyse begint.
      metTimeout((signal) =>
        fetch(
          "https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed" +
            `?url=https%3A%2F%2Fexample.com&strategy=mobile&category=performance&key=${encodeURIComponent(sleutel)}`,
          { signal },
        ),
      ),
  },
];

function duiding(status: number): string {
  if (status === 401 || status === 403) return "De sleutel wordt niet geaccepteerd.";
  if (status === 429) return "Aanvraaglimiet of tegoed bereikt — vul je saldo aan.";
  if (status === 400) return "De sleutel is ongeldig of hoort bij een andere dienst.";
  if (status >= 500) return "De dienst is tijdelijk niet bereikbaar — later nog eens proberen.";
  return `Onverwachte reactie (${status}).`;
}

/** Controleert alle sleutels tegelijk. Eén trage dienst houdt de rest niet op. */
export async function controleerSleutels(): Promise<SleutelStatus[]> {
  const uitkomsten = await Promise.all(
    CONTROLES.map(async (c): Promise<SleutelStatus> => {
      const { sleutel, verwijderd } = schoonSleutel(process.env[c.key]);
      const basis = {
        key: c.key,
        label: c.label,
        bron: c.bron,
        gevolg: c.gevolg,
      };

      if (!sleutel) {
        return {
          ...basis,
          ingesteld: false,
          werkt: null,
          melding: "Niet ingesteld in Vercel.",
        };
      }

      // Meegekopieerde tekens: wij halen ze weg, maar het is een teken dat de
      // sleutel gemaskeerd is gekopieerd en dus mogelijk ook afgekapt.
      const waarschuwing =
        verwijderd.length > 0
          ? " Let op: er stonden ongeldige tekens in — kopieer de sleutel opnieuw."
          : "";

      try {
        const res = await c.test(sleutel);
        if (res.ok) {
          return {
            ...basis,
            ingesteld: true,
            werkt: true,
            melding: "Werkt." + waarschuwing,
            detail: c.detail ? await c.detail(res) : undefined,
          };
        }
        return {
          ...basis,
          ingesteld: true,
          werkt: false,
          melding: duiding(res.status) + waarschuwing,
        };
      } catch (e) {
        const afgebroken = e instanceof Error && e.name === "AbortError";
        return {
          ...basis,
          ingesteld: true,
          werkt: false,
          melding: afgebroken
            ? "Geen antwoord binnen twaalf seconden."
            : "Kon de dienst niet bereiken." + waarschuwing,
        };
      }
    }),
  );

  return uitkomsten;
}
