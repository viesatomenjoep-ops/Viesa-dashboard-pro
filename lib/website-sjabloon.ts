/**
 * Gratis, directe prototypes — geen AI-aanroep, dus geen tokens. Eén thema per
 * branche (kleur, toon, icoon, standaard-diensten); de daadwerkelijke pagina
 * wordt met dat thema opgebouwd voor de specifieke lead (naam + plaats).
 *
 * Dit is het standaardpad in de UI: pas als iemand iets specifiekers wil dan
 * dit sjabloon biedt, is de AI-variant (lib/ai/prototype.ts) de uitwijk.
 */

export type PrototypeType = "website" | "app";

type Thema = {
  kleur1: string;
  kleur2: string;
  tekstOpKleur: string;
  accent: string;
  icoon: string;
  tagline: string;
  diensten: { titel: string; omschrijving: string }[];
  usps: string[];
};

const THEMAS: Record<string, Thema> = {
  "E-commerce / webshop": {
    kleur1: "#19445B",
    kleur2: "#0d2836",
    tekstOpKleur: "#ffffff",
    accent: "#F26B21",
    icoon: "🛒",
    tagline: "Besteld vandaag, in huis morgen.",
    diensten: [
      { titel: "Assortiment", omschrijving: "Een overzichtelijk aanbod, snel te doorzoeken en te vergelijken." },
      { titel: "Snel besteld", omschrijving: "Afrekenen in een paar stappen, met de betaalmethoden die je gewend bent." },
      { titel: "Persoonlijk advies", omschrijving: "Vragen over een bestelling? We denken graag met je mee." },
    ],
    usps: ["Snelle levering", "Veilig betalen", "Persoonlijke service"],
  },
  Groothandel: {
    kleur1: "#1f2937",
    kleur2: "#111827",
    tekstOpKleur: "#ffffff",
    accent: "#F26B21",
    icoon: "📦",
    tagline: "Uw partner in groothandel — betrouwbaar, op voorraad, op tijd.",
    diensten: [
      { titel: "Assortiment op maat", omschrijving: "Een breed pakket, afgestemd op de behoefte van uw branche." },
      { titel: "Vaste levertijden", omschrijving: "Voorspelbare logistiek, zodat u zelf ook kunt plannen." },
      { titel: "Zakelijke voorwaarden", omschrijving: "Heldere staffelprijzen en persoonlijke accountondersteuning." },
    ],
    usps: ["Groot magazijn", "Vaste contactpersoon", "Scherpe staffelprijzen"],
  },
  "Retail / detailhandel": {
    kleur1: "#7c2d12",
    kleur2: "#431407",
    tekstOpKleur: "#ffffff",
    accent: "#F26B21",
    icoon: "🛍️",
    tagline: "Kom langs, of bestel vandaag nog online.",
    diensten: [
      { titel: "In de winkel", omschrijving: "Kom langs voor persoonlijk advies en om het product te zien." },
      { titel: "Online bestellen", omschrijving: "Bekijk het aanbod thuis en haal het op wanneer het uitkomt." },
      { titel: "Klantenservice", omschrijving: "Vragen over een aankoop? We helpen u graag verder." },
    ],
    usps: ["Ruime openingstijden", "Deskundig advies", "Ook online te bestellen"],
  },
  "Productie / fabrikant": {
    kleur1: "#1e3a5f",
    kleur2: "#0f1f33",
    tekstOpKleur: "#ffffff",
    accent: "#F26B21",
    icoon: "⚙️",
    tagline: "Van tekening tot eindproduct — vakwerk, gemaakt om te blijven.",
    diensten: [
      { titel: "Maatwerk", omschrijving: "Elk product afgestemd op de specificaties van de opdracht." },
      { titel: "Kwaliteitscontrole", omschrijving: "Elke batch gecontroleerd voordat die de deur uit gaat." },
      { titel: "Advies vooraf", omschrijving: "We denken mee over materiaal, proces en planning." },
    ],
    usps: ["Eigen productie", "Kwaliteitsgarantie", "Korte levertijden"],
  },
  Horeca: {
    kleur1: "#7f1d1d",
    kleur2: "#450a0a",
    tekstOpKleur: "#ffffff",
    accent: "#F26B21",
    icoon: "🍽️",
    tagline: "Welkom aan tafel — reserveer direct uw plek.",
    diensten: [
      { titel: "Ons menu", omschrijving: "Vers bereid, met aandacht voor seizoen en herkomst." },
      { titel: "Reserveren", omschrijving: "Binnen een minuut een tafel geboekt, ook voor grotere groepen." },
      { titel: "Feesten & partijen", omschrijving: "Van verjaardag tot bedrijfsborrel — wij regelen het." },
    ],
    usps: ["Vers & lokaal", "Direct online reserveren", "Ook voor groepen"],
  },
  "Bouw & installatie": {
    kleur1: "#78350f",
    kleur2: "#451a03",
    tekstOpKleur: "#ffffff",
    accent: "#F26B21",
    icoon: "🏗️",
    tagline: "Vakwerk waar u op kunt bouwen.",
    diensten: [
      { titel: "Advies & offerte", omschrijving: "Een vrijblijvend gesprek en een heldere prijsopgave vooraf." },
      { titel: "Uitvoering", omschrijving: "Vakmensen die de klus netjes en op tijd afronden." },
      { titel: "Nazorg", omschrijving: "Ook na oplevering bereikbaar voor vragen of garantie." },
    ],
    usps: ["Gratis offerte", "Erkend vakmanschap", "Garantie op het werk"],
  },
  "Transport & logistiek": {
    kleur1: "#1e293b",
    kleur2: "#0f172a",
    tekstOpKleur: "#ffffff",
    accent: "#F26B21",
    icoon: "🚚",
    tagline: "Uw zending op tijd, waar dan ook.",
    diensten: [
      { titel: "Transport", omschrijving: "Betrouwbaar vervoer, nationaal en internationaal." },
      { titel: "Track & trace", omschrijving: "Altijd inzicht in waar uw zending zich bevindt." },
      { titel: "Maatwerklogistiek", omschrijving: "Van eenmalig transport tot vaste routes." },
    ],
    usps: ["Landelijke dekking", "Realtime volgen", "Flexibele planning"],
  },
  "Zakelijke dienstverlening": {
    kleur1: "#19445B",
    kleur2: "#0d2836",
    tekstOpKleur: "#ffffff",
    accent: "#F26B21",
    icoon: "💼",
    tagline: "Uw uitdaging, onze expertise.",
    diensten: [
      { titel: "Advies", omschrijving: "Een helder plan van aanpak, afgestemd op uw situatie." },
      { titel: "Uitvoering", omschrijving: "We nemen het werk uit handen en houden u op de hoogte." },
      { titel: "Nazorg", omschrijving: "Ook na afronding blijven we bereikbaar voor vragen." },
    ],
    usps: ["Persoonlijk contact", "Bewezen aanpak", "Snel op te starten"],
  },
  Gezondheidszorg: {
    kleur1: "#065f46",
    kleur2: "#022c22",
    tekstOpKleur: "#ffffff",
    accent: "#F26B21",
    icoon: "🩺",
    tagline: "Goede zorg, dichtbij en toegankelijk.",
    diensten: [
      { titel: "Afspraak maken", omschrijving: "Snel een moment vinden dat u uitkomt, online of telefonisch." },
      { titel: "Behandeling", omschrijving: "Persoonlijke aandacht, volgens de laatste richtlijnen." },
      { titel: "Nazorg", omschrijving: "Duidelijke vervolgstappen en bereikbaar bij vragen." },
    ],
    usps: ["Korte wachttijd", "Persoonlijke zorg", "Ook online een afspraak maken"],
  },
  Overig: {
    kleur1: "#19445B",
    kleur2: "#0d2836",
    tekstOpKleur: "#ffffff",
    accent: "#F26B21",
    icoon: "✅",
    tagline: "Graag tot uw dienst.",
    diensten: [
      { titel: "Wat we doen", omschrijving: "Een heldere uitleg van het aanbod, in gewone taal." },
      { titel: "Hoe het werkt", omschrijving: "In een paar stappen van vraag naar oplossing." },
      { titel: "Contact", omschrijving: "Snel een antwoord op uw vraag, zonder omwegen." },
    ],
    usps: ["Persoonlijk contact", "Snel antwoord", "Duidelijke afspraken"],
  },
};

