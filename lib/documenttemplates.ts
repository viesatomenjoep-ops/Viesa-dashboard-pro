/** Markdown-sjablonen voor auditverslagen en offertes (Viesa-huisstijl,
 *  enterprise-toon). Plaatshouders: [bedrijf], [datum], [naam]. */

export function auditVerslagTemplate(bedrijf = "[bedrijf]"): string {
  return `## Auditverslag — ${bedrijf}

**Uitgevoerd door:** Viesa Automations · www.viesa-automations.nl
**Datum:** [datum]

---

### 1. Managementsamenvatting
In dit verslag brengen we in kaart waar ${bedrijf} online snelheid, omzet en efficiëntie laat liggen — en hoe die terug te winnen is. We bouwen geen statische websites, maar systemen die de bedrijfsvoering versterken en werk uit handen nemen.

De grootste kansen op een rij:
1. **[Kans 1]** — verwachte impact: hoog.
2. **[Kans 2]** — verwachte impact: middel.
3. **[Kans 3]** — verwachte impact: middel.

### 2. Scope & aanpak
- Onderzocht: webshop/website, mobiele ervaring, klantcontact, interne processen en dataflows.
- Methode: technische scan + functionele beoordeling + benchmark tegen best practices in e-commerce (mede via onze partnership met Commerced).

### 3. Bevindingen

**3.1 Mobiele ervaring & app**
- Huidige situatie: [beschrijving].
- Kans: de webshop omzetten naar een volwaardige mobiele app voor een optimale ervaring op elk apparaat.

**3.2 Klantcontact & AI**
- Huidige situatie: [beschrijving].
- Kans: slimme AI-agents (chat en Voice AI) die klanten 24/7 direct en professioneel te woord staan.

**3.3 Workflow-automatisering**
- Huidige situatie: [beschrijving].
- Kans: systemen aan elkaar koppelen zodat handmatige taken verdwijnen en data altijd klopt.

**3.4 Kennis & data**
- Huidige situatie: [beschrijving].
- Kans: een intelligente kennisbank die bedrijfs- en productkennis ontsluit als bron voor AI.

### 4. Prioriteiten & verwachte impact
| Prioriteit | Onderdeel | Inspanning | Verwachte impact |
|---|---|---|---|
| 1 | [onderdeel] | [laag/middel/hoog] | [omzet/tijd/kwaliteit] |
| 2 | [onderdeel] | [laag/middel/hoog] | [omzet/tijd/kwaliteit] |
| 3 | [onderdeel] | [laag/middel/hoog] | [omzet/tijd/kwaliteit] |

### 5. Voorgesteld vervolg
Een schaalbaar platform dat staat als een huis en zichzelf continu optimaliseert. We stellen een gefaseerde aanpak voor, te beginnen bij prioriteit 1, zodat resultaat snel zichtbaar is.

### 6. Over Viesa Automations
Wij combineren technische e-commerce-expertise met slimme automatisering: app-ontwikkeling, AI-agents, workflow-automatisering en intelligente kennisbanken. Samen met onze partner **Commerced** leveren we techniek én diepgaande kennis van e-commerce-architecturen.

*Vragen over dit verslag? Neem gerust contact op via contact@viesa-automations.nl.*`;
}

export function offerteTemplate(bedrijf = "[bedrijf]"): string {
  return `## Offerte — ${bedrijf}

**Van:** Viesa Automations · www.viesa-automations.nl
**Datum:** [datum]

---

### Onze strategie voor ${bedrijf}
Bij Viesa maken we webshops slimmer en mobieler. We bouwen geen statische website, maar een systeem dat jouw bedrijfsvoering versterkt en werk uit handen neemt. Deze offerte is opgebouwd rond de kansen die we samen bespraken.

### Voorgestelde oplossing
**1. App-ontwikkeling**
Je webshop omgezet naar een volwaardige mobiele app — optimale ervaring op elk apparaat.

**2. Slimme AI-agents**
Chatbots en Voice AI die klanten 24/7 direct en professioneel te woord staan.

**3. Workflow-automatisering**
Je systemen aan elkaar gekoppeld; handmatige taken verdwijnen, je data klopt altijd.

**4. Intelligente kennisbank**
Je bedrijfs- en productkennis toegankelijk als bron voor AI, met antwoorden die precies bij je organisatie passen.

### Fasering
| Fase | Wat | Doorlooptijd |
|---|---|---|
| 1 | [onderdeel] | [x weken] |
| 2 | [onderdeel] | [x weken] |
| 3 | [onderdeel] | [x weken] |

### Investering
| Onderdeel | Bedrag |
|---|---|
| [onderdeel] | € [bedrag] |
| [onderdeel] | € [bedrag] |
| **Totaal (excl. btw)** | **€ [totaal]** |

### Waarom Viesa
Een schaalbaar platform dat staat als een huis en zichzelf continu optimaliseert. Via onze partnership met **Commerced** combineren we technische kracht met diepgaande e-commerce-kennis.

*Vragen of aanpassingen? We denken graag met je mee — contact@viesa-automations.nl.*`;
}
