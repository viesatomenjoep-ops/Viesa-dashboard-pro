import { PaginaKop } from "@/components/ui/PaginaKop";
import { createClient } from "@/lib/supabase/server";
import { type ChatBericht } from "@/lib/chat";
import { leesFout } from "@/lib/fout";
import { stuurBericht } from "./acties";
import { ChatVenster } from "./ChatVenster";

export const dynamic = "force-dynamic";

export default async function ChatPagina() {
  const supabase = createClient();
  let berichten: ChatBericht[] = [];
  let schemaOntbreekt = false;
  let foutmelding = "";
  try {
    const { data, error } = await supabase
      .from("chat_berichten")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) throw error;
    berichten = (data ?? []) as ChatBericht[];
  } catch (e) {
    schemaOntbreekt = true;
    foutmelding = leesFout(e);
  }

  return (
    <>
      <PaginaKop titel="Chat" omschrijving="Intern teamgesprek tussen Tom en Joep." />

      {schemaOntbreekt ? (
        <div className="rounded-xl border border-oranje/40 bg-oranje/5 p-4 text-sm text-navy">
          <p className="font-medium text-oranje">Datamodel nog niet actief</p>
          <p className="mt-1 text-navy/70">Voer 0031_chat.sql uit in de Supabase SQL Editor.</p>
          {foutmelding && <p className="mt-2 font-mono text-xs text-navy/50">Details: {foutmelding}</p>}
        </div>
      ) : (
        <ChatVenster berichten={berichten} stuurActie={stuurBericht} />
      )}
    </>
  );
}
