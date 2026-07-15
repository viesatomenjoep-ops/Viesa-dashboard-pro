import { BEDRIJF } from "./bedrijf";

/**
 * Bouwt een Viesa-huisstijl e-mail (HTML) met logo + NAW-voettekst.
 * `bodyHtml` is de inhoud (mag simpele HTML/paragrafen bevatten).
 * `siteUrl` is nodig voor een absolute logo-URL (e-mailclients laden geen /public).
 */
export function emailHtml(opts: {
  titel: string;
  bodyHtml: string;
  siteUrl: string;
}): string {
  const logo = `${opts.siteUrl}${BEDRIJF.logo}`;
  return `<!doctype html>
<html lang="nl"><body style="margin:0;background:#F4F6F9;font-family:Arial,Helvetica,sans-serif;color:#19445B;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#fff;border:1px solid rgba(25,68,91,.1);border-radius:12px;overflow:hidden;">
      <div style="display:flex;align-items:center;gap:12px;padding:20px 24px;border-bottom:1px solid rgba(25,68,91,.1);">
        <img src="${logo}" alt="Viesa" width="40" height="44" style="display:block;" />
        <div>
          <div style="font-size:18px;font-weight:600;color:#19445B;">${BEDRIJF.naam}</div>
          <div style="font-size:12px;color:#19445B99;">${BEDRIJF.straat}, ${BEDRIJF.postcode} ${BEDRIJF.plaats}</div>
        </div>
      </div>
      <div style="padding:24px;">
        <h1 style="font-size:20px;margin:0 0 12px;color:#19445B;">${opts.titel}</h1>
        <div style="font-size:14px;line-height:1.6;color:#19445B;">${opts.bodyHtml}</div>
      </div>
      <div style="padding:16px 24px;border-top:1px solid rgba(25,68,91,.1);font-size:12px;color:#19445B80;">
        ${BEDRIJF.naam} · ${BEDRIJF.email} · ${BEDRIJF.telefoon}<br/>
        BTW ${BEDRIJF.btw} · ${BEDRIJF.contactpersonen.join(" · ")}
      </div>
    </div>
  </div>
</body></html>`;
}
