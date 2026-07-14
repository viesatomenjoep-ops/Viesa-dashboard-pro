import { maakLead } from "./acties";

/** Compacte "snel een lead toevoegen"-balk — alleen bedrijfsnaam verplicht. */
export function SnelToevoegen() {
  return (
    <form
      action={maakLead}
      className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-navy/10 bg-white p-3 shadow-sm"
    >
      <input
        name="bedrijfsnaam"
        required
        placeholder="Bedrijfsnaam *"
        className="min-w-40 flex-1 rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
      />
      <input
        name="website"
        placeholder="Website"
        className="min-w-40 flex-1 rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
      />
      <input
        name="contact_naam"
        placeholder="Contactpersoon"
        className="min-w-40 flex-1 rounded-lg border border-navy/20 px-3 py-2 text-sm text-navy outline-none focus:border-navy"
      />
      <button
        type="submit"
        className="rounded-lg bg-oranje px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-oranje/90"
      >
        + Toevoegen
      </button>
    </form>
  );
}
