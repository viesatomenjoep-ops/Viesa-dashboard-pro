/**
 * Gratis, directe prototypes — geen AI-aanroep, dus geen tokens.
 *
 * Elke branche heeft niet alleen eigen kleuren maar een eigen ONTWERP,
 * gebaseerd op vijf archetypes uit echte referentiesites:
 *
 *  - "webshop"   — bol.com: frisse e-commerce met USP-balk, zoekbalk,
 *                  hero-banner en dealkaarten in zachte tintvlakken.
 *  - "premium"   — stephex.com: donkere held met groot wit kapitaal,
 *                  diagonale streep-motieven en genummerde divisiekaarten.
 *  - "horeca"    — decafes.nl: bijna-zwart, warme goudkleurige sieraccenten
 *                  in een handschrift-letter, menukolommen in kapitalen.
 *  - "corporate" — novar.nl: strak wit, grote kop met accentstreep,
 *                  dienstenkaarten en een genummerde werkwijze.
 *  - "verhaal"   — patagonia.com: full-bleed statement-held, verhalende
 *                  blokken om en om, weinig franje.
 *
 * Alles is één zelfstandig HTML-bestand: systeemfonts, geen JavaScript,
 * geen externe assets — emoji en CSS-gradients doen het beeldwerk.
 */

export type PrototypeType = "website" | "app";

type Dienst = { icoon: string; titel: string; omschrijving: string };

type Sjabloon = {
  stijl: "webshop" | "premium" | "horeca" | "corporate" | "verhaal";
  /** Hoofdkleur (donker) en een nog donkerder variant voor gradients. */
  kleur1: string;
  kleur2: string;
  /** Het ene accent (knoppen, badges, streepjes). */
  accent: string;
  /** Lichte pagina-achtergrond voor de lichte stijlen. */
  licht: string;
  tagline: string;
  subtitel: string;
  diensten: Dienst[];
  usps: string[];
  /** Alleen voor de webshop-stijl: de categorie-navigatie. */
  categorieen?: string[];
  ctaKop: string;
  ctaTekst: string;
  ctaKnop: string;
};

