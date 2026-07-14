import Link from "next/link";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { LegeStaat } from "@/components/ui/LegeStaat";
import { createClient } from "@/lib/supabase/server";
import {
  DRIVE_LINK_TYPES,
  driveTypeLabel,
  type DriveLink,
  type DriveLinkType,
} from "@/lib/drivelinks";
import { datumKort } from "@/lib/format";
import { voegBestandToe, verwijderBestand } from "./acties";

export default async function BestandenPagina({
  searchParams,
}: {
  searchParams: { type?: string; fout?: string };
}) {
  const supabase = createClient();
  let links: DriveLink[] = [];
  let schemaOntbreekt = false;
  try {
    const { data, error } = await supabase
      .from("drive_links")
      .select("*")
      .eq("context_type", "algemeen")
      .order("created_at", { ascending: false });
    if (error) throw error;
    links = (data ?? []) as DriveLink[];
  } catch {
    schemaOntbreekt = true;
  }

  const filter = searchParams.type as DriveLinkType | undefined;
  const zichtbaar = filter ? links.filter((l) => l.type === filter) : links;

  return (
    <>
      <PaginaKop
        titel="Bestanden"
        omschrijving="Uitsluitend Google Drive-links — er worden nooit bestanden opgeslagen."
      />

      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">
          {searchParams.fout}
        </p>
      )}

      <form
        action={voegBestandToe}
        className="mb-6 grid gap-2 rounded-xl border border-navy/10 bg-white p-3 shadow-sm sm:grid-cols-[2fr_2fr_1fr_auto]"
      >
        <input
          name="titel"
          placeholder="Titel"
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        />
        <input
          name="url"
          type="url"
          required
          placeholder="https://drive.google.com/... *"
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        />
        <select
          name="type"
          className="rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
        >
          {DRIVE_LINK_TYPES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
        >
          + Toevoegen
        </button>
      </form>

      {/* Typefilter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <FilterLink actief={!filter} label="Alle" href="/bestanden" />
        {DRIVE_LINK_TYPES.map((t) => (
          <FilterLink
            key={t.key}
            actief={filter === t.key}
            label={t.label}
            href={`/bestanden?type=${t.key}`}
          />
        ))}
      </div>

      {schemaOntbreekt ? (
        <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Datamodel nog niet actief</p>
          <p className="mt-1 text-navy/70">Voer de migraties uit in de Supabase SQL Editor.</p>
        </div>
      ) : zichtbaar.length === 0 ? (
        <LegeStaat
          titel="Nog geen links"
          omschrijving="Voeg een Drive-, Sheet- of Doc-link toe hierboven."
        />
      ) : (
        <Kaart className="p-0">
          <ul>
            {zichtbaar.map((l, i) => (
              <li
                key={l.id}
                className={`flex items-center justify-between gap-3 px-5 py-3 ${
                  i > 0 ? "border-t border-navy/10" : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Badge toon="grijs">{driveTypeLabel(l.type)}</Badge>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-sm font-medium text-navy hover:underline"
                  >
                    {l.titel}
                  </a>
                </div>
                <div className="flex items-center gap-4">
                  <span className="hidden text-xs text-navy/40 sm:inline">
                    {datumKort(l.created_at)}
                  </span>
                  <form action={verwijderBestand.bind(null, l.id)}>
                    <button type="submit" className="text-navy/30 hover:text-red-500">
                      ×
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </Kaart>
      )}
    </>
  );
}

function FilterLink({
  actief,
  label,
  href,
}: {
  actief: boolean;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
        actief
          ? "border-navy bg-navy/5 font-medium text-navy"
          : "border-navy/20 text-navy/70 hover:bg-navy/5"
      }`}
    >
      {label}
    </Link>
  );
}