function themaVoor(branche: string | null): Thema {
  if (branche && THEMAS[branche]) return THEMAS[branche];
  return THEMAS.Overig;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Bouwt direct (0 tokens) een prototype-pagina op basis van het branchethema. */
export function bouwStatischPrototype(input: {
  bedrijf: string;
  plaats: string | null;
  branche: string | null;
  type: PrototypeType;
}): string {
  const t = themaVoor(input.branche);
  const bedrijf = escapeHtml(input.bedrijf);
  const plaats = input.plaats ? escapeHtml(input.plaats) : null;

  const dienstenHtml = t.diensten
    .map(
      (d) => `<div class="kaart">
        <h3>${escapeHtml(d.titel)}</h3>
        <p>${escapeHtml(d.omschrijving)}</p>
      </div>`,
    )
    .join("\n");

  const uspsHtml = t.usps.map((u) => `<li>${escapeHtml(u)}</li>`).join("\n");

  const body = `
    <header class="hero">
      <div class="hero-inner">
        <span class="badge">${t.icoon} ${plaats ? `${bedrijf} · ${plaats}` : bedrijf}</span>
        <h1>${bedrijf}</h1>
        <p class="tagline">${escapeHtml(t.tagline)}</p>
        <a class="cta" href="#contact">Neem contact op</a>
      </div>
    </header>
    <main>
      <section class="sectie">
        <h2>Wat we doen</h2>
        <div class="kaarten">${dienstenHtml}</div>
      </section>
      <section class="sectie usps">
        <ul>${uspsHtml}</ul>
      </section>
      <section class="sectie" id="contact">
        <div class="contact">
          <h2>Direct contact</h2>
          <p>Neem gerust contact op — we denken graag met u mee.</p>
          <a class="cta" href="#contact">Neem contact op</a>
        </div>
      </section>
    </main>
    <footer>
      <p>${bedrijf}${plaats ? ` · ${plaats}` : ""}</p>
    </footer>`;

  const stijl = `
    :root { --kleur1: ${t.kleur1}; --kleur2: ${t.kleur2}; --op-kleur: ${t.tekstOpKleur}; --accent: ${t.accent}; }
    * { box-sizing: border-box; }
    body {
      margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #1a2733; background: #f4f6f9; line-height: 1.5;
    }
    .hero {
      background: linear-gradient(135deg, var(--kleur1), var(--kleur2));
      color: var(--op-kleur); padding: 4rem 1.5rem; text-align: center;
    }
    .hero-inner { max-width: 640px; margin: 0 auto; }
    .badge {
      display: inline-block; background: rgba(255,255,255,0.12); border-radius: 999px;
      padding: 0.35rem 0.9rem; font-size: 0.85rem; margin-bottom: 1rem;
    }
    h1 { font-size: 2.2rem; margin: 0 0 0.75rem; }
    .tagline { font-size: 1.1rem; opacity: 0.9; margin: 0 0 1.75rem; }
    .cta {
      display: inline-block; background: var(--accent); color: #fff; text-decoration: none;
      padding: 0.85rem 1.75rem; border-radius: 0.6rem; font-weight: 600;
    }
    .sectie { max-width: 900px; margin: 0 auto; padding: 3rem 1.5rem; }
    .sectie h2 { text-align: center; margin: 0 0 2rem; color: var(--kleur1); }
    .kaarten { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; }
    .kaart { background: #fff; border-radius: 0.75rem; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .kaart h3 { margin: 0 0 0.5rem; color: var(--kleur1); }
    .kaart p { margin: 0; color: #4b5c6b; font-size: 0.95rem; }
    .usps ul { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem; }
    .usps li {
      background: #fff; border: 1px solid rgba(25,68,91,0.12); border-radius: 999px;
      padding: 0.5rem 1.1rem; font-size: 0.9rem; color: var(--kleur1); font-weight: 500;
    }
    .contact {
      background: #fff; border-radius: 1rem; padding: 2.5rem; text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .contact h2 { color: var(--kleur1); margin-top: 0; }
    footer { text-align: center; padding: 2rem; color: #7a8996; font-size: 0.85rem; }`;

  if (input.type === "app") {
    return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${bedrijf} — app-prototype</title>
<style>
  body { margin: 0; background: #e6e9ee; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
  .telefoon {
    width: 360px; max-width: 92vw; height: 720px; max-height: 92vh; background: #0b0f14;
    border-radius: 2.5rem; padding: 0.6rem; box-shadow: 0 20px 50px rgba(0,0,0,0.35);
  }
  .scherm { background: #f4f6f9; border-radius: 2rem; height: 100%; overflow-y: auto; position: relative; }
  ${stijl}
  .hero { padding: 3rem 1.25rem 2rem; border-radius: 2rem 2rem 0 0; }
  h1 { font-size: 1.5rem; }
  .sectie { padding: 2rem 1.25rem; }
  .kaarten { grid-template-columns: 1fr; }
</style>
</head>
<body>
  <div class="telefoon"><div class="scherm">${body}</div></div>
</body>
</html>`;
  }

  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${bedrijf} — website-prototype</title>
<style>${stijl}</style>
</head>
<body>${body}</body>
</html>`;
}