const SJABLONEN: Record<string, Sjabloon> = {
  "E-commerce / webshop": {
    stijl: "webshop",
    kleur1: "#0000a4",
    kleur2: "#00006e",
    accent: "#F26B21",
    licht: "#ffffff",
    tagline: "Alles voor een vliegende start",
    subtitel: "Vandaag besteld, morgen in huis — en gratis retourneren.",
    categorieen: ["Nieuw binnen", "Bestsellers", "Acties", "Cadeaus", "Merken"],
    diensten: [
      { icoon: "🚚", titel: "Snelle levering", omschrijving: "Voor 23:59 besteld, morgen in huis." },
      { icoon: "🔒", titel: "Veilig betalen", omschrijving: "iDEAL, creditcard of achteraf betalen." },
      { icoon: "↩️", titel: "Gratis retour", omschrijving: "Niet goed? 30 dagen bedenktijd." },
      { icoon: "⭐", titel: "Echte reviews", omschrijving: "Beoordeeld door duizenden klanten." },
    ],
    usps: ["Gratis verzending vanaf €25", "Bezorging dezelfde dag mogelijk", "Gratis retourneren"],
    ctaKop: "Ontdek het volledige assortiment",
    ctaTekst: "Duizenden producten, scherp geprijsd en direct leverbaar.",
    ctaKnop: "Bekijk nu",
  },
  "Retail / detailhandel": {
    stijl: "webshop",
    kleur1: "#7c2d12",
    kleur2: "#431407",
    accent: "#F26B21",
    licht: "#fffaf5",
    tagline: "In de winkel én online",
    subtitel: "Kom langs voor advies, of bestel vanuit je luie stoel.",
    categorieen: ["Assortiment", "Nieuw", "Aanbiedingen", "Cadeaubon", "Onze winkel"],
    diensten: [
      { icoon: "🏬", titel: "Bezoek de winkel", omschrijving: "Zie, voel en probeer het product zelf." },
      { icoon: "🛍️", titel: "Click & collect", omschrijving: "Online reserveren, dezelfde dag ophalen." },
      { icoon: "💬", titel: "Persoonlijk advies", omschrijving: "Deskundig personeel dat met je meedenkt." },
      { icoon: "🎁", titel: "Cadeauservice", omschrijving: "Gratis ingepakt, met een persoonlijke kaart." },
    ],
    usps: ["Ruime openingstijden", "Deskundig advies", "Ook online te bestellen"],
    ctaKop: "Kom eens langs",
    ctaTekst: "Onze winkel is zes dagen per week geopend — de koffie staat klaar.",
    ctaKnop: "Plan je bezoek",
  },
  Groothandel: {
    stijl: "premium",
    kleur1: "#15181c",
    kleur2: "#0a0c0e",
    accent: "#F26B21",
    licht: "#f4f6f9",
    tagline: "Uw partner in groothandel",
    subtitel: "Betrouwbaar, op voorraad en op tijd — al jaren de vaste schakel van onze afnemers.",
    diensten: [
      { icoon: "📦", titel: "Assortiment", omschrijving: "Een breed pakket, afgestemd op uw branche en volume." },
      { icoon: "🏭", titel: "Voorraad", omschrijving: "Groot magazijn, snelle omslag, altijd leverbaar." },
      { icoon: "🚛", titel: "Logistiek", omschrijving: "Vaste levermomenten waar u uw planning op bouwt." },
      { icoon: "🤝", titel: "Partnerschap", omschrijving: "Eén vaste contactpersoon en heldere staffelprijzen." },
    ],
    usps: ["Groot eigen magazijn", "Vaste contactpersoon", "Scherpe staffelprijzen"],
    ctaKop: "Zaken doen?",
    ctaTekst: "Vraag een vrijblijvende prijslijst aan of plan een kennismaking op locatie.",
    ctaKnop: "Neem contact op",
  },
  "Transport & logistiek": {
    stijl: "premium",
    kleur1: "#101828",
    kleur2: "#070d18",
    accent: "#F26B21",
    licht: "#f4f6f9",
    tagline: "Uw zending. Op tijd. Waar dan ook.",
    subtitel: "Nationaal en internationaal transport met de voorspelbaarheid waar uw klanten op rekenen.",
    diensten: [
      { icoon: "🚚", titel: "Wegtransport", omschrijving: "Fijnmazige distributie en volle ladingen, dag en nacht." },
      { icoon: "📍", titel: "Track & trace", omschrijving: "Altijd inzicht in waar uw zending zich bevindt." },
      { icoon: "🏗️", titel: "Warehousing", omschrijving: "Opslag, orderpicking en voorraadbeheer onder één dak." },
      { icoon: "🌍", titel: "Internationaal", omschrijving: "Vaste lijndiensten door heel Europa." },
    ],
    usps: ["Landelijke dekking", "Realtime volgen", "Flexibele planning"],
    ctaKop: "Een zending plannen?",
    ctaTekst: "Vraag binnen een werkdag een offerte op maat aan.",
    ctaKnop: "Offerte aanvragen",
  },
  "Bouw & installatie": {
    stijl: "premium",
    kleur1: "#1c1917",
    kleur2: "#0c0a09",
    accent: "#F26B21",
    licht: "#faf9f7",
    tagline: "Vakwerk waar u op kunt bouwen",
    subtitel: "Van eerste schets tot oplevering — één aannemer, één aanspreekpunt, één afspraak.",
    diensten: [
      { icoon: "📐", titel: "Advies & ontwerp", omschrijving: "Een vrijblijvend gesprek en een heldere prijsopgave vooraf." },
      { icoon: "🧱", titel: "Uitvoering", omschrijving: "Eigen vakmensen die de klus netjes en op tijd afronden." },
      { icoon: "🔧", titel: "Installatie", omschrijving: "Elektra, water en klimaat — alles in één hand." },
      { icoon: "✅", titel: "Nazorg", omschrijving: "Ook na oplevering bereikbaar voor vragen en garantie." },
    ],
    usps: ["Gratis offerte", "Erkend vakmanschap", "Garantie op het werk"],
    ctaKop: "Plannen?",
    ctaTekst: "Plan een vrijblijvende opname — we kijken graag mee op locatie.",
    ctaKnop: "Plan een opname",
  },
  "Productie / fabrikant": {
    stijl: "corporate",
    kleur1: "#1e3a5f",
    kleur2: "#0f1f33",
    accent: "#F26B21",
    licht: "#f6f8fa",
    tagline: "Van tekening tot eindproduct",
    subtitel: "Maakwerk in serie of enkelstuks — gemaakt om te blijven, geleverd op afspraak.",
    diensten: [
      { icoon: "⚙️", titel: "Maatwerkproductie", omschrijving: "Elk product exact volgens de specificaties van de opdracht." },
      { icoon: "🔍", titel: "Kwaliteitscontrole", omschrijving: "Elke batch gecontroleerd voordat die de deur uit gaat." },
      { icoon: "📋", titel: "Engineering", omschrijving: "We denken mee over materiaal, proces en maakbaarheid." },
      { icoon: "⏱️", titel: "Leverbetrouwbaarheid", omschrijving: "Een afgesproken datum is bij ons een harde datum." },
    ],
    usps: ["Eigen productie", "Kwaliteitsgarantie", "Korte levertijden"],
    ctaKop: "Iets laten maken?",
    ctaTekst: "Stuur uw tekening of omschrijving en ontvang snel een doordachte offerte.",
    ctaKnop: "Offerte aanvragen",
  },
  "Zakelijke dienstverlening": {
    stijl: "corporate",
    kleur1: "#19445B",
    kleur2: "#0d2836",
    accent: "#F26B21",
    licht: "#f4f6f9",
    tagline: "Uw uitdaging, onze expertise",
    subtitel: "Advies dat niet in een rapport blijft steken, maar in de praktijk het verschil maakt.",
    diensten: [
      { icoon: "🧭", titel: "Advies", omschrijving: "Een helder plan van aanpak, afgestemd op uw situatie." },
      { icoon: "🚀", titel: "Uitvoering", omschrijving: "We nemen het werk uit handen en houden u op de hoogte." },
      { icoon: "📈", titel: "Resultaat", omschrijving: "Meetbare afspraken vooraf, zodat u weet waar u aan toe bent." },
      { icoon: "🤝", titel: "Nazorg", omschrijving: "Ook na afronding blijven we bereikbaar voor vragen." },
    ],
    usps: ["Persoonlijk contact", "Bewezen aanpak", "Snel op te starten"],
    ctaKop: "Kennismaken?",
    ctaTekst: "In een gesprek van een half uur weet u of we bij elkaar passen.",
    ctaKnop: "Plan een kennismaking",
  },
  Gezondheidszorg: {
    stijl: "corporate",
    kleur1: "#065f46",
    kleur2: "#022c22",
    accent: "#F26B21",
    licht: "#f4faf7",
    tagline: "Goede zorg, dichtbij",
    subtitel: "Persoonlijke aandacht, korte wachttijden en een praktijk waar u zich welkom voelt.",
    diensten: [
      { icoon: "📅", titel: "Afspraak maken", omschrijving: "Online of aan de balie — snel een moment dat u uitkomt." },
      { icoon: "🩺", titel: "Behandeling", omschrijving: "Persoonlijke aandacht, volgens de laatste richtlijnen." },
      { icoon: "💚", titel: "Preventie", omschrijving: "Voorkomen is beter — we kijken verder dan de klacht." },
      { icoon: "📞", titel: "Bereikbaar", omschrijving: "Duidelijke vervolgstappen en bereikbaar bij vragen." },
    ],
    usps: ["Korte wachttijd", "Persoonlijke zorg", "Online een afspraak maken"],
    ctaKop: "Een afspraak maken?",
    ctaTekst: "Nieuwe patiënten zijn welkom — inschrijven is zo geregeld.",
    ctaKnop: "Maak een afspraak",
  },
  Horeca: {
    stijl: "horeca",
    kleur1: "#181210",
    kleur2: "#0d0a08",
    accent: "#c9a227",
    licht: "#f4f6f9",
    tagline: "Jouw tweede huiskamer",
    subtitel: "Vers bereid, met aandacht voor seizoen en herkomst.",
    diensten: [
      { icoon: "🍽️", titel: "Menukaart", omschrijving: "Vers bereid, met aandacht voor seizoen en herkomst." },
      { icoon: "☕", titel: "Koffie & gebak", omschrijving: "De hele dag door, huisgemaakt en met liefde." },
      { icoon: "📅", titel: "Reserveren", omschrijving: "Binnen een minuut een tafel geboekt, ook voor groepen." },
      { icoon: "🥂", titel: "Feesten & partijen", omschrijving: "Van verjaardag tot bedrijfsborrel — wij regelen het." },
    ],
    usps: ["Vers & lokaal", "Direct online reserveren", "Ook voor groepen"],
    ctaKop: "Reserveer een tafel",
    ctaTekst: "Vandaag geopend — schuif aan en laat je verrassen.",
    ctaKnop: "Reserveren",
  },
  Overig: {
    stijl: "verhaal",
    kleur1: "#19445B",
    kleur2: "#0d2836",
    accent: "#F26B21",
    licht: "#f4f6f9",
    tagline: "Graag tot uw dienst",
    subtitel: "Eén duidelijke belofte, waargemaakt met vakmanschap en aandacht.",
    diensten: [
      { icoon: "✨", titel: "Wat we doen", omschrijving: "Een helder aanbod, uitgelegd in gewone taal." },
      { icoon: "🧭", titel: "Hoe het werkt", omschrijving: "In een paar stappen van vraag naar oplossing." },
      { icoon: "💬", titel: "Contact", omschrijving: "Snel een antwoord op uw vraag, zonder omwegen." },
    ],
    usps: ["Persoonlijk contact", "Snel antwoord", "Duidelijke afspraken"],
    ctaKop: "Benieuwd wat we voor u kunnen doen?",
    ctaTekst: "Stel uw vraag — u hoort snel van ons.",
    ctaKnop: "Neem contact op",
  },
};

