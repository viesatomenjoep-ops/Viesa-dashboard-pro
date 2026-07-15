import Link from "next/link";
import { notFound } from "next/navigation";
import { PaginaKop } from "@/components/ui/PaginaKop";
import { Kaart } from "@/components/ui/Kaart";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Email = {
  id: string;
  richting: "uitgaand" | "inkomend";
  van: string | null;
  naar: string | null;
  onderwerp: string | null;
  tekst: string | null;
  status: string;
  created_at: string;
};

function datumLang(iso: string): string {
  return new Date(iso).toLocaleString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function MailDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("emails")
    .select("*")
    .eq("id", params.id)
    .single();
  if (error || !data) notFound();
  const e = data as Email;
  const uit = e.richting === "uitgaand";

  return (
    <>
      <PaginaKop
        titel="Bericht"
        actie={
          <Link
            href="/mail"
            className="rounded-lg border border-navy/20 px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5"
          >
            ← Naar inbox
          </Link>
        }
      />

      <Kaart>
        <div className="flex flex-wrap items-center gap-2 border-b border-navy/10 pb-4">
          <Badge toon={uit ? "navy" : "groen"}>{uit ? "Verzonden" : "Ontvangen"}</Badge>
          <h1 className="text-lg font-semibold text-navy">
            {e.onderwerp ?? "(geen onderwerp)"}
          </h1>
        </div>

        <dl className="mt-4 grid gap-1 text-sm">
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-navy/50">{uit ? "Aan" : "Van"}</dt>
            <dd className="text-navy">{uit ? e.naar ?? "—" : e.van ?? "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-navy/50">Datum</dt>
            <dd className="text-navy/70">{datumLang(e.created_at)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-navy/50">Status</dt>
            <dd className="text-navy/70">{e.status}</dd>
          </div>
        </dl>

        <div className="mt-6 whitespace-pre-wrap rounded-lg bg-achtergrond p-4 text-sm leading-relaxed text-navy">
          {e.tekst?.trim() ? e.tekst : "(geen tekstinhoud)"}
        </div>
      </Kaart>
    </>
  );
}
