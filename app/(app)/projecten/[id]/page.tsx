import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Kaart } from "@/components/ui/Kaart";
import { Markdown } from "@/components/ui/Markdown";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { PROJECT_STATUSSEN, type Project, type Notitie } from "@/lib/projecten";
import { DRIVE_LINK_TYPES, driveTypeLabel, type DriveLink } from "@/lib/drivelinks";
import { datumKort } from "@/lib/format";
import {
  werkProjectBij,
  verwijderProject,
  maakNotitie,
  verwijderNotitie,
  voegProjectLinkToe,
  verwijderProjectLink,
} from "../acties";

export default async function ProjectDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { opgeslagen?: string };
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projecten")
    .select("*")
    .eq("id", params.id)
    .single();
  if (error || !data) notFound();
  const project = data as Project;

  const [{ data: nData }, { data: lData }] = await Promise.all([
    supabase
      .from("notities")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("drive_links")
      .select("*")
      .eq("context_type", "project")
      .eq("context_id", project.id)
      .order("created_at", { ascending: false }),
  ]);
  const notities = (nData ?? []) as Notitie[];
  const links = (lData ?? []) as DriveLink[];

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link href="/projecten" className="text-sm text-navy/60 hover:underline">
          ← Terug naar projecten
        </Link>
        <form action={verwijderProject.bind(null, project.id)}>
          <button
            type="submit"
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Verwijderen
          </button>
        </form>
      </div>

      {searchParams.opgeslagen && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Opgeslagen.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <form action={werkProjectBij.bind(null, project.id)}>
            <Kaart>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-navy">Naam</label>
                  <input
                    name="naam"
                    defaultValue={project.naam}
                    required
                    className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy">Status</label>
                  <select
                    name="status"
                    defaultValue={project.status}
                    className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                  >
                    {PROJECT_STATUSSEN.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-navy">Klant</label>
                <input
                  name="klant"
                  defaultValue={project.klant ?? ""}
                  className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                />
              </div>
              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-navy">Omschrijving</label>
                <textarea
                  name="omschrijving"
                  defaultValue={project.omschrijving ?? ""}
                  rows={3}
                  className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                />
              </div>
              <div className="mt-4">
                <button
                  type="submit"
                  className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
                >
                  Opslaan
                </button>
              </div>
            </Kaart>
          </form>

          <section>
            <h2 className="mb-3 text-lg font-medium text-navy">Notities</h2>
            <form action={maakNotitie.bind(null, project.id)} className="mb-4">
              <Kaart>
                <input
                  name="titel"
                  placeholder="Titel notitie"
                  className="mb-3 w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                />
                <MarkdownEditor naam="inhoud_markdown" hoogte={220} />
                <div className="mt-3">
                  <button
                    type="submit"
                    className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
                  >
                    Notitie toevoegen
                  </button>
                </div>
              </Kaart>
            </form>

            <div className="space-y-3">
              {notities.map((n) => (
                <Kaart key={n.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-navy">{n.titel}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-navy/40">{datumKort(n.created_at)}</span>
                      <form action={verwijderNotitie.bind(null, n.id, project.id)}>
                        <button type="submit" className="text-xs text-navy/40 hover:text-red-500">
                          Verwijderen
                        </button>
                      </form>
                    </div>
                  </div>
                  <Markdown tekst={n.inhoud_markdown} />
                </Kaart>
              ))}
            </div>
          </section>
        </div>

        <div>
          <Kaart>
            <h2 className="text-sm font-medium text-navy">Drive-links</h2>
            <form action={voegProjectLinkToe.bind(null, project.id)} className="mt-3 space-y-2">
              <input
                name="titel"
                placeholder="Titel"
                className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
              />
              <input
                name="url"
                type="url"
                required
                placeholder="https://drive.google.com/..."
                className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
              />
              <div className="flex gap-2">
                <select
                  name="type"
                  className="flex-1 rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
                >
                  {DRIVE_LINK_TYPES.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-lg bg-oranje px-3 py-2 text-sm font-medium text-white hover:bg-oranje/90"
                >
                  +
                </button>
              </div>
            </form>

            <ul className="mt-4 space-y-2">
              {links.length === 0 && <li className="text-sm text-navy/50">Nog geen links.</li>}
              {links.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2">
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-sm text-navy hover:underline"
                  >
                    {l.titel}
                    <span className="ml-1 text-xs text-navy/40">{driveTypeLabel(l.type)}</span>
                  </a>
                  <form action={verwijderProjectLink.bind(null, l.id, project.id)}>
                    <button type="submit" className="text-navy/30 hover:text-red-500">
                      ×
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </Kaart>
        </div>
      </div>
    </>
  );
}
