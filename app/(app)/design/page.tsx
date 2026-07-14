import Link from "next/link";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { Kaart } from "@/components/ui/Kaart";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { githubConfig, lijstMap, leesBestand, type GithubFile } from "@/lib/github";
import { bewaarDesign } from "./acties";

const MAP = "design-systems";

export default async function DesignPagina({
  searchParams,
}: {
  searchParams: { pad?: string; opgeslagen?: string; fout?: string };
}) {
  const cfg = githubConfig();

  if (!cfg) {
    return (
      <>
        <PaginaKop
          titel="Design-editor"
          omschrijving="Bewerk de design-systems-bestanden met live preview en sync naar GitHub."
        />
        <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">GitHub-sync nog niet ingesteld</p>
          <p className="mt-1 text-navy/70">
            Zet <code className="rounded bg-navy/5 px-1">GITHUB_TOKEN</code>,{" "}
            <code className="rounded bg-navy/5 px-1">GITHUB_REPO</code> (owner/repo) en
            optioneel <code className="rounded bg-navy/5 px-1">GITHUB_BRANCH</code> in je
            omgeving. Gebruik een PAT met <em>contents: read and write</em>.
          </p>
        </div>
      </>
    );
  }

  // Detailweergave: één bestand bewerken.
  if (searchParams.pad) {
    let inhoud = "";
    let sha = "";
    let leesFout: string | null = null;
    try {
      const res = await leesBestand(cfg, searchParams.pad);
      inhoud = res.inhoud;
      sha = res.sha;
    } catch (e) {
      leesFout = e instanceof Error ? e.message : "Lezen mislukt.";
    }

    return (
      <>
        <div className="mb-6">
          <Link href="/design" className="text-sm text-navy/60 hover:underline">
            ← Terug naar bestanden
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-navy">{searchParams.pad}</h1>
        </div>

        {searchParams.opgeslagen && (
          <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Opgeslagen en gecommit naar GitHub.
          </p>
        )}
        {searchParams.fout && (
          <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">
            {searchParams.fout}
          </p>
        )}

        {leesFout ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {leesFout}
          </div>
        ) : (
          <form action={bewaarDesign}>
            <input type="hidden" name="pad" value={searchParams.pad} />
            <input type="hidden" name="sha" value={sha} />
            <Kaart>
              <MarkdownEditor naam="inhoud_markdown" beginwaarde={inhoud} hoogte={480} />
              <div className="mt-4">
                <button
                  type="submit"
                  className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
                >
                  Opslaan &amp; committen
                </button>
              </div>
            </Kaart>
          </form>
        )}
      </>
    );
  }

  // Lijstweergave.
  let bestanden: GithubFile[] = [];
  let lijstFout: string | null = null;
  try {
    bestanden = await lijstMap(cfg, MAP);
  } catch (e) {
    lijstFout = e instanceof Error ? e.message : "Map lezen mislukt.";
  }

  return (
    <>
      <PaginaKop
        titel="Design-editor"
        omschrijving={`Bestanden uit /${MAP} — bewerken met live preview en direct committen.`}
      />
      {lijstFout ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {lijstFout}
        </div>
      ) : bestanden.length === 0 ? (
        <LegeStaat titel="Geen markdown-bestanden gevonden" />
      ) : (
        <Kaart className="p-0">
          <ul>
            {bestanden.map((f, i) => (
              <li key={f.pad} className={i > 0 ? "border-t border-navy/10" : ""}>
                <Link
                  href={`/design?pad=${encodeURIComponent(f.pad)}`}
                  className="block px-5 py-3 text-sm text-navy hover:bg-navy/[0.02]"
                >
                  {f.naam}
                </Link>
              </li>
            ))}
          </ul>
        </Kaart>
      )}
    </>
  );
}
