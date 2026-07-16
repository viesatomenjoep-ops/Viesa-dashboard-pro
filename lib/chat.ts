/** Types en helpers voor de interne chat (migratie 0031). */

export type ChatAfzender = "tom" | "joep" | "algemeen";

export type ChatBericht = {
  id: string;
  afzender: ChatAfzender;
  tekst: string;
  created_at: string;
};

export const CHAT_AFZENDERS: { key: ChatAfzender; label: string }[] = [
  { key: "tom", label: "Tom" },
  { key: "joep", label: "Joep" },
];

export function chatAfzenderLabel(a: ChatAfzender): string {
  if (a === "tom") return "Tom";
  if (a === "joep") return "Joep";
  return "Algemeen";
}
