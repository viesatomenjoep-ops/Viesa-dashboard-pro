import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import {
  offerteStatusToon,
  offerteStatusLabel,
  OFFERTE_STATUSSEN,
  type Offerte,
} from "@/lib/offertes";
import { werkOfferteBij, wijzigOfferteStatus, verwijderOfferte } from "../acties";

export default async function OfferteDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { opgeslagen?: string; fout?: string };
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("offertes")
    .select("*")
    .eq("id", params.id)
    .single();
  if (error || !data) notFound();
  const offerte = data as Offerte;

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Link href="/offertes" className="text-sm text-navy/60 hover:underline">
            ← Terug naar offertes
          </Link>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-navy">
            {offerte.nummer}
            <Badge toon={offerteStatusToon(offerte.status)}>
              {offerteStatusLabel(offerte.status)}
            </Badge>
          </h1>
        </div>
        <form action={verwijderOfferte.bind(null, offerte.id)}>
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
      {searchParams.fout && (
        <p className="mb-4 rounded-lg bg-oranje/10 px-3 py-2 text-sm text-oranje">
          {searchParams.fout}
        </p>
      )}

      <Kaart className="mb-6">
        <p className="mb-2 text-sm font-medium text-navy">Status wijzigen</p>
        <div className="flex flex-wrap gap-2">
          {OFFERTE_STATUSSEN.map((s) => (
            <form key={s.key} action={wijzigOfferteStatus.bind(null, offerte.id, s.key)}>
              <button
                type="submit"
                className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  offerte.status === s.key
                    ? "border-oranje bg-oranje/10 font-medium text-oranje"
                    : "border-navy/20 text-navy hover:bg-navy/5"
                }`}
              >
                {s.label}
              </button>
            </form>
          ))}
        </div>
      </Kaart>

      <form action={werkOfferteBij.bind(null, offerte.id)}>
        <Kaart>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-navy">Titel</label>
              <input
                name="titel"
                defaultValue={offerte.titel}
                required
                className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Bedrag (€)</label>
              <input
                name="bedrag"
                type="number"
                step="0.01"
                defaultValue={offerte.bedrag}
                className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Klant</label>
              <input
                name="klant"
                defaultValue={offerte.klant ?? ""}
                className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">
                PDF-link (Google Drive)
              </label>
              <input
                name="drive_pdf_url"
                type="url"
                defaultValue={offerte.drive_pdf_url ?? ""}
                placeholder="https://drive.google.com/..."
                className="w-full rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-navy">Inhoud offerte</label>
            <MarkdownEditor naam="inhoud_markdown" beginwaarde={offerte.inhoud_markdown} />
          </div>

          <div className="mt-5">
            <button
              type="submit"
              className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white hover:bg-oranje/90"
            >
              Opslaan
            </button>
          </div>
        </Kaart>
      </form>
    </>
  );
}