/** Alle branches met een eigen sjabloon — voor de kiezer in de UI. */
export const SJABLOON_BRANCHES = Object.keys(SJABLONEN);

function sjabloonVoor(branche: string | null): Sjabloon {
  if (branche && SJABLONEN[branche]) return SJABLONEN[branche];
  return SJABLONEN.Overig;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Initialen voor het logo-blokje (max 2 tekens). */
function initialen(bedrijf: string): string {
  const delen = bedrijf.split(/\s+/).filter(Boolean);
  const init = delen.length >= 2 ? delen[0][0] + delen[1][0] : bedrijf.slice(0, 2);
  return escapeHtml(init.toUpperCase());
}

const FONT_SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif";
const FONT_SERIF = "Georgia, 'Times New Roman', serif";
const FONT_SCRIPT = "'Snell Roundhand', 'Segoe Script', 'Brush Script MT', cursive";

function wrap(titel: string, css: string, body: string): string {
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titel}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
img{max-width:100%}
${css}
</style>
</head>
<body>${body}</body>
</html>`;
}

type Invoer = { bedrijf: string; plaats: string | null; sj: Sjabloon };

/* ============================== WEBSHOP (bol.com) ========================= */

function webshopWebsite({ bedrijf, plaats, sj }: Invoer): string {
  const badges = ["SALE", "NIEUW", "TOP", "DEAL"];
  const tinten = ["#fde9d9", "#fdf3d9", "#e3f0fb", "#e9f7ea"];
  const dealEmoji = ["⌚", "👟", "🎒", "🎧"];
  const kaarten = sj.diensten
    .map(
      (d, i) => `<article class="deal" style="background:${tinten[i % tinten.length]}">
        <span class="badge">${badges[i % badges.length]}</span>
        <span class="deal-emoji">${dealEmoji[i % dealEmoji.length]}</span>
        <h3>${escapeHtml(d.titel)}</h3>
        <p>${escapeHtml(d.omschrijving)}</p>
        <span class="deal-pijl">›</span>
      </article>`,
    )
    .join("\n");

  const css = `
body{font-family:${FONT_SANS};background:${sj.licht};color:#111}
.usps{display:flex;flex-wrap:wrap;gap:1.5rem;justify-content:center;background:#f2f4f8;padding:.55rem 1rem;font-size:.8rem;color:#333}
.usps b{color:${sj.kleur1}}
header{background:${sj.kleur1};padding:1rem 1.5rem;display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap}
.logo{color:#fff;font-size:1.5rem;font-weight:800;letter-spacing:-.02em;white-space:nowrap}
.logo b{color:${sj.accent}}
.zoek{flex:1;min-width:220px;background:#fff;border-radius:999px;padding:.7rem 1.2rem;color:#98a2b3;font-size:.9rem;display:flex;justify-content:space-between;align-items:center}
.iconen{color:#fff;font-size:1.25rem;display:flex;gap:1rem}
nav{display:flex;gap:1.6rem;flex-wrap:wrap;padding:.8rem 1.5rem;border-bottom:1px solid #e6e9ef;font-size:.9rem;font-weight:600;color:${sj.kleur1}}
.hero{margin:1.5rem;display:grid;grid-template-columns:1.2fr 1fr;gap:1rem;background:linear-gradient(105deg,#fde9d9 55%,#fbd3ae);border-radius:1rem;padding:2.5rem 2rem;align-items:center}
.hero h1{font-size:clamp(1.8rem,4.5vw,3rem);color:${sj.kleur1};line-height:1.05;font-weight:800}
.hero p{margin-top:.8rem;color:#374151;font-size:1.05rem}
.knop{display:inline-block;margin-top:1.4rem;background:${sj.kleur1};color:#fff;font-weight:700;padding:.85rem 1.6rem;border-radius:.6rem;text-decoration:none}
.hero-beeld{font-size:clamp(3rem,8vw,5.5rem);text-align:center;letter-spacing:.2em}
.deals{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin:0 1.5rem 2rem}
.deal{position:relative;border-radius:.9rem;padding:1.4rem;overflow:hidden}
.deal h3{color:${sj.kleur1};font-size:1.02rem;margin-top:.7rem}
.deal p{font-size:.85rem;color:#4b5563;margin-top:.3rem}
.badge{position:absolute;top:.9rem;right:.9rem;background:#e02b2b;color:#fff;font-size:.7rem;font-weight:800;border-radius:999px;padding:.35rem .6rem}
.deal-emoji{font-size:2.2rem}
.deal-pijl{position:absolute;bottom:.9rem;right:.9rem;background:${sj.kleur1};color:#fff;width:1.7rem;height:1.7rem;border-radius:.4rem;display:flex;align-items:center;justify-content:center;font-weight:700}
.cta{margin:0 1.5rem 2rem;background:${sj.kleur1};border-radius:1rem;color:#fff;padding:2.2rem;text-align:center}
.cta h2{font-size:1.5rem}
.cta p{margin-top:.5rem;opacity:.85}
.cta .knop{background:${sj.accent}}
footer{border-top:1px solid #e6e9ef;padding:1.5rem;text-align:center;font-size:.85rem;color:#667085}
@media(max-width:640px){.hero{grid-template-columns:1fr}}`;

  const body = `
  <div class="usps">${sj.usps.map((u) => `<span><b>✓</b> ${escapeHtml(u)}</span>`).join("")}</div>
  <header>
    <span class="logo">${escapeHtml(bedrijf.toLowerCase())}<b>.</b></span>
    <div class="zoek"><span>Waar ben je naar op zoek?</span><span>🔍</span></div>
    <div class="iconen"><span>♡</span><span>🛒</span></div>
  </header>
  <nav>${(sj.categorieen ?? []).map((c) => `<span>${escapeHtml(c)} ▾</span>`).join("")}</nav>
  <section class="hero">
    <div>
      <h1>${escapeHtml(sj.tagline)}</h1>
      <p>${escapeHtml(sj.subtitel)}</p>
      <a class="knop" href="#cta">${escapeHtml(sj.ctaKnop)}</a>
    </div>
    <div class="hero-beeld">🛍️📦🎧</div>
  </section>
  <section class="deals">${kaarten}</section>
  <section class="cta" id="cta">
    <h2>${escapeHtml(sj.ctaKop)}</h2>
    <p>${escapeHtml(sj.ctaTekst)}</p>
    <a class="knop" href="#cta">${escapeHtml(sj.ctaKnop)}</a>
  </section>
  <footer>${escapeHtml(bedrijf)}${plaats ? ` · ${escapeHtml(plaats)}` : ""} — prototype door Viesa Automations</footer>`;

  return wrap(`${escapeHtml(bedrijf)} — website-prototype`, css, body);
}

/* ============================ PREMIUM (stephex.com) ======================= */

function premiumWebsite({ bedrijf, plaats, sj }: Invoer): string {
  const kaarten = sj.diensten
    .map(
      (d, i) => `<article class="divisie">
        <span class="strepen" aria-hidden="true"></span>
        <div class="divisie-tekst">
          <h3>${escapeHtml(d.titel).toUpperCase()}</h3>
          <p>${escapeHtml(d.omschrijving)}</p>
        </div>
        <span class="nummer">0${i + 1}</span>
      </article>`,
    )
    .join("\n");

  const css = `
body{font-family:${FONT_SANS};background:${sj.licht};color:#101828}
.held{position:relative;min-height:88vh;display:flex;flex-direction:column;background:linear-gradient(160deg,${sj.kleur1},${sj.kleur2});color:#fff;overflow:hidden}
.held-nav{display:flex;justify-content:space-between;align-items:center;padding:1.6rem 2rem}
.merk{display:flex;align-items:center;gap:.8rem;font-weight:600;letter-spacing:.02em}
.merk-logo{background:#fff;color:${sj.kleur1};font-weight:900;padding:.35rem .6rem;font-size:1.05rem}
.held-nav-r{display:flex;align-items:center;gap:1.4rem;font-size:.9rem;opacity:.9}
.burger{background:#fff;width:2.6rem;height:2.6rem;display:flex;flex-direction:column;justify-content:center;gap:.32rem;padding:0 .55rem}
.burger i{display:block;height:2px;background:${sj.kleur1}}
.held-midden{flex:1;display:flex;flex-direction:column;justify-content:center;padding:2rem;max-width:60rem}
.held h1{font-size:clamp(2.2rem,6vw,4.2rem);font-weight:800;letter-spacing:-.01em;line-height:1.05;text-transform:uppercase}
.held p{margin-top:1.2rem;font-size:1.05rem;opacity:.8;max-width:34rem}
.scroll{align-self:center;padding-bottom:1.6rem;font-size:.8rem;letter-spacing:.15em;opacity:.7;text-align:center}
.scroll::before{content:"";display:block;width:1px;height:2.6rem;background:#fff;margin:0 auto .5rem}
.hoek{position:absolute;right:-2rem;bottom:-2rem;width:16rem;height:9rem;background:repeating-linear-gradient(45deg,rgba(255,255,255,.85) 0 6px,transparent 6px 16px)}
.divisies{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1rem;padding:2.5rem 1.5rem;max-width:75rem;margin:0 auto}
.divisie{position:relative;display:flex;align-items:center;gap:1.2rem;background:linear-gradient(120deg,${sj.kleur1},${sj.kleur2});color:#fff;padding:2.2rem 1.6rem;min-height:9.5rem}
.strepen{width:3.4rem;height:3.4rem;flex:none;background:repeating-linear-gradient(45deg,#fff 0 4px,transparent 4px 10px)}
.divisie h3{font-size:1.25rem;font-weight:800;letter-spacing:.03em}
.divisie p{margin-top:.4rem;font-size:.85rem;opacity:.75;max-width:24rem}
.nummer{position:absolute;top:1rem;right:1.2rem;background:#fff;color:#101828;font-weight:700;font-size:.95rem;padding:1.1rem .7rem}
.balk{display:flex;flex-wrap:wrap;justify-content:center;gap:.8rem;padding:0 1.5rem 2.5rem}
.balk span{border:1px solid rgba(16,24,40,.2);border-radius:999px;padding:.55rem 1.2rem;font-size:.85rem;font-weight:600;color:${sj.kleur1}}
.cta{background:${sj.kleur1};color:#fff;text-align:center;padding:3.2rem 1.5rem}
.cta h2{font-size:1.7rem;text-transform:uppercase;letter-spacing:.03em}
.cta p{margin-top:.6rem;opacity:.8}
.knop{display:inline-block;margin-top:1.4rem;background:${sj.accent};color:#fff;font-weight:700;padding:.9rem 1.9rem;text-decoration:none}
footer{padding:1.4rem;text-align:center;font-size:.8rem;color:#667085}`;

  const body = `
  <section class="held">
    <div class="held-nav">
      <span class="merk"><span class="merk-logo">${initialen(bedrijf)}</span> ${escapeHtml(bedrijf)}</span>
      <div class="held-nav-r"><span>◯ Contact</span><span>NL / EN</span><span class="burger"><i></i><i></i><i></i></span></div>
    </div>
    <div class="held-midden">
      <h1>${escapeHtml(sj.tagline)}</h1>
      <p>${escapeHtml(sj.subtitel)}</p>
    </div>
    <span class="scroll">SCROLL</span>
    <span class="hoek" aria-hidden="true"></span>
  </section>
  <section class="divisies">${kaarten}</section>
  <div class="balk">${sj.usps.map((u) => `<span>${escapeHtml(u)}</span>`).join("")}</div>
  <section class="cta">
    <h2>${escapeHtml(sj.ctaKop)}</h2>
    <p>${escapeHtml(sj.ctaTekst)}</p>
    <a class="knop" href="#">${escapeHtml(sj.ctaKnop)}</a>
  </section>
  <footer>${escapeHtml(bedrijf)}${plaats ? ` · ${escapeHtml(plaats)}` : ""} — prototype door Viesa Automations</footer>`;

  return wrap(`${escapeHtml(bedrijf)} — website-prototype`, css, body);
}

/* ============================= HORECA (decafes.nl) ======================== */

function horecaWebsite({ bedrijf, plaats, sj }: Invoer): string {
  const menuKolommen = sj.diensten
    .map(
      (d) => `<div class="kolom">
        <h3 class="script">${escapeHtml(d.titel)}</h3>
        <p>${escapeHtml(d.omschrijving).toUpperCase()}</p>
      </div>`,
    )
    .join("\n");

  const css = `
body{font-family:${FONT_SANS};background:${sj.kleur1};color:#f5efe6;min-height:100vh}
.script{font-family:${FONT_SCRIPT};color:${sj.accent};font-weight:400}
header{display:flex;justify-content:space-between;align-items:center;padding:1.4rem 1.8rem}
.logo{display:flex;flex-direction:column;align-items:center;line-height:1}
.logo-zegel{background:#b02a2a;color:#fff;font-weight:800;border-radius:1rem 1rem 1rem 0;padding:.55rem .7rem;font-size:1rem}
.logo .script{font-size:1.3rem;margin-top:.2rem}
.knoppen{display:flex;gap:.7rem;align-items:center}
.pil{background:#b02a2a;color:#fff;font-weight:600;border-radius:999px;padding:.65rem 1.4rem;font-size:.9rem}
.rond{background:#000;color:#fff;width:2.6rem;height:2.6rem;border-radius:999px;display:flex;align-items:center;justify-content:center}
.held{text-align:center;padding:4.5rem 1.5rem 3.5rem;position:relative}
.held .script{font-size:clamp(1.6rem,4vw,2.6rem)}
.held h1{font-size:clamp(2rem,6vw,4rem);text-transform:uppercase;letter-spacing:.02em;margin-top:.4rem;font-weight:800}
.held .sub{margin-top:1rem;opacity:.7;font-size:1rem}
.watermerk{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:clamp(3rem,10vw,7rem);font-weight:900;color:rgba(255,255,255,.04);text-transform:uppercase;pointer-events:none;white-space:nowrap;overflow:hidden}
.menu{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:2.2rem;max-width:65rem;margin:0 auto;padding:1.5rem 1.8rem 3rem;text-align:center}
.kolom .script{font-size:1.7rem}
.kolom p{margin-top:.8rem;font-weight:700;letter-spacing:.04em;font-size:.85rem;line-height:1.9}
.info{max-width:34rem;margin:0 auto 3rem;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:1rem;padding:1.8rem;text-align:center}
.info h2{font-size:1.2rem;text-transform:uppercase;letter-spacing:.05em}
.info p{margin-top:.6rem;opacity:.75;font-size:.9rem}
.info .pil{display:inline-block;margin-top:1.2rem;text-decoration:none}
.usps{display:flex;flex-wrap:wrap;justify-content:center;gap:1.6rem;padding:0 1.5rem 2.5rem;font-size:.85rem;opacity:.75}
footer{border-top:1px solid rgba(255,255,255,.12);padding:1.4rem;text-align:center;font-size:.8rem;opacity:.55}`;

  const body = `
  <header>
    <span class="logo"><span class="logo-zegel">${initialen(bedrijf)}</span><span class="script">${escapeHtml(bedrijf.split(/\s+/)[0])}</span></span>
    <span class="knoppen"><span class="pil">${escapeHtml(sj.ctaKnop)}</span><span class="rond">≡</span></span>
  </header>
  <section class="held">
    <span class="watermerk">${escapeHtml(sj.tagline)}</span>
    <p class="script">Welkom bij</p>
    <h1>${escapeHtml(bedrijf)}</h1>
    <p class="sub">${escapeHtml(sj.tagline)}${plaats ? ` · ${escapeHtml(plaats)}` : ""}</p>
  </section>
  <section class="menu">${menuKolommen}</section>
  <section class="info">
    <h2>${escapeHtml(sj.ctaKop)}</h2>
    <p>${escapeHtml(sj.ctaTekst)}</p>
    <a class="pil" href="#">${escapeHtml(sj.ctaKnop)}</a>
  </section>
  <div class="usps">${sj.usps.map((u) => `<span>✦ ${escapeHtml(u)}</span>`).join("")}</div>
  <footer>${escapeHtml(bedrijf)}${plaats ? ` · ${escapeHtml(plaats)}` : ""} — prototype door Viesa Automations</footer>`;

  return wrap(`${escapeHtml(bedrijf)} — website-prototype`, css, body);
}

/* ============================ CORPORATE (novar.nl) ======================== */

function corporateWebsite({ bedrijf, plaats, sj }: Invoer): string {
  const kaarten = sj.diensten
    .map(
      (d) => `<article class="kaart">
        <span class="kaart-icoon">${d.icoon}</span>
        <h3>${escapeHtml(d.titel)}</h3>
        <p>${escapeHtml(d.omschrijving)}</p>
      </article>`,
    )
    .join("\n");

  const stappen = ["Kennismaken", "Plan & afspraak", "Uitvoering & nazorg"]
    .map(
      (s, i) => `<div class="stap">
        <span class="stap-nr">${i + 1}</span>
        <p>${escapeHtml(s)}</p>
      </div>`,
    )
    .join("\n");

  const css = `
body{font-family:${FONT_SANS};background:#fff;color:#101828}
header{display:flex;justify-content:space-between;align-items:center;padding:1.4rem 2rem;border-bottom:1px solid #eef1f5}
.merk{display:flex;align-items:center;gap:.7rem;font-weight:700;color:${sj.kleur1}}
.merk-logo{background:${sj.kleur1};color:#fff;font-weight:900;border-radius:.4rem;padding:.35rem .55rem}
nav{display:flex;gap:1.6rem;font-size:.9rem;color:#475467}
.held{max-width:70rem;margin:0 auto;padding:4.5rem 2rem 3rem;display:grid;grid-template-columns:1.1fr .9fr;gap:2.5rem;align-items:center}
.held h1{font-size:clamp(2rem,5vw,3.4rem);font-family:${FONT_SERIF};color:${sj.kleur1};line-height:1.1}
.held h1::after{content:"";display:block;width:4.5rem;height:.3rem;background:${sj.accent};margin-top:1rem}
.held p{margin-top:1.2rem;color:#475467;font-size:1.05rem;max-width:32rem}
.knop{display:inline-block;margin-top:1.6rem;background:${sj.kleur1};color:#fff;font-weight:600;padding:.9rem 1.7rem;border-radius:.5rem;text-decoration:none}
.held-vlak{background:linear-gradient(140deg,${sj.kleur1},${sj.kleur2});border-radius:1.2rem;min-height:16rem;display:flex;align-items:center;justify-content:center;font-size:4rem}
.sectie{background:${sj.licht};padding:3rem 2rem}
.sectie-inner{max-width:70rem;margin:0 auto}
.sectie h2{font-family:${FONT_SERIF};color:${sj.kleur1};font-size:1.7rem;text-align:center}
.kaarten{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.2rem;margin-top:2rem}
.kaart{background:#fff;border-radius:.9rem;padding:1.6rem;box-shadow:0 1px 4px rgba(16,24,40,.08)}
.kaart-icoon{font-size:1.8rem}
.kaart h3{margin-top:.8rem;color:${sj.kleur1};font-size:1.05rem}
.kaart p{margin-top:.4rem;color:#475467;font-size:.9rem}
.stappen{display:flex;flex-wrap:wrap;justify-content:center;gap:2.5rem;padding:2.6rem 2rem}
.stap{text-align:center}
.stap-nr{display:inline-flex;width:2.6rem;height:2.6rem;border-radius:999px;background:${sj.accent};color:#fff;font-weight:800;align-items:center;justify-content:center;font-size:1.1rem}
.stap p{margin-top:.6rem;font-weight:600;color:${sj.kleur1};font-size:.95rem}
.cta{background:${sj.kleur1};color:#fff;text-align:center;padding:3rem 2rem}
.cta h2{font-family:${FONT_SERIF};font-size:1.7rem}
.cta p{margin-top:.6rem;opacity:.85}
.cta .knop{background:${sj.accent}}
footer{padding:1.4rem;text-align:center;font-size:.8rem;color:#667085}
@media(max-width:700px){.held{grid-template-columns:1fr}}`;

  const body = `
  <header>
    <span class="merk"><span class="merk-logo">${initialen(bedrijf)}</span>${escapeHtml(bedrijf)}</span>
    <nav><span>Diensten</span><span>Werkwijze</span><span>Over ons</span><span>Contact</span></nav>
  </header>
  <section class="held">
    <div>
      <h1>${escapeHtml(sj.tagline)}</h1>
      <p>${escapeHtml(sj.subtitel)}</p>
      <a class="knop" href="#">${escapeHtml(sj.ctaKnop)}</a>
    </div>
    <div class="held-vlak">${sj.diensten[0]?.icoon ?? "✨"}</div>
  </section>
  <section class="sectie"><div class="sectie-inner">
    <h2>Wat we doen</h2>
    <div class="kaarten">${kaarten}</div>
  </div></section>
  <section class="stappen">${stappen}</section>
  <section class="cta">
    <h2>${escapeHtml(sj.ctaKop)}</h2>
    <p>${escapeHtml(sj.ctaTekst)}</p>
    <a class="knop" href="#">${escapeHtml(sj.ctaKnop)}</a>
  </section>
  <footer>${escapeHtml(bedrijf)}${plaats ? ` · ${escapeHtml(plaats)}` : ""} — prototype door Viesa Automations</footer>`;

  return wrap(`${escapeHtml(bedrijf)} — website-prototype`, css, body);
}

/* ============================ VERHAAL (patagonia) ========================= */

function verhaalWebsite({ bedrijf, plaats, sj }: Invoer): string {
  const blokken = sj.diensten
    .map(
      (d, i) => `<section class="blok${i % 2 ? " blok-om" : ""}">
        <div class="blok-vlak">${d.icoon}</div>
        <div class="blok-tekst">
          <h2>${escapeHtml(d.titel)}</h2>
          <p>${escapeHtml(d.omschrijving)}</p>
        </div>
      </section>`,
    )
    .join("\n");

  const css = `
body{font-family:${FONT_SANS};background:#fff;color:#101828}
.held{min-height:80vh;display:flex;flex-direction:column;background:linear-gradient(180deg,${sj.kleur2},${sj.kleur1});color:#fff}
.held-nav{display:flex;justify-content:space-between;align-items:center;padding:1.5rem 2rem;font-weight:600}
.held-nav span:last-child{font-size:1.3rem}
.held-midden{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:2rem}
.held h1{font-size:clamp(2rem,6vw,3.8rem);font-family:${FONT_SERIF};max-width:44rem;line-height:1.15}
.held p{margin-top:1.1rem;opacity:.85;max-width:34rem;font-size:1.05rem}
.knop{display:inline-block;margin-top:1.8rem;background:#fff;color:${sj.kleur1};font-weight:700;padding:.9rem 1.9rem;border-radius:.4rem;text-decoration:none}
.blok{display:grid;grid-template-columns:1fr 1fr;max-width:72rem;margin:0 auto;min-height:20rem}
.blok-vlak{background:linear-gradient(150deg,${sj.kleur1},${sj.kleur2});display:flex;align-items:center;justify-content:center;font-size:4.5rem;color:#fff}
.blok-tekst{display:flex;flex-direction:column;justify-content:center;padding:2.5rem}
.blok-om .blok-vlak{order:2}
.blok-tekst h2{font-family:${FONT_SERIF};color:${sj.kleur1};font-size:1.6rem}
.blok-tekst p{margin-top:.8rem;color:#475467;max-width:26rem}
.usps{display:flex;flex-wrap:wrap;justify-content:center;gap:.8rem;padding:2.5rem 1.5rem}
.usps span{border:1px solid rgba(16,24,40,.18);border-radius:999px;padding:.55rem 1.2rem;font-size:.85rem;font-weight:600;color:${sj.kleur1}}
.cta{background:${sj.licht};text-align:center;padding:3rem 2rem}
.cta h2{font-family:${FONT_SERIF};color:${sj.kleur1};font-size:1.7rem}
.cta p{margin-top:.6rem;color:#475467}
.cta .knop{background:${sj.accent};color:#fff}
footer{padding:1.4rem;text-align:center;font-size:.8rem;color:#667085}
@media(max-width:640px){.blok{grid-template-columns:1fr}.blok-om .blok-vlak{order:0}}`;

  const body = `
  <section class="held">
    <div class="held-nav"><span>${escapeHtml(bedrijf)}</span><span>≡</span></div>
    <div class="held-midden">
      <h1>${escapeHtml(sj.tagline)}</h1>
      <p>${escapeHtml(sj.subtitel)}</p>
      <a class="knop" href="#">${escapeHtml(sj.ctaKnop)}</a>
    </div>
  </section>
  ${blokken}
  <div class="usps">${sj.usps.map((u) => `<span>${escapeHtml(u)}</span>`).join("")}</div>
  <section class="cta">
    <h2>${escapeHtml(sj.ctaKop)}</h2>
    <p>${escapeHtml(sj.ctaTekst)}</p>
    <a class="knop" href="#">${escapeHtml(sj.ctaKnop)}</a>
  </section>
  <footer>${escapeHtml(bedrijf)}${plaats ? ` · ${escapeHtml(plaats)}` : ""} — prototype door Viesa Automations</footer>`;

  return wrap(`${escapeHtml(bedrijf)} — website-prototype`, css, body);
}

/* ================================ APP-MOCKUP ============================== */

function appMockup({ bedrijf, plaats, sj }: Invoer): string {
  const kaarten = sj.diensten
    .map(
      (d) => `<article class="app-kaart">
        <span class="app-icoon">${d.icoon}</span>
        <div><h3>${escapeHtml(d.titel)}</h3><p>${escapeHtml(d.omschrijving)}</p></div>
        <span class="app-pijl">›</span>
      </article>`,
    )
    .join("\n");

  const donker = sj.stijl === "horeca" || sj.stijl === "premium";

  const css = `
body{margin:0;background:#e6e9ee;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:${FONT_SANS}}
.telefoon{width:360px;max-width:92vw;height:720px;max-height:92vh;background:#0b0f14;border-radius:2.5rem;padding:.6rem;box-shadow:0 20px 50px rgba(0,0,0,.35)}
.scherm{background:${donker ? sj.kleur1 : "#f4f6f9"};border-radius:2rem;height:100%;overflow-y:auto;display:flex;flex-direction:column;color:${donker ? "#f5efe6" : "#101828"}}
.app-kop{background:linear-gradient(150deg,${sj.kleur1},${sj.kleur2});color:#fff;border-radius:2rem 2rem 1.4rem 1.4rem;padding:2.4rem 1.4rem 1.8rem;text-align:center}
.app-logo{display:inline-flex;background:rgba(255,255,255,.15);border-radius:1rem;width:3.4rem;height:3.4rem;align-items:center;justify-content:center;font-weight:900;font-size:1.2rem}
.app-kop h1{margin-top:.8rem;font-size:1.35rem;font-weight:800}
.app-kop p{margin-top:.4rem;font-size:.85rem;opacity:.8}
.app-cta{display:inline-block;margin-top:1.1rem;background:${sj.accent};color:#fff;font-weight:700;font-size:.85rem;padding:.65rem 1.4rem;border-radius:999px;text-decoration:none}
.app-body{flex:1;padding:1.1rem}
.app-body h2{font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;opacity:.55;margin:0 0 .7rem .2rem}
.app-kaart{display:flex;align-items:center;gap:.9rem;background:${donker ? "rgba(255,255,255,.07)" : "#fff"};border-radius:1rem;padding:.95rem;margin-bottom:.7rem;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.app-icoon{font-size:1.5rem}
.app-kaart h3{font-size:.92rem;margin:0}
.app-kaart p{font-size:.75rem;opacity:.65;margin:.15rem 0 0}
.app-pijl{margin-left:auto;opacity:.4;font-size:1.2rem}
.tabbar{display:flex;justify-content:space-around;background:${donker ? "rgba(255,255,255,.06)" : "#fff"};border-top:1px solid rgba(0,0,0,.06);padding:.7rem 0 1rem;border-radius:0 0 2rem 2rem;font-size:1.25rem}
.tabbar span{opacity:.45}
.tabbar span:first-child{opacity:1}`;

  const body = `
  <div class="telefoon"><div class="scherm">
    <header class="app-kop">
      <span class="app-logo">${initialen(bedrijf)}</span>
      <h1>${escapeHtml(bedrijf)}</h1>
      <p>${escapeHtml(sj.tagline)}${plaats ? ` · ${escapeHtml(plaats)}` : ""}</p>
      <a class="app-cta" href="#">${escapeHtml(sj.ctaKnop)}</a>
    </header>
    <div class="app-body">
      <h2>Wat we doen</h2>
      ${kaarten}
    </div>
    <nav class="tabbar"><span>🏠</span><span>${sj.diensten[0]?.icoon ?? "✨"}</span><span>💬</span><span>👤</span></nav>
  </div></div>`;

  return wrap(`${escapeHtml(bedrijf)} — app-prototype`, css, body);
}

/* ================================ PUBLIEK ================================= */

/** Bouwt direct (0 tokens) een prototype-pagina op basis van het branchesjabloon. */
export function bouwStatischPrototype(input: {
  bedrijf: string;
  plaats: string | null;
  branche: string | null;
  type: PrototypeType;
}): string {
  const sj = sjabloonVoor(input.branche);
  const invoer: Invoer = { bedrijf: input.bedrijf, plaats: input.plaats, sj };

  if (input.type === "app") return appMockup(invoer);

  switch (sj.stijl) {
    case "webshop":
      return webshopWebsite(invoer);
    case "premium":
      return premiumWebsite(invoer);
    case "horeca":
      return horecaWebsite(invoer);
    case "corporate":
      return corporateWebsite(invoer);
    case "verhaal":
      return verhaalWebsite(invoer);
  }
}
